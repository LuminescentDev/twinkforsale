import {
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";

interface LazyImageProps {
  src: string;
  alt: string;
  class?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  onClick$?: QRL<() => void>;
}

export const LazyImage = component$<LazyImageProps>(
  ({ src, alt, class: className, width, height, placeholder, onClick$ }) => {
    const imageRef = useSignal<HTMLImageElement>();
    const isLoaded = useSignal(false);
    const isInView = useSignal(false);
    const hasError = useSignal(false);

    // Intersection Observer to detect when image enters viewport
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      if (!imageRef.value) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              isInView.value = true;
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: "50px", // Start loading 50px before the image is visible
        },
      );

      observer.observe(imageRef.value);

      cleanup(() => {
        observer.disconnect();
      });
    });

    return (
      <div
        ref={imageRef}
        class={`relative overflow-hidden ${className || ""}`}
        onClick$={onClick$}
      >
        {/* Placeholder while loading */}
        {!isLoaded.value && (
          <div class="bg-gradient-to-br from-theme-accent-primary/10 via-theme-accent-secondary to-theme-accent-tertiary/10 absolute inset-0 flex items-center justify-center">
            {placeholder ? (
              <div class="text-4xl">{placeholder}</div>
            ) : (
              <div class="bg-gradient-to-br from-theme-accent-secondary/60 to-theme-accent-tertiary/60 h-8 w-8 animate-pulse rounded"></div>
            )}
          </div>
        )}

        {/* Error state */}
        {hasError.value && (
          <div class="bg-gradient-to-br from-theme-accent-primary/10 via-theme-accent-secondary to-theme-accent-tertiary/10 absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-2xl">❌</div>
              <div class="text-theme-text-muted text-xs mt-1">Failed to load</div>
            </div>
          </div>
        )}

        {/* Actual image - only load when in view */}
        {isInView.value && (
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            class={`transition-opacity duration-300 ${
              isLoaded.value ? "opacity-100" : "opacity-0"
            } ${className || ""}`}
            onLoad$={() => {
              isLoaded.value = true;
            }}
            onError$={() => {
              hasError.value = true;
            }}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
    );
  },
);

// Component for file type icons with lazy loading for images
export const FileTypeIcon = component$<{
  upload: any;
  size?: "sm" | "md" | "lg";
  onClick$?: QRL<() => void>;
}>(({ upload, size = "md", onClick$ }) => {
  const sizeClasses = {
    sm: "h-8 w-8 sm:h-10 sm:w-10",
    md: "h-12 w-12 sm:h-16 sm:w-16",
    lg: "aspect-square w-full",
  };

  const iconSizes = {
    sm: "text-sm sm:text-base",
    md: "text-2xl sm:text-3xl",
    lg: "text-6xl",
  };

  if (upload.mimeType.startsWith("image/")) {
    return (
      <LazyImage
        src={`/f/${upload.shortCode}?preview=true`}
        alt={upload.originalName}
        class={`${sizeClasses[size]} cursor-pointer overflow-hidden rounded-lg transition-all duration-300 hover:scale-110 object-cover`}        width={size === "lg" ? 400 : 80}
        height={size === "lg" ? 400 : 80}
        placeholder="🖼️"
        onClick$={onClick$}
      />
    );
  }

  // Non-image file types
  const getFileIcon = () => {
    if (upload.mimeType.startsWith("video/")) return "🎬";
    if (upload.mimeType.startsWith("audio/")) return "🎵";
    if (upload.mimeType.includes("pdf")) return "📄";
    if (
      upload.mimeType.includes("zip") ||
      upload.mimeType.includes("rar") ||
      upload.mimeType.includes("archive")
    )
      return "📦";
    if (upload.mimeType.includes("text")) return "📝";
    return "📄";
  };

  const getGradientClass = () => {
    if (upload.mimeType.startsWith("video/")) return "bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary";
    if (upload.mimeType.startsWith("audio/")) return "bg-gradient-to-br from-theme-accent-secondary to-theme-accent-tertiary";
    if (upload.mimeType.includes("pdf")) return "bg-gradient-to-br from-theme-accent-tertiary to-theme-accent-quaternary";
    if (
      upload.mimeType.includes("zip") ||
      upload.mimeType.includes("rar") ||
      upload.mimeType.includes("archive")
    )
      return "bg-gradient-to-br from-them-accent-quaternary to-theme-accent-primary";
    if (upload.mimeType.includes("text")) return "bg-gradient-to-br from-theme-accent-primary to-theme-accent-tertiary";
    return "glass";
  };

  return (
    <div
      class={`${getGradientClass()} ${sizeClasses[size]} flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300 hover:scale-105`}
      onClick$={onClick$}
    >
      <div class={iconSizes[size]}>{getFileIcon()}</div>
    </div>
  );
});
