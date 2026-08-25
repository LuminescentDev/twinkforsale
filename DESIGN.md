# Design Language

## Scope

This document defines the intended future visual and interaction language for twink.forsale. It is the reference for UX/UI planning and frontend implementation.

Product purpose, audience, workflow priorities, and strategic tradeoffs are defined in `PRODUCT_DESIGN_BRIEF.md`. This document does not preserve an existing pattern merely because it is present in the current codebase.

## Design character

twink.forsale should feel like a focused file utility with a personal queer identity: approachable, moderately spacious, calm during work, and selectively playful.

The management application is visually restrained. Pink, theme atmosphere, concise playful language, and optional particles provide recognition and warmth. Public bio pages may be substantially more expressive because self-expression is their purpose.

The interface is wrong when it resembles a generic statistics dashboard, a pile of floating cards, or a uniformly glowing kawaii theme. It is also wrong when restraint removes the product's identity and leaves a sterile cloud-storage clone.

## Core principles

### Content before decoration

Files, names, URLs, states, and actions should visually dominate. Decoration supports identity but does not compete with task content.

### Hierarchy before containment

Use alignment, typography, spacing, and dividers before introducing another surface. A border or background is justified only when it communicates a meaningful boundary.

### Personality at controlled intensity

Brand moments may use pink, expressive themes, particles, or playful copy. Routine controls and data remain quiet enough for repeated use.

### Familiar actions should feel immediate

Search, upload, copy, open, select, filter, and delete use familiar placements and controls. Specialized behavior receives contextual explanation.

### One system across themes

Themes change atmosphere, not structure. Layout, spacing, typography, control behavior, states, and accessibility remain stable.

## Visual hierarchy

Each view has one clear focal task.

- Files: search and recent files, with Upload as the primary action.
- Upload: the drop/select area and current queue.
- Analytics: the selected time series or file performance question.
- Short Links: creation when empty or new; existing links during management.
- Bio and Embeds: editable settings paired with a live preview.
- Settings: the currently selected settings group.
- Admin: system state, filters, and required actions.

Page titles are concise and visually subordinate to the working content. Do not give every page a large gradient heading, icon medallion, and descriptive paragraph. Include supporting copy only when it changes how users understand or complete the task.

Primary actions have the strongest contrast. Secondary actions use quieter fills or borders. Tertiary actions are text or icon controls. Destructive actions remain visually distinct without dominating before they are relevant.

## Information density

Use moderate density overall.

- File lists, admin tables, and analytics controls may be compact enough to scan efficiently.
- Setup, empty states, and unfamiliar configuration receive more breathing room and guidance.
- Metadata is concise and consistently ordered.
- Advanced settings use progressive disclosure rather than permanent multi-column clutter.
- Avoid both cramped control clusters and oversized sections with little information.

## Layout

Use the available viewport deliberately. Working views should not be forced into the same narrow centered marketing container.

- Maintain stable outer gutters and a readable content maximum on wide displays.
- Allow file tables, analytics, and admin screens to use more horizontal space.
- Use narrower reading widths for legal prose and focused forms.
- Prefer a small number of clear regions over deeply nested wrappers.
- Use split layouts only when both sides remain useful, such as settings plus a persistent preview.

Responsive changes must account for priority, not just stacking order. Preserve important actions, metadata, and context at narrow widths.

## Application shell and navigation

The future shell replaces the current navigation structure and appearance.

On desktop, use a restrained left navigation suited to durable destinations:

- Files
- Upload
- Analytics
- Short Links
- Bio
- Embeds

Settings, ShareX setup, account controls, and authorized admin tools belong in visually secondary groups. Files is the signed-in home; do not retain a separate statistics-first Dashboard destination.

The navigation should:

- use clear labels with consistent Lucide-style icons;
- communicate selection through restrained surface contrast, text weight, and an accent detail;
- avoid pill-shaped navigation rows and gradient selection bars;
- remain scannable without excessive group labels or vertical gaps;
- support a compact state only when labels remain discoverable; and
- keep the Upload action visible without duplicating it excessively.

On mobile, use a navigation pattern designed for narrow screens. Preserve the same information architecture, but prioritize recent Files and Upload rather than copying the full desktop rail into an excessively long drawer.

## Files home

Files is the canonical signed-in landing view.

The opening hierarchy is:

1. concise page identity, search, and primary Upload action;
2. recent or matching files;
3. supporting filters, sorting, storage context, and optional summary information.

Desktop defaults to a practical list or table. Show the metadata needed to identify and act on a file: name, type, size, relevant activity, date, and actions. An image-friendly grid remains an optional view rather than the default information architecture.

Mobile uses an adaptive row/card presentation with touch-safe actions. Do not hide essential file identity, the copy action, or selection state behind hover or an ambiguous overflow menu.

Bulk selection should introduce a stable contextual action bar. Search, filters, and selection must clearly show when the visible collection differs from the full collection.

The Files home may include a compact drop target or upload prompt. It must not allow a large upload surface to push existing files below the fold on every visit.

## Surfaces

Default surfaces are flat, neutral, and quiet. Separate regions primarily with spacing, alignment, dividers, or a subtle tonal change.

Use a contained surface for:

- a file preview or media object;
- an upload queue;
- a cohesive configuration tool;
- a modal or popover;
- a meaningful summary requiring separation;
- a user-defined bio preview; or
- a status area that must remain visually distinct.

Do not wrap a panel inside another card merely to create spacing. Avoid placing every statistic, form group, list, and explanatory note in a separate rounded rectangle.

Glass may appear in an intentional overlay or theme-specific atmospheric moment. It is not the default application surface.

## Typography

Use a neutral, highly readable sans-serif throughout the management application. The existing Inter-like direction is acceptable but not mandatory. A future replacement must materially improve readability or identity rather than change type for novelty.

The wordmark may use a more distinctive treatment, provided it remains legible and does not introduce a decorative type system into routine UI.

Typography should establish hierarchy through a restrained scale:

- page titles are clear but not oversized;
- section titles are compact and aligned with their content;
- body and control text remain comfortable for repeated use;
- metadata is smaller but retains sufficient contrast;
- monospace is reserved for URLs, API keys, codes, identifiers, and technical values.

Avoid gradient text on routine headings, excessive uppercase labels, wide letter spacing, centered long-form copy, and whimsical punctuation on operational labels.

## Spacing

Spacing should feel moderately generous without reducing useful density.

- Use consistent page, section, and control rhythms.
- Keep related labels, fields, help, and validation close together.
- Separate major workflow regions more strongly than items within a region.
- Let dense tables and admin tools use tighter internal spacing than onboarding or creative editors.
- Do not add padding merely to make a surface look substantial.

Prefer the project's shared spacing scale. Exact values should be established during implementation through a small coherent token set rather than page-specific arbitrary values.

## Color

Pink is the canonical brand accent. It identifies primary actions, focus, selection, links, and deliberate brand moments. It should not wash every surface or heading in equal intensity.

Operational surfaces use restrained neutral backgrounds with clear text hierarchy. Semantic success, warning, error, and informational colors remain distinct from the brand accent and maintain their meaning across every theme.

Color must never be the only indicator of state. Pair it with text, iconography, position, or shape.

Avoid low-contrast gray-on-gray treatments. Muted text is subordinate, not faint.

## Themes

Preserve these user-facing choices:

- Dark
- Light
- Pastel
- Neon
- Valentine
- Auto

The future implementations do not need to preserve current gradients, glass surfaces, glow, or exact palette values.

All themes must share:

- component geometry and spacing;
- typography and information hierarchy;
- semantic status meanings;
- recognizable focus and selection;
- minimum contrast expectations;
- motion behavior; and
- responsive layout.

Dark and Light establish the most neutral operational baselines. Pastel, Neon, and Valentine may shift palette and atmosphere more strongly, but content remains dominant. Auto follows the operating-system appearance while retaining the product's canonical accent behavior.

Theme previews should demonstrate actual surface, text, accent, and state relationships rather than show decorative color swatches alone.

## Accent usage

Use the pink accent for:

- the primary action in a view;
- current selection and keyboard focus;
- important links and active controls;
- concise brand moments; and
- meaningful progress or emphasis when it is not confused with status color.

Do not simultaneously apply accent gradient text, accent border, accent shadow, accent icon background, and accent page background to the same region.

Gradients are reserved for limited brand or theme moments. A gradient is not required to make a control feel primary.

## Shape and radius

Use small, restrained radii as the default. Related components share a consistent radius family.

- Buttons are normally compact rounded rectangles.
- Inputs, panels, menus, and dialogs use modest rounding appropriate to their size.
- Pills are reserved for tags, compact statuses, filters that semantically behave as tokens, or circular/fully rounded controls with a clear reason.
- Avatars and genuinely circular icon targets may remain circular.

Avoid `rounded-2xl` as a universal surface treatment and avoid making every button, navigation item, toggle, or container a pill.

## Borders, shadows, and elevation

Borders and tonal contrast are the primary means of surface separation.

- Use subtle, consistent borders that remain visible in every theme.
- Use shadows only to communicate real elevation: menus, dialogs, temporary action bars, and dragged or floating objects.
- Routine panels and cards should not glow or appear to float.
- Do not combine a strong border, shadow, gradient, glow, and translucent background on one element.

## Icons

Use one consistent Lucide-style icon family for application actions, navigation, statuses, and explanatory cues. Import icons individually and use consistent sizing and stroke treatment.

Icons support labels rather than replace them when meaning is ambiguous. Icon-only controls require an accessible name and, where useful, a tooltip. Brand/service marks may use their official icons in the bio-link system.

Do not use emoji or text glyphs as routine interface icons. Playful emoji may appear in deliberate content moments, not as substitutes for controls or status symbols.

## Particles, imagery, and expressive media

Background particles remain a user-facing customization feature throughout the management application.

- Default particles are subtle enough for long sessions.
- Stronger density, color, or motion is opt-in.
- Working content always has sufficient contrast and remains visually dominant.
- Particles must not interfere with pointer interaction, scrolling, focus visibility, or perceived performance.
- Respect reduced-motion preferences by reducing or disabling continuous movement.

Public bio pages may use background images, gradients, particles, Spotify content, and user-selected colors more freely. The editor must preview contrast and legibility risks rather than allowing customization to silently make content unusable.

Do not introduce generic stock illustration or decorative imagery merely to fill empty space.

## Motion

Motion communicates feedback, continuity, or state.

- Use short transitions for hover, focus, selection, disclosure, and menus.
- Show upload progress and completion clearly.
- Use restrained movement for drag-and-drop and reordered bio links.
- Avoid scaling every hovered control or card.
- Avoid routine page-load entrance animations, bouncing, floating content, animated gradients, and scroll effects.
- Reduce or remove nonessential motion when the user requests reduced motion.

Particles are atmosphere and follow the separate rules above; they do not justify additional motion on working components.

## Buttons and actions

Each view should have one visually dominant primary action. Other actions step down through secondary, tertiary, and destructive treatments.

- Use direct labels such as `Upload`, `Copy link`, `Create short link`, and `Save changes`.
- Do not use full-width buttons unless the layout or mobile context warrants them.
- Do not make primary buttons pills by default.
- Keep destructive actions quiet until relevant, then confirm irreversible consequences explicitly.
- Provide disabled and loading states without changing layout or replacing clear action text with ambiguous decoration.

The global Upload action should remain easy to find. Avoid duplicating multiple equally prominent Upload buttons in the same viewport.

## Forms and configuration

Forms use persistent labels, clear control grouping, and validation adjacent to the affected field.

- Explain API keys, domains, expiration, view limits, placeholders, and integrations at the point of use.
- Use examples only when they clarify the expected format.
- Keep common settings visible and disclose advanced options progressively.
- Preserve entered data and communicate save state.
- Do not place informational callouts around every group.
- Use native control semantics and visible keyboard focus.

Settings pages should use navigation or sections that make location and scope clear. Avoid one extremely long sequence of equally weighted panels.

## Tables, lists, and collections

Use tables when users compare repeated fields across many items. Use lists when recognition and a small number of actions matter more than column comparison. Use grids when visual thumbnails are the primary recognition mechanism.

- Headers remain visible and sorting state is explicit where useful.
- Row hover is supplementary; actions remain discoverable without hover.
- Selection is visible through more than color alone.
- Long names and URLs truncate predictably while remaining accessible in full.
- Empty results distinguish between an empty collection and a filter with no matches.
- Mobile layouts retain essential fields and reflow actions intentionally.

Avoid turning every row into an individually elevated rounded card on desktop.

## Analytics and data display

Only show metrics that answer a user question or support an action. Do not add statistics to make a page look complete.

- Give charts clear time ranges, labels, units, and empty states.
- Use brand and semantic colors deliberately rather than a rainbow palette.
- Pair visualizations with exact values where precision matters.
- Keep summary metrics subordinate to Files on the signed-in home.
- File-level analytics should be reachable directly from the relevant file.

## Bio and embed editors

On desktop, use a settings-and-preview layout. The settings side has clear sections and progressive disclosure; the preview remains persistent enough to show the effect of changes without repeated navigation.

On mobile, present settings sequentially and provide an intentional way to switch to or open the preview. Do not squeeze a desktop split view into a narrow viewport.

Save state must remain clear without an oversized fixed bar covering content. Unsaved changes, validation errors, preview-only behavior, and publication state require explicit communication.

The preview may be visually expressive. The surrounding editor remains part of the restrained management application.

## Menus, dialogs, and overlays

Menus are compact, clearly elevated, keyboard operable, and aligned to their triggers. Group related actions and separate destructive actions.

Dialogs are reserved for focused decisions, destructive confirmation, or short contained tasks. Do not turn routine multi-step work into a chain of modals.

Overlays use real elevation and a restrained backdrop. Glass effects are optional theme atmosphere, not required dialog styling.

## Interaction states

Every interactive component must define relevant states:

- default;
- hover, where available;
- keyboard focus;
- active/pressed;
- selected;
- disabled;
- loading;
- success;
- warning;
- error; and
- empty or unavailable.

Upload queues also distinguish pending, uploading, completed, failed, and retrying. Network and save failures remain visible until resolved or dismissed intentionally.

Use concise, direct error messages that explain what happened and what the user can do next. Do not append playful language to errors or destructive confirmations.

## Responsive behavior

Design and verify at narrow phone, larger phone, tablet/intermediate, laptop, and wide desktop widths.

- File retrieval, link copying, and uploading are first-class mobile tasks.
- Avoid horizontal overflow except where a deliberately scrollable data table is the clearest option.
- Keep touch targets usable without making every control visually oversized.
- Reorder content by task priority, not source order alone.
- Keep primary actions reachable and prevent sticky elements from covering content.
- Allow richer editors, tables, and admin tools to use desktop width while preserving a functional mobile path.

## Accessibility

- Maintain sufficient contrast for text, borders, focus, and controls in every theme.
- Preserve semantic HTML and native form behavior.
- Ensure complete keyboard navigation and visible focus.
- Give icon-only controls accessible names.
- Do not communicate state by color alone.
- Respect reduced motion.
- Keep dynamic alerts and progress understandable to assistive technology.
- Treat user-configured bio colors and imagery as untrusted design input and guard legibility where practical.

## Approved recurring patterns

- Restrained left navigation with clear primary and secondary groups.
- Search-first Files home with list default and optional visual grid.
- Focused manual upload flow with persistent progress and retry.
- Flat sections separated by spacing, dividers, and tonal contrast.
- Contextual bulk-action bar during selection.
- Settings rail plus persistent preview for creative editors.
- Contextual help and progressive disclosure for advanced configuration.
- Semantic badges and callouts used only when status or attention warrants them.
- Explicit empty, filtered-empty, loading, error, and success states.
- Theme-aware particles that remain behind readable content.

## Anti-patterns

- Nested cards.
- A card or panel around every section.
- Excessive rounding and universal `rounded-2xl` surfaces.
- Pill buttons, pill navigation, and pill inputs by default.
- Glassmorphism as the normal application surface.
- Gradient text on routine headings.
- Multiple competing gradients, glows, borders, and shadows.
- Large decorative page headings and repetitive subtitles.
- Statistics-first signed-in landing pages.
- Generic dashboard filler, decorative metrics, or fabricated activity.
- Low-contrast muted text.
- Hover scaling on every interactive element.
- Permanent explanatory copy for familiar actions.
- Playful language in errors, destructive flows, administration, or legal content.
- Mobile layouts produced by indiscriminately stacking the desktop page.
- Theme or particle choices that compromise hierarchy, accessibility, or performance.

## Implementation discretion

This direction intentionally establishes principles before exact CSS values. UX/UI planning should define a small coherent token set for spacing, radii, typography, borders, elevation, and motion after testing the major workflows.

Do not preserve current values or component shapes by default. Preserve them only when they support this future language and behave consistently across themes and responsive states.
