# Rail Money Design System

Rail Money should feel like a serious consumer finance product: clean, bright, direct, and trustworthy. The visual language is Rail's own: precise money UI, restrained surfaces, Satoshi for interface text, CommitMono for money and account data, and clean ASCII-inspired imagery. Rail has exactly one brand character, Miriam, the AI assistant, rendered as a single expressive illustration rather than a cast of mascots or playful story scenes.

Rail runs a deliberate human-vs-money typographic split: everything a person reads (copy, labels, headings, buttons) is set in Satoshi; everything about money or machines (balances, prices, account numbers, card digits, codes, ASCII imagery) is set in CommitMono with tabular figures. This split is the core signal of precision and trust.

## Direction

Rail is a money movement and wealth app. The interface should feel calm enough for banking, fast enough for payments, and distinct enough to be memorable. The design should be smooth and modern, but never cute, game-like, childish, or adventure-themed.

Use:

- Clean white canvases and soft cool-gray surfaces.
- Bright accent colors for action, status, and market movement.
- Rounded controls with crisp hierarchy.
- Satoshi for interface text.
- CommitMono for money, account data, balances, codes, and ASCII imagery.
- Real product context, financial data, and generated ASCII-style visuals.
- Miriam, the single brand character, for AI and assistant moments.
- Smooth surfaces, rounded controls, crisp data hierarchy, and quiet motion.

Avoid:

- Pixar storyboard on cream paper.
- Adventure-game, storybook, or toy-like styling, or a cast of scattered mascots. Miriam is the single sanctioned character; there is no second mascot.
- Decorative character scenes or cute visual metaphors for money.
- Heavy gradients as the main brand signal.
- Low-contrast gray text on gray surfaces.
- Using orange/red for errors. Error states use coral red.

## Visual Language

### ASCII Imagery

Rail imagery should use clean ASCII-style compositions: monospaced linework, chart-like grids, terminal-inspired patterns, contour maps, vault diagrams, market traces, routes, card silhouettes, and money-flow diagrams. Imagery should look like a polished financial operating system, not an illustrated world.

Rules:

- ASCII visuals must feel designed, not nostalgic or gimmicky.
- Use CommitMono and tight grid alignment.
- Keep imagery high contrast, sparse, and data-led.
- Prefer off-white, graphite, ember, green, blue, yellow, and pink accents.
- Use ASCII visuals for onboarding, empty states, loading states, insight cards, and campaign surfaces.
- Use real app concepts as subjects: balances, rails, ledgers, routes, cards, vaults, charts, exchange flows, and account security.
- Do not use scattered cartoon characters, secondary mascots, Pixar-like lighting, story panels, or adventure-game scenes. Miriam is the one exception, and she never appears inside ASCII compositions.

### Image System

Images should reinforce precision and trust. When the app needs a visual, default to one of these:

- ASCII-rendered financial diagrams.
- Monospaced charts and market traces.
- Clean product screenshots or UI-derived compositions.
- Abstract money-flow maps built from lines, dots, numbers, and labels.
- Security and identity visuals built from grids, masks, keys, and account patterns.

## Color System

### Core Neutrals

| Token              | Hex       | Usage                                   |
| ------------------ | --------- | --------------------------------------- |
| `warm-canvas`      | `#ffffff` | Default app background                  |
| `stone-surface`    | `#f2f2f2` | Grouped panels, inputs, subtle sections |
| `parchment-card`   | `#f5f5f5` | Cards and elevated surfaces             |
| `graphite`         | `#474645` | Secondary strong text                   |
| `charcoal-primary` | `#343433` | Primary text                            |
| `midnight`         | `#121212` | High-emphasis dark surfaces             |
| `obsidian`         | `#000000` | Max contrast, primary dark buttons      |
| `ash`              | `#848281` | Secondary text                          |
| `fog`              | `#c6c6c6` | Dividers and disabled borders           |
| `smoke`            | `#a7a7a7` | Tertiary text                           |
| `pepper`           | `#282624` | Dark elevated surfaces                  |

### Accents

| Token             | Hex       | Usage                                       |
| ----------------- | --------- | ------------------------------------------- |
| `ember-orange`    | `#ff3e00` | Primary brand accent and main CTAs          |
| `meadow-green`    | `#00ca48` | Positive money movement and growth          |
| `sky-blue`        | `#0090ff` | Links, information, selected utility states |
| `sunburst-yellow` | `#ffbb26` | Warnings, highlights, rewards               |
| `deep-amber`      | `#d48f00` | Warning text on light yellow surfaces       |
| `ocean-blue`      | `#0086fc` | Charts and secondary blue actions           |
| `ice-blue`        | `#64c6ff` | Soft blue visual accents                    |
| `spearmint`       | `#00c978` | Alternate positive accent                   |
| `flamingo`        | `#ff58ae` | Limited expressive accent                   |
| `violet-pop`      | `#9f4fff` | Limited expressive accent                   |
| `coral-red`       | `#ff2b3a` | Errors and destructive states               |
| `valid-green`     | `#00c454` | Validation and successful completion        |

### Semantic Mapping

| Semantic token          | Color              |
| ----------------------- | ------------------ |
| `primary`               | `ember-orange`     |
| `background-main`       | `warm-canvas`      |
| `background-surface`    | `stone-surface`    |
| `surface`               | `stone-surface`    |
| `text-primary`          | `charcoal-primary` |
| `text-secondary`        | `ash`              |
| `text-tertiary`         | `smoke`            |
| `success`               | `meadow-green`     |
| `destructive` / `error` | `coral-red`        |

Color rules:

- Orange is brand/action. It is not an error color.
- Green is reserved for successful or positive money movement.
- Blue is for utility, information, links, and charts.
- Yellow is warning or attention, paired with clear text.
- Every state must include text or iconography, not color alone.

## Typography

Rail uses two typefaces. **Satoshi** (Fontshare, geometric sans) carries all interface text. **CommitMono** (commitmono.com, neutral monospace) carries all money and machine data. Both are free, embeddable, and render identically on iOS and Android.

| Token                   | Font               | Usage                              |
| ----------------------- | ------------------ | ---------------------------------- |
| `font-display`          | Satoshi Bold       | Brand moments and large headlines  |
| `font-heading`          | Satoshi Bold       | Screen titles                      |
| `font-heading-semibold` | Satoshi Medium     | Dense section titles               |
| `font-subtitle`         | Satoshi Medium     | Card titles and row labels         |
| `font-body`             | Satoshi Regular    | Body copy                          |
| `font-body-medium`      | Satoshi Medium     | Emphasized body copy               |
| `font-button`           | Satoshi Medium     | Button labels                      |
| `font-caption`          | Satoshi Regular    | Labels and metadata                |
| `font-mono`             | CommitMono Regular | Codes and ASCII visuals            |
| `font-numeric`          | CommitMono Regular | Balances, prices, and account data |
| `font-mono-light`       | CommitMono 350     | De-emphasized numeric metadata     |
| `font-mono-book`        | CommitMono 450     | Numeric body copy                  |
| `font-mono-medium`      | CommitMono 500     | Ledger rows, secondary amounts     |
| `font-mono-strong`      | CommitMono 550     | Emphasized inline numerics         |
| `font-mono-semibold`    | CommitMono 600     | Strong numeric emphasis, balances  |
| `font-mono-heavy`       | CommitMono 625     | Heavier numeric emphasis           |
| `font-mono-bold`        | CommitMono 700     | Hero amounts and keypad totals     |

Type scale:

| Token        | Size | Line height | Usage                      |
| ------------ | ---- | ----------- | -------------------------- |
| `display`    | 68px | 1.09        | Rare brand display moments |
| `heading-lg` | 44px | 1.09        | Hero headings              |
| `heading`    | 23px | 1.2         | Screen and sheet headings  |
| `heading-sm` | 19px | 1.38        | Section headings           |
| `body`       | 15px | 1.47        | Default body copy          |
| `caption`    | 12px | 1.58        | Labels and metadata        |

Typography rules:

- Money and account-like data use CommitMono with `tabular-nums` (`fontVariant: ['tabular-nums']`) so digits stay column-aligned.
- UI copy and labels use Satoshi.
- Satoshi runs slightly wide; apply a small negative tracking on large text (roughly `-0.02em` on display and headings, easing to `0` at body and caption sizes). Do not exceed `-0.02em`.
- Use weight and size for hierarchy before reaching for color.
- Do not go below 12px.

## Shape, Spacing, And Elevation

Spacing follows a 4px grid with semantic app tokens:

| Token | Value |
| ----- | ----- |
| `xs`  | 4px   |
| `sm`  | 8px   |
| `md`  | 16px  |
| `lg`  | 24px  |
| `xl`  | 32px  |
| `xxl` | 48px  |

Family-inspired radius tokens:

| Token   | Value | Usage                              |
| ------- | ----- | ---------------------------------- |
| `sm`    | 2px   | Hairline pills and tight badges    |
| `md`    | 6px   | Compact controls                   |
| `lg`    | 10px  | Inputs and small cards             |
| `2xl`   | 17px  | Standard cards                     |
| `3xl`   | 24px  | Sheets, large cards, bottom panels |
| `3xl-2` | 32px  | Hero panels                        |
| `3xl-3` | 40px  | Rare large containers              |
| `full`  | 72px  | Pills, avatars, circular controls  |

Elevation should be quiet. Prefer subtle borders and inset strokes over heavy shadows. Use stronger shadows only for modals and raised overlays.

## Components

### Primary CTA Button (Pill Dark)

**Role:** Main conversion action — 'Get Started', 'Download on iOS'

Background #121212, text #ffffff, border-radius 32px, padding 0px 14px. Satoshi 14px weight 500-600. The near-black pill floats against the white canvas as the only dark punch. Hover/press state lightens to #343433 via 0.2s ease transition.

### Secondary CTA Button (Pill Light)

**Role:** Alternative actions — 'Log In', 'Watch the Video'

Background #f5f5f5 (cool gray), text #121212, border-radius 32px, padding 0px 14px. Satoshi 14px weight 500. Creates a paired hierarchy with the dark pill without competing — same shape, lighter surface.

### Ghost Text Link Button

**Role:** Inline navigation links — 'Watch the demo', section CTAs

Background transparent, text color #ff3e00 (Ember Orange), border-radius 0px, padding 4px 0px. No border. Satoshi 14-15px weight 500. The underline-less orange text link is the signature inline action — orange on white reads as warm urgency without a button shell.

### Outlined Navigation Button

**Role:** Tertiary actions in nav or contextual contexts

Background transparent, text #474645 (Graphite), border 1px solid #474645, border-radius 12px, padding 12px 32px 12px 12px. Satoshi 14px weight 500. Used for modal-adjacent actions that need definition without weight.

### Feature Card (White)

**Role:** Primary content cards — feature descriptions, testimonials

Background white (display-p3 1 1 1), border via inset box-shadow: color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset (cool stone border, ~#f2f2f2), border-radius 10px, padding 32px all sides. The inset shadow technique keeps borders off-layout-flow — cards look hand-placed on the canvas.

### Feature Card (Warm Cream)

**Role:** Secondary content panels — screenshot containers, demo previews

Background #f5f5f5 (display-p3 0.961 0.961 0.961), no box-shadow, border-radius 12px, padding 0px 22.8px 14px 22.8px. Slightly sunken into the page — the cool tint against the white canvas creates a 1-level depth shift without any shadow.

### Dark Phone Mockup Card

**Role:** Product screenshot showcase — wallet UI demonstrations

Background #000000, border-radius 24px (top) 0px 0px 24px (bottom), box-shadow rgba(0,0,0,0.15) 0px 0px 24px 0px, padding 4px 0px 4px 4px. The only true drop shadow on the page — reserved for the product hero moment, making the dark phone pop off the cream background.

### Testimonial Card

**Role:** Social proof — Twitter/X quotes in 'Friends of Family' section

Background white, border via inset stone shadow (same as Feature Card White), border-radius 10px, padding 32px. Contains avatar (circular, ~40px), handle in Satoshi 13px #848281, body in Satoshi 15px #474645, X logo icon in top-right. Horizontally scrolling or grid-arranged.

### Miriam Character

**Role:** The single brand character — the AI assistant across chat, drawer, health, and intro surfaces.

A single glossy sphere rendered in ember/coral (`#EF4A2F`) with a soft pinkish halo, a lit left sheen, and a bottom-right depth shade to keep it round. The face is minimal: two white capsule eyes, thin brows, a simple mouth curve, and optional blush cheeks. Miriam is expressive through ~13 emotion states (neutral, happy, thinking, surprised, sleepy, and more) driven by eye shape, brow, mouth, look direction, and cheek opacity, plus quiet idle motion (bob, sway, tilt, breathe, blink). Sized from ~24px inline avatars up to hero scale. Rules: one character only, never a group; no stick limbs or literal body; flat shading with subtle inset highlights, never heavy gradients; motion stays calm, easing in/out, never bouncy or cartoonish.

### Navigation Bar

**Role:** Sticky top navigation

Background #ffffff (canvas), height ~64px, box-shadow rgba(0,0,0,0.04) 0px 0px 0px 1px (barely-there outline). Logo left, nav links center in Satoshi 14px #343433 weight 500, 'Log In' ghost pill and 'Get Started' dark pill right. Dropdown chevrons on Developers/Resources.

### Section Heading

**Role:** Page section titles

Satoshi Bold at 68px with -0.02em letter-spacing and line-height 1.09 for hero. Satoshi 600 at 44px with -0.02em letter-spacing for sub-section heads. Color #343433 or #121212. Always left-aligned or centered — no right-aligned headlines.

### Colored Action Badge

**Role:** Transaction type labels inside wallet UI mockups — Send, Receive, Purchase

Circular icon badge: background in brand color (Meadow Green for Receive, Flamingo for Purchase), icon in white, border-radius 40px, ~40px diameter. Acts as the only iconographic navigation within the dark phone card context.

## Do's and Don'ts

### Do

- Use #ffffff as page background — the app canvas is pure white with cool-gray grouped surfaces layered on top.
- Apply the inset stone border (box-shadow: color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset) on all white cards instead of a CSS border property — keeps cards off-layout-flow.
- Use border-radius 32px for all pill buttons (both #121212 dark and #f5f5f5 light variants) — the pill shape is non-negotiable for interactive elements.
- Apply a small negative tracking to large text (roughly -0.02em on display and headings), easing to 0 at body and caption sizes — Satoshi runs slightly wide.
- Restrict Satoshi Bold to display and large headings; Satoshi Regular/Medium handle all other UI text.
- Use Ember Orange (#ff3e00) exclusively for text-link CTAs and accents — never as a button background fill; its power is as an inline pop against the canvas.
- Use Miriam as a single, deliberate accent in AI and assistant contexts — one character, never scattered, never duplicated across a screen.

### Don't

- Don't use drop shadows on content cards — the inset stone border is the only surface definition mechanism; shadows appear only on the dark phone mockup and hover-elevated states.
- Don't rely on color alone for state — pair every state with text or iconography.
- Don't mix Satoshi Bold with heavier synthetic weights — Satoshi Bold is the ceiling for headings; going heavier fights the typeface's personality.
- Don't apply Ember Orange (#ff3e00) to more than one UI element per viewport — its rarity is what creates urgency; overuse collapses the hierarchy.
- Don't use border-radius below 10px on cards — the minimum card radius is 10px; anything sharper breaks the soft-edged system.
- Don't use Violet Pop (#9f4fff) or Flamingo (#ff58ae) in UI chrome — these are expressive accents only. Coral Red (#ff2b3a) is the exception: it is the required color for error and destructive states in UI chrome.

## Surfaces

| Level | Name           | Value     | Purpose                                                                            |
| ----- | -------------- | --------- | ---------------------------------------------------------------------------------- |
| 1     | Canvas         | `#ffffff` | Page background — pure white                                                       |
| 2     | Card Surface   | `#ffffff` | White card faces with a cool inset stone border — floats 1px above canvas visually |
| 3     | Recessed Panel | `#f5f5f5` | Screenshot and demo container backgrounds — cool gray, sits below card level       |
| 4     | Stone Tint     | `#f2f2f2` | Button backgrounds (secondary), inset border reference color, pressed states       |
| 5     | Dark Shell     | `#000000` | Phone mockup cards — full inversion for product showcase moments                   |

## Elevation

- **Feature Card (White):** `color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset`
- **Dark Phone Mockup Card:** `rgba(0, 0, 0, 0.15) 0px 0px 24px 0px`
- **Navigation Bar:** `rgba(0, 0, 0, 0.04) 0px 0px 0px 1px`
- **Elevated Card (hover/active):** `rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px`

## Imagery

Rail's imagery is two layers: ASCII-style financial visuals (the default) and Miriam (the single brand character). No photography. ASCII visuals are high-contrast monospaced compositions built from lines, dots, numbers, and labels on the white canvas. Miriam is a single expressive ember sphere, never a group and never scattered as decoration, used only for AI and assistant moments. Product screenshots appear inside dark rounded phone mockups (border-radius 24px) — contained and framed, never bleeding to page edge. Icons are filled monochrome at small sizes; action badges use filled circles with white icon glyphs. Flat shading with subtle inset highlights, never heavy gradients — imagery reads as a precise financial operating system with one warm, approachable character.

## Layout

Max-width ~1200px centered on the canvas. Hero uses centered headline text (Satoshi Bold), flanked by ASCII-style financial imagery rather than a split layout. Below hero: alternating sections with generous vertical gaps (120-180px). Feature section uses a 3-column card grid (white cards with inset borders). Phone mockup sections show 2-3 device frames side by side on white or gray bands. Navigation is a fixed top bar with logo left, links center, actions right. Footer is minimal — link grid on canvas background. No sidebar, no mega-menu. Page is text-dominant with imagery as punctuation, not wallpaper.

## Agent Prompt Guide

**Quick Color Reference**

- Page background: #ffffff (pure white)
- Primary text: #474645 (Graphite)
- Heading text: #343433 (Charcoal Primary)
- CTA button (dark): #121212 background, #ffffff text
- CTA button (light): #f5f5f5 background, #121212 text
- Brand accent / link: #ff3e00 (Ember Orange)
- Card border: box-shadow inset ~#f2f2f2 1px
- Muted text: #848281

**Example Component Prompts**

1. **Hero Section**: Background #ffffff. Center-aligned headline in Satoshi Bold at 68px, color #343433, letter-spacing -0.02em, line-height 1.09. Subtext at 16px Satoshi 400, color #474645, max-width 480px. Two pill buttons below: dark (#121212 background, #ffffff text, 32px radius, 0px 14px padding) and light (#f5f5f5 background, #121212 text, 32px radius, 0px 14px padding).

2. **Feature Card Grid (3-column)**: Each card: background #ffffff, box-shadow color(display-p3 0.949 0.941 0.929) 0px 0px 0px 1px inset, border-radius 10px, padding 32px. Heading in Satoshi 600 19px #343433. Body in Satoshi 400 15px #474645 line-height 1.47. Product screenshot inside card on #f5f5f5 panel with border-radius 12px.

3. **Testimonial Card**: Background #ffffff, inset stone border same as Feature Card, border-radius 10px, padding 32px. Top-right: X/Twitter icon in #474645. User row: circular avatar 40px, name in Satoshi 500 14px #343433, handle in Satoshi 400 13px #848281. Quote in Satoshi 400 15px #474645 letter-spacing -0.01em. Arrange in horizontally scrolling row with 12px gap.

4. **Navigation Bar**: Background #ffffff, height 64px, box-shadow rgba(0,0,0,0.04) 0px 0px 0px 1px. Logo (square icon + wordmark) at left in #343433 Satoshi 500 15px. Center links: Satoshi 500 14px #343433 with dropdown chevrons. Right: 'Log In' light pill + 'Get Started' dark pill (#121212, 32px radius).

5. **Section Heading Block**: Satoshi 600 at 44px, color #121212, letter-spacing -0.02em, line-height 1.09. Optional orange accent word in same size but color #ff3e00. Supporting body text below at Satoshi 400 17px #474645, letter-spacing -0.01em, max-width 560px. Section gap above: 120-180px.

## Miriam Illustration System

Rail's one brand character. Miriam carries warmth so the rest of the UI can stay precise. Key rules:

**Form**: A single glossy sphere, never a group and never with limbs. Ember/coral body (`#EF4A2F`) with a soft pinkish halo (`rgba(239, 74, 47, 0.18)`), a lit left sheen, a bottom-right depth shade (`#A02010` at low opacity), and small white highlight dots. The color can shift per surface, but the form is constant.

**Face**: Two white capsule eyes, thin brows, a single mouth curve, and optional blush cheeks (`#FFB39A`). Expression comes from geometry, not added props.

**Emotion**: ~13 states (neutral, happy, sad, thinking, surprised, sleepy, annoyed, dizzy, nervous, smug, idle, bored, confused). Each maps to eye shape, brow, mouth, look bias, and cheek opacity.

**Motion**: Quiet idle life — bob, sway, tilt, breathe, and randomized blink, all on inout-sine easing. Processing speeds the sway. Never bouncy, springy, or cartoonish.

**Placement**: Only in AI and assistant contexts (chat, drawer, health, intro, voice). Miriam is never scattered as page decoration and never appears inside ASCII compositions.

## Motion Philosophy

Motion personality is 'expressive' with 0.2s ease as the base duration (123 instances). Key patterns:

**Micro-interactions**: 0.1-0.2s ease for hover states on buttons (background color, box-shadow). Buttons likely scale or lighten slightly.

**Miriam animation**: Quiet, looping idle motion (bob, sway, tilt, breathe, blink) on inout-sine easing. She never bounces, springs, or overshoots — her calm is what keeps her trustworthy rather than toy-like.

**Transition properties**: Transform and opacity dominate — elements slide or fade rather than recoloring.

**Rule**: Never use linear easing on visible UI — the brand is expressive, and linear motion reads as mechanical. Default to ease-in-out; reserve any spring for playful, non-financial moments only.

## Similar Brands

- **Linear** — Shares the tight negative letter-spacing system and engineered UI feel, executed here on a light canvas rather than dark.
- **Notionforms** — Same inset-border card technique (1px stone inner ring) and geometric-sans UI text system on near-white backgrounds.
- **Superhuman** — Pill buttons in near-black paired with a secondary light pill — identical button pairing strategy and tight tracking on headings.
- **Mercury / Ramp** — The human-vs-money typographic split: neutral sans for UI, precise monospace for balances, ledgers, and account data.
- **Raycast** — Display weight reserved for hero scale while a functional sans handles all UI text — same typographic division of labor.

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-warm-canvas: #ffffff;
  --color-stone-surface: #f2f2f2;
  --color-parchment-card: #f5f5f5;
  --color-graphite: #474645;
  --color-charcoal-primary: #343433;
  --color-midnight: #121212;
  --color-obsidian: #000000;
  --color-ash: #848281;
  --color-fog: #c6c6c6;
  --color-smoke: #a7a7a7;
  --color-pepper: #282624;
  --color-ember-orange: #ff3e00;
  --color-meadow-green: #00ca48;
  --color-sky-blue: #0090ff;
  --color-sunburst-yellow: #ffbb26;
  --color-deep-amber: #d48f00;
  --color-ocean-blue: #0086fc;
  --color-ice-blue: #64c6ff;
  --color-spearmint: #00c978;
  --color-flamingo: #ff58ae;
  --color-violet-pop: #9f4fff;
  --color-coral-red: #ff2b3a;
  --color-valid-green: #00c454;

  /* Typography — Font Families */
  --font-sans:
    'Satoshi', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    sans-serif;
  --font-mono: 'CommitMono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;

  /* Typography — Scale */
  --text-caption: 12px;
  --leading-caption: 1.58;
  --tracking-caption: -0.14px;
  --text-body: 15px;
  --leading-body: 1.47;
  --tracking-body: -0.2px;
  --text-heading-sm: 19px;
  --leading-heading-sm: 1.38;
  --tracking-heading-sm: -0.25px;
  --text-heading: 23px;
  --leading-heading: 1.2;
  --tracking-heading: -0.44px;
  --text-heading-lg: 44px;
  --leading-heading-lg: 1.09;
  --tracking-heading-lg: -1.14px;
  --text-display: 68px;
  --leading-display: 1.09;
  --tracking-display: -2.11px;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-36: 36px;
  --spacing-48: 48px;
  --spacing-60: 60px;
  --spacing-76: 76px;
  --spacing-80: 80px;
  --spacing-92: 92px;
  --spacing-96: 96px;
  --spacing-104: 104px;

  /* Layout */
  --page-max-width: 1200px;
  --section-gap: 120-180px;
  --card-padding: 32px;
  --element-gap: 8-12px;

  /* Border Radius */
  --radius-sm: 2px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-2xl: 17px;
  --radius-3xl: 24px;
  --radius-3xl-2: 32px;
  --radius-3xl-3: 40px;
  --radius-full: 72px;

  /* Named Radii */
  --radius-tags: 6px;
  --radius-cards: 10px;
  --radius-icons: 40px;
  --radius-inputs: 10px;
  --radius-buttons: 32px;
  --radius-cardslarge: 24px;
  --radius-buttonspill: 32px;
  --radius-illustrations: 72px;

  /* Shadows */
  --shadow-subtle: color(display-p3 0.94902 0.941176 0.929412) 0px 0px 0px 1px inset;
  --shadow-subtle-2: color(display-p3 0.94902 0.941176 0.929412) 0px 0px 0px 0px inset;
  --shadow-subtle-3: rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;
  --shadow-lg: rgba(0, 0, 0, 0.15) 0px 0px 24px 0px;
  --shadow-sm: rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px;

  /* Surfaces */
  --surface-canvas: #ffffff;
  --surface-card-surface: #ffffff;
  --surface-recessed-panel: #f5f5f5;
  --surface-stone-tint: #f2f2f2;
  --surface-dark-shell: #000000;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-warm-canvas: #ffffff;
  --color-stone-surface: #f2f2f2;
  --color-parchment-card: #f5f5f5;
  --color-graphite: #474645;
  --color-charcoal-primary: #343433;
  --color-midnight: #121212;
  --color-obsidian: #000000;
  --color-ash: #848281;
  --color-fog: #c6c6c6;
  --color-smoke: #a7a7a7;
  --color-pepper: #282624;
  --color-ember-orange: #ff3e00;
  --color-meadow-green: #00ca48;
  --color-sky-blue: #0090ff;
  --color-sunburst-yellow: #ffbb26;
  --color-deep-amber: #d48f00;
  --color-ocean-blue: #0086fc;
  --color-ice-blue: #64c6ff;
  --color-spearmint: #00c978;
  --color-flamingo: #ff58ae;
  --color-violet-pop: #9f4fff;
  --color-coral-red: #ff2b3a;
  --color-valid-green: #00c454;

  /* Typography */
  --font-sans:
    'Satoshi', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    sans-serif;
  --font-mono: 'CommitMono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;

  /* Typography — Scale */
  --text-caption: 12px;
  --leading-caption: 1.58;
  --tracking-caption: -0.14px;
  --text-body: 15px;
  --leading-body: 1.47;
  --tracking-body: -0.2px;
  --text-heading-sm: 19px;
  --leading-heading-sm: 1.38;
  --tracking-heading-sm: -0.25px;
  --text-heading: 23px;
  --leading-heading: 1.2;
  --tracking-heading: -0.44px;
  --text-heading-lg: 44px;
  --leading-heading-lg: 1.09;
  --tracking-heading-lg: -1.14px;
  --text-display: 68px;
  --leading-display: 1.09;
  --tracking-display: -2.11px;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-28: 28px;
  --spacing-32: 32px;
  --spacing-36: 36px;
  --spacing-48: 48px;
  --spacing-60: 60px;
  --spacing-76: 76px;
  --spacing-80: 80px;
  --spacing-92: 92px;
  --spacing-96: 96px;
  --spacing-104: 104px;

  /* Border Radius */
  --radius-sm: 2px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-2xl: 17px;
  --radius-3xl: 24px;
  --radius-3xl-2: 32px;
  --radius-3xl-3: 40px;
  --radius-full: 72px;

  /* Shadows */
  --shadow-subtle: color(display-p3 0.94902 0.941176 0.929412) 0px 0px 0px 1px inset;
  --shadow-subtle-2: color(display-p3 0.94902 0.941176 0.929412) 0px 0px 0px 0px inset;
  --shadow-subtle-3: rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;
  --shadow-lg: rgba(0, 0, 0, 0.15) 0px 0px 24px 0px;
  --shadow-sm: rgba(0, 0, 0, 0.04) 0px 1px 6px 0px, rgba(0, 0, 0, 0.05) 0px 0px 24px 0px;
}
```
