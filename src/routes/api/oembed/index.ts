import type { RequestHandler } from "@builder.io/qwik-city";
import { db } from "~/lib/db";
import { getEnvConfig } from "~/lib/env";

export const onGet: RequestHandler = async ({ url, json }) => {
  const requestUrl = url.searchParams.get('url');

  if (!requestUrl) {
    throw json(400, { error: "URL parameter is required" });
  }

  // Extract shortCode from the URL
  const urlPattern = /\/f\/([^/?]+)/;
  const match = requestUrl.match(urlPattern);

  if (!match) {
    throw json(400, { error: "Invalid URL format" });
  }

  const shortCode = match[1];

  try {
    // Find upload in database with user info
    const upload = await db.upload.findUnique({
      where: { shortCode },
      include: { user: true }
    });

    if (!upload) {
      throw json(404, { error: "Upload not found" });
    }

    const config = getEnvConfig();
    const baseUrl = config.BASE_URL;

    // Helper function to replace placeholders
    const replacePlaceholders = (text?: string | null, userStats?: { totalFiles: number, totalStorage: number, totalViews: number }) => {
      if (!text) return text;

      const fileSize = (upload.size / 1024 / 1024).toFixed(2);
      const uploadDate = new Date(upload.createdAt).toLocaleDateString();
      const storageUsedMB = userStats ? (userStats.totalStorage / 1024 / 1024).toFixed(2) : '0';

      return text
        .replace(/\{filename\}/g, upload.originalName)
        .replace(/\{filesize\}/g, `${fileSize} MB`)
        .replace(/\{filetype\}/g, upload.mimeType)
        .replace(/\{uploaddate\}/g, uploadDate)
        .replace(/\{views\}/g, upload.views.toString())
        .replace(/\{totalfiles\}/g, userStats?.totalFiles.toString() || '0')
        .replace(/\{totalstorage\}/g, `${storageUsedMB} MB`)
        .replace(/\{totalviews\}/g, userStats?.totalViews.toLocaleString() || '0')
        .replace(/\{username\}/g, upload.user?.name || 'Anonymous');
    };

    // Fetch user statistics if the user wants to show them
    let userStats = undefined;
    if (upload.user?.showUserStats) {
      const [totalFiles, totalStorageResult, totalViewsResult] = await Promise.all([
        db.upload.count({ where: { userId: upload.userId } }),
        db.upload.aggregate({
          where: { userId: upload.userId },
          _sum: { size: true }
        }),
        db.upload.aggregate({
          where: { userId: upload.userId },
          _sum: { views: true }
        })
      ]);

      userStats = {
        totalFiles,
        totalStorage: totalStorageResult._sum.size || 0,
        totalViews: totalViewsResult._sum.views || 0
      };
    }

    const embedTitle = replacePlaceholders(upload.user?.embedTitle, userStats) || "File Upload";
    const embedAuthor = upload.user?.embedAuthor || upload.user?.name;

    // Build provider name with user stats if enabled
    let providerName = upload.user?.embedFooter || "twink.forsale";
    if (upload.user?.showUserStats && userStats) {
      const storageUsedMB = (userStats.totalStorage / 1024 / 1024).toFixed(2);
      providerName = `📁 ${userStats.totalFiles} files   💾 ${storageUsedMB} MB   👁️ ${userStats.totalViews.toLocaleString()} views`;
    }

    // Build oEmbed response
    const oembedResponse: any = {
      version: "1.0",
      type: "rich",
      title: embedTitle,
      provider_name: providerName,
      provider_url: baseUrl,
      width: 400,
      height: 300
    };    // Add author info if available
    if (embedAuthor) {
      oembedResponse.author_name = embedAuthor;
      oembedResponse.author_url = requestUrl;
    }    // Add thumbnail for images
    if (upload.mimeType.startsWith('image/')) {
      oembedResponse.thumbnail_url = `${upload.url}?direct=true`;
      oembedResponse.thumbnail_width = upload.width || 400;
      oembedResponse.thumbnail_height = upload.height || 300;
      
      // For GIFs, also add video-like properties for better platform support
      if (upload.mimeType === 'image/gif') {
        oembedResponse.type = "video"; // Some platforms prefer this for animated content
        oembedResponse.html = `<img src="${upload.url}?direct=true" alt="${embedTitle}" style="max-width:100%;height:auto;" />`;
        oembedResponse.width = upload.width || 400;
        oembedResponse.height = upload.height || 300;
      }
    }

    throw json(200, oembedResponse);
  } catch (error) {
    // Check if this is an AbortMessage (successful json response) - just re-throw it
    if (error && typeof error === 'object' && error.constructor.name === 'AbortMessage') {
      throw error;
    }

    console.error("oEmbed error:", error);
    throw json(500, { error: "Internal server error" });
  }
};
