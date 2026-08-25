import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface SectionProps {
  /** Section title (18/24px). Omit for an unlabelled band of content. */
  title?: string;
  /** One short line under the title. Use only when it changes what the user does. */
  description?: string;
  /** Associates the heading with the region for assistive technology. */
  id?: string;
  class?: string;
}

/**
 * A flat region of a page: heading, optional description, an `actions` slot,
 * and content. Draws no border or background — grouping comes from spacing,
 * alignment and typography. This is the default; reach for `Surface` only when
 * a boundary is meaningful.
 */
export const Section = component$<SectionProps>(
  ({ title, description, id, class: className }) => {
    const headingId = id ? `${id}-title` : undefined;
    return (
      <section
        id={id}
        aria-labelledby={headingId}
        class={cn("min-w-0", className)}
      >
        {(title || description) && (
          <div class="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div class="min-w-0">
              {title && (
                <h2
                  id={headingId}
                  class="text-ink text-lg leading-6 font-semibold"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p class="text-ink-muted mt-1 max-w-prose text-[13px] leading-5">
                  {description}
                </p>
              )}
            </div>
            <div class="flex flex-wrap items-center gap-2 empty:hidden">
              <Slot name="actions" />
            </div>
          </div>
        )}
        <Slot />
      </section>
    );
  },
);

export interface SurfaceProps {
  /** `subtle` uses the inset fill instead of the raised surface colour. */
  tone?: "default" | "subtle";
  /** Remove padding for edge-to-edge tables and lists. */
  flush?: boolean;
  padding?: "sm" | "md" | "lg";
  class?: string;
}

const paddingMap: Record<NonNullable<SurfaceProps["padding"]>, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

/**
 * A bordered container for a genuine object or tool — a table, a queue, a
 * cohesive configuration group. 1px border, 8px radius, no shadow. Never nest
 * one inside another.
 */
export const Surface = component$<SurfaceProps>(
  ({ tone = "default", flush, padding = "md", class: className }) => (
    <div
      class={cn(
        "border-edge rounded-surface min-w-0 border",
        tone === "subtle" ? "bg-surface-subtle" : "bg-surface",
        !flush && paddingMap[padding],
        className,
      )}
    >
      <Slot />
    </div>
  ),
);

export interface SurfaceHeaderProps {
  title: string;
  description?: string;
  class?: string;
}

/** Header row for a flush `Surface`. Sits on the subtle fill above the body. */
export const SurfaceHeader = component$<SurfaceHeaderProps>(
  ({ title, description, class: className }) => (
    <div
      class={cn(
        "border-edge flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3",
        className,
      )}
    >
      <div class="min-w-0">
        <h3 class="text-ink truncate text-sm font-semibold">{title}</h3>
        {description && (
          <p class="text-ink-muted mt-0.5 text-xs">{description}</p>
        )}
      </div>
      <div class="flex flex-wrap items-center gap-2 empty:hidden">
        <Slot name="actions" />
      </div>
    </div>
  ),
);

export interface PreviewPaneProps {
  /** Labels what is being previewed, e.g. "Bio page preview". */
  label: string;
  /** Extra note shown next to the label (device width, "not saved yet", …). */
  note?: string;
  class?: string;
  bodyClass?: string;
}

/**
 * An explicit boundary around user-authored or externally-rendered content:
 * bio previews, Discord embed previews, image previews. 12px radius marks it
 * as a distinct object rather than part of the surrounding editor.
 */
export const PreviewPane = component$<PreviewPaneProps>(
  ({ label, note, class: className, bodyClass }) => (
    <div
      class={cn(
        "border-edge rounded-dialog bg-surface-subtle overflow-hidden border",
        className,
      )}
    >
      <div class="border-edge text-ink-muted flex items-center justify-between gap-3 border-b px-3 py-2 text-xs">
        <span class="font-medium tracking-wide uppercase">{label}</span>
        {note && <span class="truncate">{note}</span>}
      </div>
      <div class={cn("overflow-hidden", bodyClass)}>
        <Slot />
      </div>
    </div>
  ),
);

export interface PageProps {
  /** Working views run to 1600px; `narrow` is for setup flows and focused forms. */
  width?: "wide" | "narrow";
  class?: string;
}

/**
 * Page gutter and measure. 16px on mobile, 24px at `sm`, 32px at `lg`.
 */
export const Page = component$<PageProps>(
  ({ width = "wide", class: className }) => (
    <div
      class={cn(
        "mx-auto w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8",
        width === "narrow" ? "max-w-3xl" : "max-w-[1600px]",
        className,
      )}
    >
      <Slot />
    </div>
  ),
);

export interface PageHeaderProps {
  /** 24/30px page title. Concise — no icon medallion, no gradient. */
  title: string;
  /** Include only when it changes how the task is understood. */
  description?: string;
  class?: string;
}

export const PageHeader = component$<PageHeaderProps>(
  ({ title, description, class: className }) => (
    <div
      class={cn(
        "mb-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-3",
        className,
      )}
    >
      <div class="min-w-0">
        <h1 class="text-ink text-2xl leading-[30px] font-semibold tracking-[-0.01em]">
          {title}
        </h1>
        {description && (
          <p class="text-ink-muted mt-1 max-w-prose text-sm leading-5">
            {description}
          </p>
        )}
      </div>
      <div class="flex flex-wrap items-center gap-2 empty:hidden">
        <Slot name="actions" />
      </div>
    </div>
  ),
);

/** Horizontal rule between sibling regions. Prefer spacing where it suffices. */
export const Divider = component$<{ class?: string }>(
  ({ class: className }) => (
    <hr class={cn("border-edge border-t", className)} />
  ),
);
