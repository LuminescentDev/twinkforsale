import type { RequestHandler } from "@builder.io/qwik-city";
import { db } from "~/lib/db";
import { getEnvConfig } from "~/lib/env";
import { updateDailyAnalytics } from "~/lib/analytics";
import { Upload } from "@prisma/client";
import { extractMediaDimensions, extractDimensionsFromBuffer } from "~/lib/media-utils";
import { formatBytes } from "~/lib/utils";
import { getFileProvider } from "~/lib/file-provider";
import path from "path";
import fs from "fs";

// Generate Discord embed HTML
function generateDiscordEmbed(upload: Upload, user: any, baseUrl: string, userStats?: { totalFiles: number, totalStorage: number, totalViews: number }) {
  // Helper function to replace placeholders
  const replacePlaceholders = (text: string) => {
    if (!text) return text;

    const uploadDate = new Date(upload.createdAt).toLocaleDateString();

    return text
      .replace(/\{filename\}/g, upload.originalName)
      .replace(/\{filesize\}/g, `${formatBytes(upload.size)}`)
      .replace(/\{filetype\}/g, upload.mimeType)
      .replace(/\{uploaddate\}/g, uploadDate)
      .replace(/\{views\}/g, upload.views.toString())
      .replace(/\{totalfiles\}/g, userStats?.totalFiles.toString() || '0')
      .replace(/\{totalstorage\}/g, `${formatBytes(userStats ? userStats.totalStorage : 0)}`)
      .replace(/\{totalviews\}/g, userStats?.totalViews.toLocaleString() || '0')
      .replace(/\{username\}/g, user?.name || 'Anonymous');
  };

  const embedTitle = replacePlaceholders(user?.settings?.embedTitle) || "File Upload";
  const embedDescription = replacePlaceholders(user?.settings?.embedDescription) || "Uploaded via twink.forsale";
  const embedColor = user?.settings?.embedColor || "#8B5CF6";
  const embedAuthor = replacePlaceholders(user?.settings?.embedAuthor) || user?.name;
  const embedFooter = replacePlaceholders(user?.settings?.embedFooter) || "twink.forsale";
  const showFileInfo = user?.settings?.showFileInfo !== false;
  const showUploadDate = user?.settings?.showUploadDate !== false;
  const showUserStats = user?.settings?.showUserStats === true;  // Build description with optional file info
  let description = embedDescription;
  if (showFileInfo) {
    description += `<br><br>📁 <strong>${upload.originalName}</strong><br>📏 ${formatBytes(upload.size)} • ${upload.mimeType}`;
  }
  if (showUploadDate) {
    const uploadDate = new Date(upload.createdAt).toLocaleDateString();
    description += `<br>📅 Uploaded ${uploadDate}`;
  }  if (showUserStats && userStats) {
    description += `<br><br>👤 <strong>User Stats</strong><br>📊 ${userStats.totalFiles} files uploaded • ${formatBytes(userStats.totalStorage)} used<br>👀 ${userStats.totalViews.toLocaleString()} total views`;
  }
  const domain = user?.settings?.customDomain || baseUrl.replace(/^https?:\/\//, '');  // Create plain text version for meta tags (Discord doesn't support HTML or markdown)
  let plainDescription = embedDescription;
  if (showFileInfo) {
    plainDescription += `\n${upload.originalName}\n${formatBytes(upload.size)} • ${upload.mimeType}`;
  }
  if (showUploadDate) {
    const uploadDate = new Date(upload.createdAt).toLocaleDateString();
    plainDescription += `\nUploaded ${uploadDate}`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${embedTitle}</title>
  <!-- Discord Embed Meta Tags -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${domain}">
  <meta property="og:title" content="${embedTitle}">  <meta property="og:description" content="${plainDescription}">
  <meta property="og:url" content="${upload.url}?direct=true">
  <meta name="theme-color" content="${embedColor}">
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${embedTitle}">  <meta name="twitter:description" content="${plainDescription}">  
  <meta property="og:image" content="${upload.url}?direct=true">
  <meta property="og:image:width" content="${upload.width || 498}">
  <meta property="og:image:height" content="${upload.height || 498}">
  <meta name="twitter:image" content="${upload.url}?direct=true">
  <meta name="twitter:image:alt" content="${embedTitle}">
  ${embedAuthor ? `<meta name="author" content="${embedAuthor}">` : ''}
  
  <!-- oEmbed alternate link for better platform support -->
  <link rel="alternate" href="${baseUrl}/api/oembed?url=${encodeURIComponent(upload.url)}" type="application/json+oembed" title="${embedTitle}">
  
  <!-- Auto-redirect for direct file access -->
  <script>
    // Check if this is a bot/crawler or direct browser access
    const userAgent = navigator.userAgent.toLowerCase();
    const isBotOrCrawler = /bot|crawler|spider|crawling|discord|telegram|whatsapp|facebook|twitter|slack/i.test(userAgent);
    
    if (!isBotOrCrawler) {
      // Redirect browsers to the actual file
      window.location.href = '${upload.url}?direct=true';
    }
  </script>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a1a;
      color: #ffffff;
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 600px;
      text-align: center;
    }
    .file-preview {
      background: #2a2a2a;
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
    }
    .file-info {
      color: #aaa;
      font-size: 14px;
      margin-top: 12px;
    }
    .download-btn {
      display: inline-block;
      background: ${embedColor};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 16px;
      transition: opacity 0.2s;
    }
    .download-btn:hover {
      opacity: 0.8;
    }
    img {
      max-width: 100%;
      max-height: 400px;
      border-radius: 8px;
    }
  </style>
</head>
<body>  <div class="container">
    <h1>${embedTitle}</h1>
    ${description !== embedTitle ? `<p style="color: #ccc; margin-bottom: 20px;">${description}</p>` : ''}
    <div class="file-preview">
      ${upload.mimeType.startsWith('image/') ?
      `<img src="${upload.url}?direct=true" alt="${upload.originalName}" />` :
      `<div style="font-size: 48px; margin-bottom: 16px;">📄</div>`
    }      <div class="file-info">
        <strong>${upload.originalName}</strong><br>
        ${formatBytes(upload.size)} • ${upload.mimeType}<br>
        ${upload.views} views • ${upload.downloads} downloads
      </div>
    </div>
    <a href="${upload.url}?direct=true" class="download-btn">Download File</a>
    ${embedFooter ? `<p style="color: #666; font-size: 12px; margin-top: 24px;">${embedFooter}</p>` : ''}
  </div>
</body>
</html>`;
}

export const onRequest: RequestHandler = async ({ params, send, status, url, request }) => {
  try {
    const shortCode = params.shortCode;

    if (!shortCode) {
      status(404);
      return;
    }

    // Check if this is a direct file request
    const isDirect = url.searchParams.get('direct') === 'true';

    // Find upload in database with user info for embed settings
    const upload = await db.upload.findUnique({
      where: { shortCode },
      include: { 
        user: {
          include: {
            settings: true
          }
        }
      }
    });

    if (!upload) {
      status(404);
      return;
    }
    // Update view count only for external views
    // Don't count views when accessed from our own dashboard/uploads/admin pages
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || '';

    // Check if this is an internal view from our dashboard/uploads pages
    const isInternalDashboardView = referrer.includes('/dashboard') ||
      referrer.includes('/uploads') ||
      referrer.includes('/admin');

    // Only increment views if:
    // 1. Not from our internal dashboard/admin pages (excludes image previews, etc.)
    // 2. Not a direct file request (which is usually for downloads)
    // This ensures we only count "real" external views and embeds
    if (!isInternalDashboardView && !isDirect) {
      // Get visitor info for analytics
      const ipAddress = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Create view log entry
      await db.viewLog.create({
        data: {
          uploadId: upload.id,
          ipAddress: ipAddress.split(',')[0].trim(), // Take first IP if multiple
          userAgent,
          referer: referrer || null,
        }
      }); await db.upload.update({
        where: { id: upload.id },
        data: {
          views: { increment: 1 },
          lastViewed: new Date()
        }
      });

      // Update daily analytics (async, don't wait for it)
      updateDailyAnalytics().catch(console.error);
    }    // Get file from storage (supports both filesystem and R2)
    const fileProvider = getFileProvider();
    const fileData = await fileProvider.getFile(upload.filename);

    if (!fileData) {
      status(404);
      return;
    }
    // If this is a direct file request, always serve the file directly
    // For non-direct requests, serve embed HTML for bots/crawlers, direct file for browsers
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
    const isBotOrCrawler = /bot|crawler|spider|crawling|discord|telegram|whatsapp|facebook|twitter|slack/i.test(userAgent); if (isDirect || (!isBotOrCrawler)) {
      // Track download when serving file directly
      if (isDirect || !isBotOrCrawler) {
        // Get visitor info for download analytics
        const ipAddress = request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          request.headers.get('cf-connecting-ip') ||
          'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Create download log entry
        await db.downloadLog.create({
          data: {
            uploadId: upload.id,
            ipAddress: ipAddress.split(',')[0].trim(), // Take first IP if multiple
            userAgent,
            referer: referrer || null,
          }
        });

        // Update download count
        await db.upload.update({
          where: { id: upload.id },
          data: {
            downloads: { increment: 1 },
            lastDownloaded: new Date()
          }
        });

        // Update daily analytics (async, don't wait for it)
        updateDailyAnalytics().catch(console.error);
      }      // Read and serve file directly from storage
      const headers: Record<string, string> = {
        "Content-Type": fileData.contentType,
        "Content-Length": fileData.size.toString(),
        "Content-Disposition": `inline; filename="${upload.originalName}"`,
        "Cache-Control": "public, max-age=31536000"
      };

      // Additional headers for GIFs to ensure proper playback
      if (upload.mimeType === 'image/gif') {
        headers["X-Content-Type-Options"] = "nosniff";
        headers["Accept-Ranges"] = "bytes";
        // Ensure proper caching for Discord
        headers["Cache-Control"] = "public, max-age=31536000, immutable";
      }

      const response = new Response(fileData.buffer, { headers });

      send(response);
      return;} else {
      // Generate and serve Discord embed HTML
      const config = getEnvConfig();
      const baseUrl = config.BASE_URL;      // Extract dimensions on-the-fly if missing and this is a media file
      let finalUpload = upload;
      if (!upload.width || !upload.height) {
        if (upload.mimeType.startsWith('image/') || upload.mimeType.startsWith('video/')) {
          try {
            // For R2 storage, we can extract dimensions from the buffer we already have
            // For filesystem, we need to read the file
            const config = getEnvConfig();
            let dimensions = null;
            
            if (config.USE_R2_STORAGE) {
              // Use the buffer we already have from fileData
              dimensions = await extractDimensionsFromBuffer(fileData.buffer, upload.mimeType);
            } else {
              // For filesystem, use the file path method
              const baseUploadDir = config.UPLOAD_DIR;
              
              let filePath: string;
              if (upload.userId) {
                filePath = path.join(baseUploadDir, upload.userId, upload.filename);
              } else {
                filePath = path.join(baseUploadDir, 'anonymous', upload.filename);
              }
              
              if (fs.existsSync(filePath)) {
                dimensions = await extractMediaDimensions(filePath, upload.mimeType);
              }
            }
            
            if (dimensions) {
              // Update the database with extracted dimensions
              await db.upload.update({
                where: { id: upload.id },
                data: {
                  width: dimensions.width,
                  height: dimensions.height
                }
              });
              
              // Update our local upload object
              finalUpload = {
                ...upload,
                width: dimensions.width,
                height: dimensions.height
              };
            }
          } catch (error) {
            console.error('Error extracting dimensions on-the-fly:', error);
          }
        }
      }

      // Fetch user statistics if the user wants to show them
      let userStats = undefined;
      if (upload.user?.settings?.showUserStats) {
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
          totalStorage: Number(totalStorageResult._sum.size || 0),
          totalViews: Number(totalViewsResult._sum.views || 0)
        };
      }

      const embedHtml = generateDiscordEmbed(finalUpload, upload.user, baseUrl, userStats);
      const response = new Response(embedHtml, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "public, max-age=300" // 5 minutes cache for embeds
        }
      });

      send(response);
      return;
    }

  } catch (error) {
    console.error("File serve error:", error);
    status(404);
  }
};
