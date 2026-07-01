import { component$ } from "@builder.io/qwik";
import { isEmojiIcon, getPredefinedIconPath } from "~/lib/bio-icons";

export interface BioLinkIconProps {
  icon?: string | null;
  class?: string;
  size?: number;
}

export const BioLinkIcon = component$<BioLinkIconProps>(
  ({ icon, class: className = "", size = 20 }) => {
    if (!icon) {
      return null;
    }

    // Check if it's an emoji
    if (isEmojiIcon(icon)) {
      return (
        <span 
          class={`bio-link-emoji ${className}`}
          style={{ fontSize: `${size}px` }}
        >
          {icon}
        </span>
      );
    }

    // Check if it's a predefined icon
    const iconPath = getPredefinedIconPath(icon);
    if (iconPath) {
      return (
        <img
          src={iconPath}
          alt={`${icon} icon`}
          class={`bio-link-icon ${className}`}
          width={size}
          height={size}
          style={{ 
            filter: 'brightness(0) invert(1)', // Make SVGs white by default
            width: `${size}px`,
            height: `${size}px`
          }}
        />
      );
    }

    // Fallback: treat as emoji even if detection failed
    return (
      <span 
        class={`bio-link-fallback ${className}`}
        style={{ fontSize: `${size}px` }}
      >
        {icon}
      </span>
    );
  }
);
