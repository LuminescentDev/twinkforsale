import {
  $,
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";
import {
  Download,
  ExternalLink,
  Image as ImageIcon,
  X,
} from "lucide-icons-qwik";
import { IconButton } from "~/components/ui";

export interface ImagePreviewProps {
  isOpen: boolean;
  imageUrl: string;
  imageName?: string;
  onClose: QRL<() => void>;
}

export const ImagePreview = component$<ImagePreviewProps>(
  ({ isOpen, imageUrl, imageName, onClose }) => {
    const imageLoaded = useSignal(false);
    const dialogRef = useSignal<HTMLDialogElement>();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(
      ({ track }) => {
        const dialog = dialogRef.value;
        if (!dialog) return;
        const shouldOpen = track(() => isOpen);
        if (shouldOpen && !dialog.open) dialog.showModal();
        else if (!shouldOpen && dialog.open) dialog.close();
      },
      { strategy: "document-ready" },
    );

    const handleDownload = $(() => {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = imageName || "image";
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

    const handleExternalView = $(() => {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
    });

    return (
      <dialog
        ref={dialogRef}
        aria-label={imageName ? `Preview of ${imageName}` : "Image preview"}
        onClose$={onClose}
        onClick$={(event, dialog) => {
          if (event.target === dialog) dialog.close();
        }}
        class="rounded-dialog border-edge bg-surface text-ink shadow-pop m-auto max-h-[95vh] w-[calc(100vw-2rem)] max-w-6xl overflow-hidden border p-0 backdrop:backdrop-blur-[2px]"
      >
        <div class="border-edge flex items-center justify-between gap-3 border-b px-4 py-3">
          <div class="flex min-w-0 items-center gap-3">
            <span class="bg-accent-soft text-accent-text rounded-surface flex h-8 w-8 shrink-0 items-center justify-center">
              <ImageIcon class="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 class="text-ink truncate text-sm font-semibold">
              {imageName || "Image preview"}
            </h2>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <IconButton
              size="sm"
              label="Download image"
              onClick$={handleDownload}
            >
              <Download class="h-4 w-4" />
            </IconButton>
            <IconButton
              size="sm"
              label="Open image in a new tab"
              onClick$={handleExternalView}
            >
              <ExternalLink class="h-4 w-4" />
            </IconButton>
            <IconButton
              size="sm"
              label="Close image preview"
              onClick$={() => dialogRef.value?.close()}
            >
              <X class="h-4 w-4" />
            </IconButton>
          </div>
        </div>

        <div class="bg-surface-subtle relative flex min-h-72 items-center justify-center">
          {!imageLoaded.value && (
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span
                class="border-accent h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
                aria-hidden="true"
              />
              <p class="text-ink-muted text-sm">Loading image…</p>
            </div>
          )}
          {/* eslint-disable-next-line qwik/jsx-img */}
          <img
            src={imageUrl}
            alt={imageName || "Preview"}
            class={`max-h-[78vh] max-w-full object-contain transition-opacity duration-150 ${
              imageLoaded.value ? "opacity-100" : "opacity-0"
            }`}
            onLoad$={() => (imageLoaded.value = true)}
            onError$={() => (imageLoaded.value = true)}
          />
        </div>
      </dialog>
    );
  },
);
