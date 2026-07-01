import {
  component$,
  $,
  useSignal,
  useOnDocument,
  type QRL,
} from "@builder.io/qwik";
import { X, Download, ExternalLink } from "lucide-icons-qwik";

export interface ImagePreviewProps {
  isOpen: boolean;
  imageUrl: string;
  imageName?: string;
  onClose: QRL<() => void>;
}

export const ImagePreview = component$<ImagePreviewProps>(
  ({ isOpen, imageUrl, imageName, onClose }) => {
    const imageLoaded = useSignal(false);

    // ESC key handler using useOnDocument
    useOnDocument(
      "keydown",
      $((event: KeyboardEvent) => {
        if (isOpen && event.key === "Escape") {
          onClose();
        }
      }),
    );

    const handleBackdropClick = $((event: MouseEvent) => {
      // Only close if clicking the backdrop itself, not the modal content
      const target = event.target as HTMLElement;
      if (target.classList.contains("modal-backdrop")) {
        onClose();
      }
    });

    const handleDownload = $(() => {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = imageName || "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    const handleExternalView = $(() => {
      window.open(imageUrl, "_blank");
    });

    if (!isOpen) return null;

    return (
      <div
        class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity duration-300"
        onClick$={handleBackdropClick}
      >
        {" "}
        {/* Modal Content */}{" "}
        <div
          class="glass border-theme-card-border relative max-h-[95vh] max-w-[95vw] overflow-hidden rounded-3xl border"
          onClick$={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div class="border-theme-card-border flex items-center justify-between border-b bg-slate-900/50 p-4">
            <div class="flex items-center space-x-3">
              <div class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary flex h-8 w-8 items-center justify-center rounded-full">
                <div class="text-sm">🖼️</div>
              </div>
              <div>
                <h3 class="text-theme-text-primary max-w-[200px] truncate text-sm font-medium sm:max-w-[300px] sm:text-base">
                  {imageName || "Image Preview"}
                </h3>
                <p class="text-theme-text-secondary text-xs">
                  Click outside to close
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div class="flex items-center space-x-2">
              <button
                onClick$={handleDownload}
                class="text-theme-accent-primary hover:text-theme-text-primary hover:bg-theme-accent-primary/20 rounded-full p-2 transition-all duration-300"
                title="Download image"
              >
                <Download class="h-4 w-4" />
              </button>
              <button
                onClick$={handleExternalView}
                class="text-theme-accent-primary hover:text-theme-text-primary hover:bg-theme-accent-primary/20 rounded-full p-2 transition-all duration-300"
                title="Open in new tab"
              >
                <ExternalLink class="h-4 w-4" />
              </button>
              <button
                onClick$={onClose}
                class="rounded-full p-2 text-pink-300 transition-all duration-300 hover:bg-red-500/20 hover:text-white"
                title="Close preview"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Image Container */}
          <div class="relative flex min-h-[300px] items-center justify-center bg-black/20">
            {/* Loading State */}
            {!imageLoaded.value && (
              <div class="absolute inset-0 flex items-center justify-center">
                {" "}
                <div class="flex flex-col items-center space-y-3">
                  <div class="border-theme-accent h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
                  <p class="text-theme-text-secondary text-sm">Loading image...</p>
                </div>
              </div>
            )}            {/* Image */}
            {/* eslint-disable-next-line qwik/jsx-img */}
            <img
              src={imageUrl}
              alt={imageName || "Preview"}
              class={`max-h-[70vh] max-w-full object-contain transition-opacity duration-300 ${
                imageLoaded.value ? "opacity-100" : "opacity-0"
              }`}
              onLoad$={() => {
                imageLoaded.value = true;
              }}
              onError$={() => {
                imageLoaded.value = true;
              }}
              // Ensure GIFs play automatically
              style="image-rendering: auto;"
            />
          </div>{" "}
          {/* Footer */}
          <div class="border-theme-card-border border-t bg-slate-900/50 p-3">
            <div class="flex items-center justify-center text-center">
              <p class="text-theme-text-secondary text-xs">
                Press{" "}
                <kbd class="bg-theme-accent-primary/20 text-theme-accent-primary rounded px-1 py-0.5">
                  ESC
                </kbd>{" "}
                to close
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
