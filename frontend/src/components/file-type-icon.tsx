import {
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";
import {
  Video,
  Music,
  FileText,
  FileArchive,
  FileCode,
  File as FileIcon,
  ImageOff,
} from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  class?: string;
  width?: number;
  height?: number;
  onClick$?: QRL<() => void>;
}

/**
 * Thumbnail that only fetches once it is near the viewport. Reserves its box
 * up front so a long file list does not shift as images arrive.
 */
export const LazyImage = component$<LazyImageProps>(
  ({ src, alt, class: className, width, height, onClick$ }) => {
    const holderRef = useSignal<HTMLElement>();
    const isLoaded = useSignal(false);
    const isInView = useSignal(false);
    const hasError = useSignal(false);

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      if (!holderRef.value) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              isInView.value = true;
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "150px" },
      );
      observer.observe(holderRef.value);
      cleanup(() => observer.disconnect());
    });

    return (
      <div
        ref={holderRef}
        class={cn(
          "bg-surface-subtle border-edge relative overflow-hidden border",
          className,
        )}
        onClick$={onClick$}
      >
        {hasError.value ? (
          <span class="text-ink-muted absolute inset-0 flex items-center justify-center">
            <ImageOff class="h-4 w-4" aria-hidden="true" />
          </span>
        ) : (
          isInView.value && (
            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              class={cn(
                "h-full w-full object-cover transition-opacity duration-150",
                isLoaded.value ? "opacity-100" : "opacity-0",
              )}
              onLoad$={() => (isLoaded.value = true)}
              onError$={() => (hasError.value = true)}
              loading="lazy"
              decoding="async"
            />
          )
        )}
      </div>
    );
  },
);

const sizeClasses = {
  sm: "h-9 w-9 rounded-[5px]",
  md: "h-11 w-11 rounded-surface",
  lg: "aspect-square w-full rounded-t-surface",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

function iconFor(mimeType: string) {
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.startsWith("audio/")) return Music;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar")
  )
    return FileArchive;
  if (
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("xml") ||
    mimeType.includes("html")
  )
    return FileCode;
  if (mimeType.startsWith("text/") || mimeType.includes("pdf")) return FileText;
  return FileIcon;
}

export interface FileTypeIconProps {
  upload: { mimeType: string; shortCode: string; originalName: string };
  size?: "sm" | "md" | "lg";
  onClick$?: QRL<() => void>;
}

/**
 * File thumbnail: the real image for image uploads, otherwise a quiet tile
 * carrying a type icon. Type is also stated in text next to it, so the icon is
 * recognition support rather than the only signal.
 */
export const FileTypeIcon = component$<FileTypeIconProps>(
  ({ upload, size = "md", onClick$ }) => {
    const isImage = upload.mimeType.startsWith("image/");

    if (isImage) {
      return (
        <LazyImage
          src={`/f/${upload.shortCode}?preview=true`}
          alt=""
          class={cn(sizeClasses[size], onClick$ && "cursor-pointer")}
          width={size === "lg" ? 480 : 96}
          height={size === "lg" ? 480 : 96}
          onClick$={onClick$}
        />
      );
    }

    const Icon = iconFor(upload.mimeType);
    return (
      <div
        aria-hidden="true"
        class={cn(
          "bg-surface-subtle border-edge text-ink-muted flex shrink-0 items-center justify-center border",
          sizeClasses[size],
        )}
      >
        <Icon class={iconSizes[size]} />
      </div>
    );
  },
);
