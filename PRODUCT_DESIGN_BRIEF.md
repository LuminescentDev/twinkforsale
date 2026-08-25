# Product Design Brief

## Purpose of this document

This brief defines why twink.forsale should be designed in a particular way. It captures the product, audience, workflow priorities, desired character, and explicit tradeoffs agreed during design discovery.

The reusable visual and interaction language belongs in `DESIGN.md`.

## Product purpose

twink.forsale is an invite-only community service for uploading, retrieving, and sharing files. It also provides analytics, short links, customizable public bio pages, Discord embed customization, ShareX integration, and administrative controls.

The service is personal and community-oriented today, but it may develop into a broader product. Its design must retain a recognizable identity without depending on in-jokes, insider knowledge, or technical fluency that would prevent future users from understanding it.

It is not primarily a business intelligence dashboard, a generic cloud drive, or a marketing site. It is a practical file-sharing tool with a distinctive queer and playful identity.

## Audience

### Primary users

Primary users are members of the invite-only community who upload files and later return to find, open, or copy links to them. They may be comfortable with Discord but should not be assumed to understand ShareX, API keys, upload domains, view limits, or embed metadata.

The interface must fully guide an unfamiliar user through specialized concepts without making repeat users continually read onboarding material.

### Secondary users

- Users who regularly inspect file performance and analytics.
- Users who create short links or customize public bio pages and Discord embeds.
- Administrators who approve users, manage domains and limits, inspect events, and monitor system health.
- Future users outside the original community, who may have less context for the product's language and conventions.

Administrators are power users. Their screens may be denser and more serious than ordinary user screens, but they should share the same component and theme foundations.

## Usage context

Most returning visits are short and purposeful: find an older file, copy its link, inspect it, or occasionally edit a bio page. Manual upload is the most important creation workflow. Analytics, short links, bio editing, and embed customization are important but less frequent.

Mobile access is decently important. Finding files, copying links, and manual uploads must work well on a phone. Analytics must remain readable. Bio/embed editing and administration can take fuller advantage of desktop space, while remaining functional on smaller screens.

The product should support both:

- quick actions with minimal navigation or explanation; and
- longer configuration sessions that require preview, guidance, and advanced options.

## Workflow priorities

### 1. Find and reuse an existing file

This is the most common return workflow and should define the signed-in home. Users need to search recent files quickly, recognize the correct result, copy its link, open it, and reach related analytics without navigating through a statistics-first dashboard.

### 2. Upload files manually

Upload must be the clearest global action. It should open a focused flow that supports drag and drop, multiple files, progress, individual errors, retry, expiration, and view limits without crowding the Files home.

The Files home may include a compact drop target or upload prompt, but a large upload surface should not displace the file-retrieval workflow on every visit.

### 3. Understand file performance

Analytics should help users understand views, downloads, and performance over time. Statistics support the file workflow; they should not dominate the first signed-in screen or exist as decorative metrics.

### 4. Create short links

Creating and managing short links should feel adjacent to file sharing: direct, compact, and explicit about destinations, expiration, click limits, and destructive actions.

### 5. Build a public bio page

The bio builder is a substantial creative workflow. On desktop it should use structured settings alongside a persistent live preview. On mobile it should present the same configuration in clear sequential sections. Advanced appearance and integration options should use progressive disclosure.

The resulting public bio page is intentionally more expressive than the management application and may reflect the individual user's personality.

### 6. Customize Discord embeds

Embed customization should pair clearly labeled settings with an immediate, representative preview. Specialized terminology should be explained at the point of use.

### 7. Configure ShareX

ShareX setup is an onboarding/configuration workflow rather than a primary daily destination. It should remain guided and sequential because users may not understand API keys or ShareX configuration files.

### 8. Administer the service

Administrative work prioritizes scanability, reliable status communication, filtering, and safe actions. Playful branding must not interfere with health, security, moderation, account approval, or destructive operations.

## Information architecture

Files becomes the signed-in home; there is no separate statistics-first Dashboard destination.

Primary navigation:

- Files
- Upload
- Analytics
- Short Links
- Bio
- Embeds

Secondary navigation groups contain:

- Settings
- ShareX setup
- Account controls
- Administrative tools, when authorized

A redesigned left navigation is the preferred desktop structure because these are durable destinations rather than transient modes. The current shell's structure and appearance are not canonical and should be replaced. On mobile, the navigation must preserve access and hierarchy without simply reproducing a wide sidebar in a narrow drawer.

## Desired product character

The management application should be:

- approachable rather than overtly technical;
- moderately spacious rather than cramped or excessively airy;
- restrained in working areas, with selective expressive moments;
- utilitarian rather than editorial;
- lightly playful rather than childish or relentlessly whimsical;
- recognizable as a focused desktop-style tool while still behaving well as a responsive web application;
- beginner-friendly without hiding efficient repeat workflows.

The intended emotional impression is a capable personal/community tool that feels welcoming, distinctive, and trustworthy. It should not feel corporate, sterile, generic, or like an automatically generated SaaS dashboard.

## Brand and voice

The existing overtly kawaii/femboy identity is flexible rather than something to preserve literally or remove entirely.

The future voice should remain openly queer, personal, and playful. Pink remains the recognizable brand accent. Humor, "uwu," emoticons, and affectionate language may appear as occasional flavor in marketing, onboarding, celebrations, and empty states.

Operational instructions, file metadata, errors, destructive actions, legal content, system health, and administration should use concise, direct language. Playfulness must never reduce clarity or seriousness where users need confidence.

## UX principles

### Put retrieval before reporting

The signed-in home should lead with search and recent files, followed by supporting information. Upload remains visually prominent without displacing retrieval.

### Guide at the moment of need

Explain unfamiliar concepts near the relevant control. Keep more extensive guidance in onboarding, setup, empty states, and expandable help. Do not place routine explanatory paragraphs beneath every page title.

### Let repeat work become fast

Common actions—search, copy, open, upload, select, and delete—must be easy to locate and execute. Advanced configuration should remain available without dominating routine use.

### Make state unmistakable

Uploads, approvals, limits, saves, errors, empty results, selection, and destructive actions need explicit text and icon treatment. Never rely on color alone.

### Separate expression from operation

Bio pages and optional themes can be expressive. File management, analytics, configuration, and administration need quieter composition and stronger information hierarchy.

### Earn every surface

Use a contained surface only when it communicates a meaningful object, tool, or boundary. Spacing, typography, dividers, and alignment should provide most grouping.

## Customization and themes

Dark, Light, Pastel, Neon, Valentine, and Auto remain product features. Their names and distinct personalities are worth preserving, but their current implementations are flexible. They should be rebuilt around the future flatter surface system rather than preserving pervasive gradients, glass, glow, or current contrast choices.

Background particles remain available throughout the management application. Default effects should be subtle, stronger effects should be opt-in, and reduced-motion preferences must be respected.

Customization should never obscure interaction states, semantic status colors, focus visibility, text contrast, or content hierarchy.

## Important tradeoffs

### Guidance versus density

Use moderate spacing and contextual guidance. Do not make every screen a wizard, and do not compress controls so tightly that novice users cannot understand their relationship.

### Personality versus operational clarity

Retain the brand's queer, playful warmth, but concentrate it in deliberate moments. Serious and repetitive tasks must remain calm and direct.

### Theme freedom versus system coherence

Themes may change atmosphere, but they must share layout, typography, spacing, component behavior, semantic colors, and accessibility expectations.

### Desktop capability versus mobile importance

Desktop may expose richer tables, inspectors, and persistent previews. Mobile must preserve core tasks and information rather than merely stacking every desktop element into a very long page.

### Product growth versus current community identity

The interface should remain personal and recognizable while using terminology and interaction patterns a future user can understand without community context.

## Existing UI decisions

### Preserve

- The named theme choices as a product feature.
- Pink as the recognizable brand accent.
- Optional background particles across the application.
- Expressive and highly customizable public bio pages.
- Consistent iconography, semantic statuses, responsive file views, and explicit empty/error states as useful foundations.

### Flexible

- The degree and placement of kawaii/femboy language.
- The existing Inter-like typography direction.
- The exact appearance of every theme.
- Grid view, dashboard metrics, and other secondary presentations when they support a real workflow.

### Replace

- The current navigation structure and visual shell.
- The separate statistics-first Dashboard as the signed-in home.
- Pervasive glass, gradients, glow, and decorative background treatment.
- Cards or panels wrapping nearly every content group, especially nested cards.
- Excessive large radii and default pill buttons.
- Gradient headings and decorative icon bubbles on routine operational screens.
- Routine subtitles and playful filler copy that repeat what a screen already makes clear.

## References

No external product or visual reference is canonical. The direction is derived from twink.forsale's actual workflows, current strengths and weaknesses, and the owner's stated preferences. Future references should be recorded by the specific principle they contribute; naming a product is not permission to copy its full visual identity.

## Anti-goals

- A generic SaaS dashboard organized around decorative metrics.
- A conventional cloud-drive clone with no recognizable personality.
- Nested cards and panels used as default page structure.
- Excessive rounding or pill-shaped controls.
- Gradients, glow, glass, and particles competing simultaneously for attention.
- Huge application headings or excessive whitespace that slows scanning.
- Low-contrast text justified as visual subtlety.
- Permanent beginner instructions occupying routine working space.
- Playful wording in legal, security, health, error, or destructive contexts.
- Mobile layouts that hide important actions or become unprioritized vertical dumps.
- Theme customization that compromises accessibility or recognizable state.

## Product design success criteria

The direction is successful when:

- a returning user can find and copy an old file link immediately;
- a new user can upload and configure integrations without prior technical knowledge;
- the interface feels recognizably twink.forsale without decorating every element;
- public bio pages feel expressive while the management application remains focused;
- named themes feel distinct without becoming separate component systems;
- administrators can scan and act on dense information safely;
- mobile users can complete core file tasks without losing context or controls; and
- the product could serve a broader audience without erasing its community identity.
