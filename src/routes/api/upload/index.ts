import type { RequestHandler } from "@builder.io/qwik-city";
import { db } from "~/lib/db";
import { generateUniqueShortCode, validateFile } from "~/lib/upload";
import { getEnvConfig } from "~/lib/env";
import { monitorUploadEvent, monitorFailedUpload } from "~/lib/system-monitoring";
import { nanoid } from "nanoid";
import { extractDimensionsFromBuffer } from "~/lib/media-utils";

export const onPost: RequestHandler = async ({ request, json }) => {
  // Check for API key authentication - now required
  const authHeader = request.headers.get("Authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey) {
    throw json(401, { error: "API key required. Please provide a valid API key in the Authorization header." });
  }

  // Validate API key and get user
  const keyRecord = await db.apiKey.findUnique({
    where: { key: apiKey, isActive: true },
    include: { user: true }
  });

  if (!keyRecord) {
    throw json(401, { error: "Invalid or inactive API key." });
  }

  // Check if user is approved
  if (!keyRecord.user.isApproved) {
    throw json(403, { error: "Account pending approval. Please wait for admin approval before uploading files." });
  }

  const userId = keyRecord.userId;
  // Update last used timestamp
  await db.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsed: new Date() }
  });

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    throw json(400, { error: "No file provided" });
  }  // Validate file
  const validation = validateFile(file);
  if (!validation.isValid) {
    // Monitor failed upload
    await monitorFailedUpload(userId, validation.error || "File validation failed", {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });
    throw json(400, { error: validation.error });
  }

  // Check user limits
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { 
      uploads: true,
      settings: true
    }
  });

  if(!user) {
    throw json(401, { error: "User not found" });
  }
  // Check upload count limit
  const maxUploads = user.settings?.maxUploads || 100;
  if (user.uploads.length >= maxUploads) {
    throw json(429, { error: "Upload limit exceeded" });
  }

  // Check file size limit
  const maxFileSize = user.settings?.maxFileSize || BigInt(10485760); // 10MB default
  if (file.size > Number(maxFileSize)) {
    throw json(413, { error: "File too large" });
  }
  const config = getEnvConfig();
  const userStorageLimit = user.settings?.maxStorageLimit || BigInt(config.BASE_STORAGE_LIMIT);
  const currentStorageUsed = user.settings?.storageUsed || BigInt(0);
  const totalStorage = currentStorageUsed + BigInt(file.size);
  if (totalStorage > userStorageLimit) {
    throw json(413, { error: "Storage quota exceeded" });
  }
  let useCuteWords = false;
  
  // Get user's preferences if authenticated
  let userExpirationDays = null;
  let userMaxViews = null;
  let userUploadDomain = null;
  let userCustomSubdomain = null;
  if (userId) {
    const userWithSettings = await db.user.findUnique({
      where: { id: userId },
      include: { 
        settings: {
          select: {
            useCustomWords: true, 
            defaultExpirationDays: true,
            defaultMaxViews: true,
            uploadDomainId: true,
            customSubdomain: true
          }
        }
      }
    });
    useCuteWords = userWithSettings?.settings?.useCustomWords || false;
    userExpirationDays = userWithSettings?.settings?.defaultExpirationDays;
    userMaxViews = userWithSettings?.settings?.defaultMaxViews;
    userUploadDomain = userWithSettings?.settings?.uploadDomainId;
    userCustomSubdomain = userWithSettings?.settings?.customSubdomain;
  }// Check for custom expiration and view limit overrides from form data
  const customExpirationDays = formData.get('expirationDays');
  const customMaxViews = formData.get('maxViews');
  
  // Use custom values if provided, otherwise use user defaults
  const finalExpirationDays = customExpirationDays 
    ? parseInt(customExpirationDays as string) 
    : userExpirationDays;  const finalMaxViews = customMaxViews 
    ? parseInt(customMaxViews as string) 
    : userMaxViews;
  const shortCode = await generateUniqueShortCode(useCuteWords);
  const deletionKey = nanoid(32);
  const filename = `${shortCode}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  // Save file to storage (supports both filesystem and R2)
  const { getStorageProvider } = await import("~/lib/storage-server");
  const storage = getStorageProvider();
  const uploadResult = await storage.uploadFile(file, filename, userId);

  if (!uploadResult.success) {
    throw json(500, { error: uploadResult.error || "File upload failed" });
  }
  // Extract dimensions for images and videos
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const dimensions = await extractDimensionsFromBuffer(fileBuffer, file.type);

  // Create database record
  const expiresAt = finalExpirationDays 
    ? new Date(Date.now() + finalExpirationDays * 24 * 60 * 60 * 1000)
    : null;


  const baseUrl = config.BASE_URL || 'https://twink.forsale';
  
  // Generate the appropriate URL based on user's domain settings
  let uploadUrl = `${baseUrl}/f/${shortCode}`;
  
  if (userUploadDomain) {
    // Get the user's selected domain
    const selectedDomain = await db.uploadDomain.findUnique({
      where: { id: userUploadDomain, isActive: true }
    });
    
    if (selectedDomain) {
      if (userCustomSubdomain && selectedDomain.supportsSubdomains) {
        // Use custom subdomain
        uploadUrl = `https://${userCustomSubdomain}.${selectedDomain.domain}/f/${shortCode}`;
      } else {
        // Use the base domain
        uploadUrl = `https://${selectedDomain.domain}/f/${shortCode}`;
      }
    }
  }

  const upload = await db.upload.create({
    data: {
      filename: uploadResult.key, // Store the storage key
      originalName: file.name,
      mimeType: file.type,
      size: BigInt(file.size),
      url: uploadUrl, // Use the generated URL
      shortCode,
      deletionKey,
      userId,
      expiresAt,
      maxViews: finalMaxViews,
      width: dimensions?.width,
      height: dimensions?.height
    }
  });

  // Update user storage in UserSettings
  if (userId) {
    await db.userSettings.upsert({
      where: { userId },
      update: {
        storageUsed: {
          increment: BigInt(file.size)
        }
      },
      create: {
        userId,
        storageUsed: BigInt(file.size)
      }
    });
  }

  // Monitor upload event for potential alerts
  await monitorUploadEvent(userId, file.size);  // Return ShareX-compatible response
  const response: any = {
    url: upload.url, // Use the generated URL
    deletion_url: `${baseUrl}/delete/${upload.deletionKey}`
  };
  
  // Add thumbnail URL for images
  if (file.type.startsWith("image/")) {
    response.thumbnail_url = upload.url;
  }

  throw json(201, response);
};
