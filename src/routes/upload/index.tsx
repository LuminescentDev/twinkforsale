import { component$, $, useSignal } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { 
  Upload, 
  Image, 
  Video, 
  FileText, 
  File as FileIcon,
  X,
  Copy,
  Eye,
  Trash2,
  Settings,
  Sparkle,
  ChevronDown,
  ChevronUp
} from "lucide-icons-qwik";

interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
  deletionUrl?: string;
  uploadProgress?: number;
}

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const useUserSession = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get("session");
  
  if (!session?.user?.email) {
    throw requestEvent.redirect(302, "/");
  }

  // Get user's API key and settings
  const { db } = await import("~/lib/db");
  
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      apiKeys: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      settings: true
    }
  });

  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  if (!user.isApproved) {
    throw requestEvent.redirect(302, "/dashboard?error=upload_not_approved");
  }

  const apiKey = user.apiKeys[0]?.key;
  
  if (!apiKey) {
    throw requestEvent.redirect(302, "/dashboard?error=no_api_key");
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      maxFileSize: user.settings?.maxFileSize ? Number(user.settings.maxFileSize) : 10485760,
      maxUploads: user.settings?.maxUploads || 100,
      storageUsed: user.settings?.storageUsed ? Number(user.settings.storageUsed) : 0,
      maxStorageLimit: user.settings?.maxStorageLimit ? Number(user.settings.maxStorageLimit) : 104857600,
    },
    apiKey,
    origin: requestEvent.url.origin
  };
});

export default component$(() => {
  const sessionData = useUserSession();

  // State management
  const files = useSignal<FileUpload[]>([]);
  const fileObjects = useSignal<Map<string, File>>(new Map());
  const isDragOver = useSignal(false);
  const showAdvancedSettings = useSignal(false);
  
  // Advanced settings
  const expirationDays = useSignal<number | null>(null);
  const maxViews = useSignal<number | null>(null);

  // Get file type icon component
  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('text/')) return FileText;
    return FileIcon;
  };

  // Generate unique ID
  const generateId = $(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  });

  // Handle file selection
  const handleFiles = $(async (fileList: FileList) => {
    const user = sessionData.value.user;
    const newFiles: FileUpload[] = [];
    const newFileObjects = new Map(fileObjects.value);
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Check for duplicate files (same name and size)
      const isDuplicate = files.value.some(f => 
        f.name === file.name && f.size === file.size
      );
      
      if (isDuplicate) {
        console.warn(`Duplicate file skipped: ${file.name}`);
        continue;
      }
      
      const id = await generateId();
      
      // Store the original File object
      newFileObjects.set(id, file);
      
      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          preview = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } catch (e) {
          console.warn('Failed to create preview:', e);
        }
      }
      
      // Validate file
      let status: FileUpload['status'] = 'pending';
      let error: string | undefined;
      
      if (file.size > user.maxFileSize) {
        status = 'error';
        error = `File too large. Max: ${formatFileSize(user.maxFileSize)}`;
      } else if (file.size === 0) {
        status = 'error';
        error = 'File is empty';
      } else if (file.name.length > 255) {
        status = 'error';
        error = 'Filename too long (max 255 characters)';
      }
      
      newFiles.push({
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        status,
        error
      });
    }
    
    // Update both files and file objects
    files.value = [...files.value, ...newFiles];
    fileObjects.value = newFileObjects;
  });

  // Upload a single file
  const uploadFile = $(async (fileUpload: FileUpload) => {
    const originalFile = fileObjects.value.get(fileUpload.id);
    
    if (!originalFile) {
      files.value = files.value.map(f => 
        f.id === fileUpload.id 
          ? { ...f, status: 'error' as const, error: 'File not found' }
          : f
      );
      return;
    }

    // Update status to uploading
    files.value = files.value.map(f => 
      f.id === fileUpload.id 
        ? { ...f, status: 'uploading' as const, error: undefined }
        : f
    );

    try {
      const formData = new FormData();
      formData.append('file', originalFile);
      
      // Add advanced settings if specified
      if (expirationDays.value) {
        formData.append('expirationDays', expirationDays.value.toString());
      }
      
      if (maxViews.value) {
        formData.append('maxViews', maxViews.value.toString());
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.value.apiKey}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update file with success data
      files.value = files.value.map(f => 
        f.id === fileUpload.id 
          ? { 
              ...f, 
              status: 'success' as const, 
              url: result.url,
              deletionUrl: result.deletion_url
            }
          : f
      );

      // Remove file object from memory after successful upload
      const newFileObjects = new Map(fileObjects.value);
      newFileObjects.delete(fileUpload.id);
      fileObjects.value = newFileObjects;

    } catch (error) {
      console.error('Upload error:', error);
      files.value = files.value.map(f => 
        f.id === fileUpload.id 
          ? { 
              ...f, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      );
    }
  });

  // Remove file from list
  const removeFile = $((id: string) => {
    files.value = files.value.filter(f => f.id !== id);
    // Also remove from file objects
    const newFileObjects = new Map(fileObjects.value);
    newFileObjects.delete(id);
    fileObjects.value = newFileObjects;
  });

  // Clear all files
  const clearAll = $(() => {
    files.value = [];
    fileObjects.value = new Map();
  });

  // Upload all pending files
  const uploadAll = $(async () => {
    const pendingFiles = files.value.filter(f => f.status === 'pending');
    
    // Upload files sequentially to avoid overwhelming the server
    for (const fileUpload of pendingFiles) {
      await uploadFile(fileUpload);
    }
  });

  // Copy URL to clipboard
  const copyUrl = $((url: string) => {
    navigator.clipboard.writeText(url);
    // Could add toast notification here
  });

  // Drag and drop handlers
  const handleDragOver = $((e: DragEvent) => {
    e.preventDefault();
    isDragOver.value = true;
  });

  const handleDragLeave = $(() => {
    isDragOver.value = false;
  });

  const handleDrop = $(async (e: DragEvent) => {
    e.preventDefault();
    isDragOver.value = false;
    
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      await handleFiles(droppedFiles);
    }
  });

  return (
    <div class="bg-theme-bg min-h-screen">
      <div class="container mx-auto px-4 py-8">
        {/* Header */}
        <div class="mb-8 text-center">
          <h1 class="text-gradient-cute mb-3 flex items-center justify-center gap-2 text-3xl font-bold sm:text-4xl">
            <Upload class="h-8 w-8" />
            File Upload~
            <Sparkle class="h-6 w-6" />
          </h1>
          <p class="text-theme-text-secondary text-base sm:text-lg">
            Drag and drop files or click to select files to upload! (◕‿◕)♡
          </p>
        </div>

        {/* User Info */}
        <div class="card-cute mb-6 rounded-2xl p-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 class="text-theme-text-primary font-medium">
                Welcome back, {sessionData.value.user.name}!
              </h3>
              <p class="text-theme-text-secondary text-sm">
                Storage: {formatFileSize(sessionData.value.user.storageUsed)} / {formatFileSize(sessionData.value.user.maxStorageLimit)}
              </p>
            </div>
            <div class="text-theme-text-secondary text-sm">
              Max file size: {formatFileSize(sessionData.value.user.maxFileSize)}
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div class="card-cute mb-6 rounded-2xl p-4">
          <button
            onClick$={() => showAdvancedSettings.value = !showAdvancedSettings.value}
            class="text-theme-text-primary hover:text-theme-accent-primary flex w-full items-center justify-between transition-colors"
          >
            <div class="flex items-center gap-2">
              <Settings class="h-5 w-5" />
              <span class="font-medium">Advanced Settings</span>
            </div>
            {showAdvancedSettings.value ? (
              <ChevronUp class="h-5 w-5" />
            ) : (
              <ChevronDown class="h-5 w-5" />
            )}
          </button>
          
          {showAdvancedSettings.value && (
            <div class="mt-4 space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="text-theme-text-primary mb-2 block text-sm font-medium">
                    Expiration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    placeholder="Never expires"
                    value={expirationDays.value || ''}
                    onInput$={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      expirationDays.value = value ? parseInt(value) : null;
                    }}
                    class="border-theme-card-border text-theme-text-primary w-full rounded-lg border bg-theme-bg-secondary/50 px-3 py-2 focus:border-theme-accent-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label class="text-theme-text-primary mb-2 block text-sm font-medium">
                    Max Views
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={maxViews.value || ''}
                    onInput$={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      maxViews.value = value ? parseInt(value) : null;
                    }}
                    class="border-theme-card-border text-theme-text-primary w-full rounded-lg border bg-theme-bg-secondary/50 px-3 py-2 focus:border-theme-accent-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div class="mb-6">
          <div
            class={`card-cute relative overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
              isDragOver.value 
                ? 'border-theme-accent-primary bg-theme-accent-primary/10' 
                : 'border-theme-card-border hover:border-theme-accent-primary/50'
            }`}
            onDragOver$={handleDragOver}
            onDragLeave$={handleDragLeave}
            onDrop$={handleDrop}
          >
            <input
              type="file"
              multiple
              onChange$={async (e) => {
                const input = e.target as HTMLInputElement;
                if (input.files && input.files.length > 0) {
                  await handleFiles(input.files);
                  input.value = ''; // Reset input
                }
              }}
              class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            
            <div class="pointer-events-none space-y-4">
              <div class="text-theme-accent-primary mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-theme-accent-primary/20 to-theme-accent-secondary/20">
                <Upload class="h-8 w-8" />
              </div>
              
              <div>
                <h3 class="text-theme-text-primary mb-2 text-lg font-medium">
                  Drop files here or click to select
                </h3>
                <p class="text-theme-text-secondary">
                  You can upload multiple files at once
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.value.length > 0 && (
          <div class="card-cute rounded-2xl p-6">
            {/* Summary Stats */}
            <div class="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-theme-bg-secondary/30 p-3 sm:grid-cols-4">
              <div class="text-center">
                <p class="text-theme-text-primary text-lg font-semibold">
                  {files.value.length}
                </p>
                <p class="text-theme-text-muted text-xs">Total</p>
              </div>
              <div class="text-center">
                <p class="text-theme-accent-secondary text-lg font-semibold">
                  {files.value.filter(f => f.status === 'pending').length}
                </p>
                <p class="text-theme-text-muted text-xs">Pending</p>
              </div>
              <div class="text-center">
                <p class="text-green-400 text-lg font-semibold">
                  {files.value.filter(f => f.status === 'success').length}
                </p>
                <p class="text-theme-text-muted text-xs">Uploaded</p>
              </div>
              <div class="text-center">
                <p class="text-red-400 text-lg font-semibold">
                  {files.value.filter(f => f.status === 'error').length}
                </p>
                <p class="text-theme-text-muted text-xs">Errors</p>
              </div>
            </div>
            
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-theme-text-primary text-lg font-medium">
                Files ({files.value.length})
              </h3>
              <div class="flex gap-2">
                <button
                  onClick$={uploadAll}
                  disabled={!files.value.some(f => f.status === 'pending')}
                  class="btn-cute flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  <Upload class="h-4 w-4" />
                  Upload All
                </button>
                <button
                  onClick$={clearAll}
                  class="text-theme-accent-primary hover:bg-theme-accent-primary/10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  <Trash2 class="h-4 w-4" />
                  Clear All
                </button>
              </div>
            </div>

            <div class="space-y-3">
              {files.value.map((fileUpload) => {
                const IconComponent = getFileTypeIcon(fileUpload.type);
                
                return (
                  <div
                    key={fileUpload.id}
                    class="border-theme-card-border flex items-center gap-4 rounded-lg border bg-theme-bg-secondary/30 p-4"
                  >
                    {/* File Icon/Preview */}
                    <div class="flex-shrink-0">
                      {fileUpload.preview ? (
                        <img 
                          src={fileUpload.preview} 
                          alt={fileUpload.name}
                          width="48"
                          height="48"
                          class="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div class="bg-gradient-to-br from-theme-accent-primary/20 to-theme-accent-secondary/20 flex h-12 w-12 items-center justify-center rounded-lg">
                          <IconComponent class="text-theme-accent-primary h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div class="min-w-0 flex-1">
                      <h4 class="text-theme-text-primary truncate font-medium">
                        {fileUpload.name}
                      </h4>
                      <p class="text-theme-text-secondary text-sm">
                        {formatFileSize(fileUpload.size)} • {fileUpload.type}
                      </p>
                      
                      {/* Status */}
                      {fileUpload.status === 'error' && fileUpload.error && (
                        <p class="text-red-400 mt-1 text-sm flex items-center gap-1">
                          <span class="text-xs">❌</span>
                          {fileUpload.error}
                        </p>
                      )}
                      {fileUpload.status === 'uploading' && (
                        <p class="text-theme-accent-secondary mt-1 text-sm flex items-center gap-1">
                          <span class="animate-spin text-xs">⏳</span>
                          Uploading...
                        </p>
                      )}
                      {fileUpload.status === 'success' && (
                        <p class="text-green-400 mt-1 text-sm flex items-center gap-1">
                          <span class="text-xs">✅</span>
                          Uploaded successfully!
                        </p>
                      )}
                      {fileUpload.status === 'pending' && (
                        <p class="text-theme-text-muted mt-1 text-sm flex items-center gap-1">
                          <span class="text-xs">⏸️</span>
                          Ready to upload
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div class="flex items-center gap-2">
                      {fileUpload.status === 'success' && fileUpload.url ? (
                        <>
                          <button
                            onClick$={() => copyUrl(fileUpload.url!)}
                            class="text-theme-accent-tertiary hover:bg-theme-accent-tertiary/10 rounded-lg p-2 transition-colors"
                            title="Copy URL"
                          >
                            <Copy class="h-4 w-4" />
                          </button>
                          <a
                            href={fileUpload.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-theme-accent-secondary hover:bg-theme-accent-secondary/10 rounded-lg p-2 transition-colors"
                            title="View file"
                          >
                            <Eye class="h-4 w-4" />
                          </a>
                        </>
                      ) : fileUpload.status === 'pending' && (
                        <button
                          onClick$={() => uploadFile(fileUpload)}
                          class="btn-cute text-theme-text-primary rounded-lg px-3 py-1 text-sm"
                        >
                          Upload
                        </button>
                      )}
                      
                      <button
                        onClick$={() => removeFile(fileUpload.id)}
                        class="text-theme-accent-primary hover:bg-theme-accent-primary/10 rounded-lg p-2 transition-colors"
                        title="Remove"
                      >
                        <X class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div class="card-cute mt-6 rounded-2xl p-6">
          <h3 class="text-theme-text-primary mb-4 font-medium">Quick Actions</h3>
          <div class="flex flex-wrap gap-3">
            <a
              href="/dashboard/uploads"
              class="text-theme-accent-secondary hover:bg-theme-accent-secondary/10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <FileIcon class="h-4 w-4" />
              View All Files
            </a>
            <a
              href="/dashboard"
              class="text-theme-accent-tertiary hover:bg-theme-accent-tertiary/10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Settings class="h-4 w-4" />
              Dashboard
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div class="card-cute mt-6 rounded-2xl p-6">
          <h3 class="text-theme-text-primary mb-4 flex items-center gap-2 font-medium">
            <Sparkle class="h-5 w-5" />
            How to Upload
          </h3>
          <div class="text-theme-text-secondary space-y-2 text-sm">
            <p>• Drag and drop files directly onto the upload area</p>
            <p>• Click the upload area to select files from your computer</p>
            <p>• Set expiration dates and view limits in Advanced Settings</p>
            <p>• Click "Upload" for individual files or "Upload All" for batch uploads</p>
            <p>• Files are uploaded to your account using your API key</p>
            <p>• Supported formats depend on your account settings</p>
          </div>
          
          <div class="bg-blue-500/10 border-blue-500/20 mt-4 rounded-lg border p-3">
            <p class="text-blue-400 text-sm">
              <strong>✨ Pro Tip:</strong> Your files are uploaded directly to the same API endpoint used by ShareX and other tools. 
              URLs and deletion keys will be generated automatically!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Upload Files~ - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Upload files with drag and drop support, expiration dates and view limits! (◕‿◕)♡",
    },
  ],
};