import { component$ } from "@builder.io/qwik";
import {
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  Code,
  DollarSign,
  Download,
  FileText,
  Gamepad2,
  Gift,
  Globe,
  Heart,
  Link as LinkGlyph,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  Rss,
  ShoppingBag,
  Star,
  Video,
} from "lucide-icons-qwik";
import { getBrandIconUrl, getIconDef } from "~/lib/bio-icons";
import { cn } from "~/lib/utils";

const GLYPHS: Record<string, typeof Globe> = {
  website: Globe,
  email: Mail,
  link: LinkGlyph,
  rss: Rss,
  shop: ShoppingBag,
  money: DollarSign,
  gift: Gift,
  heart: Heart,
  star: Star,
  chat: MessageCircle,
  phone: Phone,
  location: MapPin,
  calendar: Calendar,
  document: FileText,
  photo: Camera,
  video: Video,
  music: Music,
  game: Gamepad2,
  code: Code,
  work: Briefcase,
  book: BookOpen,
  download: Download,
};

export interface BioLinkIconProps {
  icon?: string | null;
  class?: string;
  size?: number;
  /** Overrides the inherited colour — used by the picker for brand tints. */
  color?: string;
}

/**
 * Renders a bio link icon: a brand mark (masked SVG so it takes the current
 * text colour), a Lucide glyph, or the raw emoji the user picked.
 */
export const BioLinkIcon = component$<BioLinkIconProps>(
  ({ icon, class: className, size = 20, color }) => {
    if (!icon) {
      return null;
    }

    const def = getIconDef(icon);

    if (def?.kind === "brand") {
      return (
        <span
          role="img"
          aria-label={def.label}
          class={cn("bio-link-icon bio-brand-icon", className)}
          style={{
            "--bio-icon-url": `url("${getBrandIconUrl(def.id)}")`,
            width: `${size}px`,
            height: `${size}px`,
            ...(color ? { color } : {}),
          }}
        />
      );
    }

    if (def?.kind === "glyph") {
      const Glyph = GLYPHS[def.id];
      if (Glyph) {
        return (
          <span
            role="img"
            aria-label={def.label}
            class={cn(
              "bio-link-icon inline-flex items-center justify-center",
              className,
            )}
            style={color ? { color } : undefined}
          >
            <Glyph size={size} />
          </span>
        );
      }
    }

    return (
      <span
        class={cn(
          "bio-link-emoji inline-flex items-center justify-center leading-none",
          className,
        )}
        style={{
          fontSize: `${size}px`,
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        {icon}
      </span>
    );
  },
);
