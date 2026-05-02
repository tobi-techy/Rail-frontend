# Rail Money Design System

Rail Money should feel like a serious consumer finance product: clean, bright, direct, and trustworthy. The app can borrow the warmth and punch of Family's palette, but the visual language is Rail's own: precise money UI, restrained surfaces, SF Pro typography, SF Mono numbers, and clean ASCII-inspired imagery instead of illustrated characters or playful story scenes.

## Direction

Rail is a money movement and wealth app. The interface should feel calm enough for banking, fast enough for payments, and distinct enough to be memorable. The design should be smooth and modern, but never cute, game-like, childish, or adventure-themed.

Use:

- Warm off-white canvases and soft stone surfaces.
- Bright accent colors for action, status, and market movement.
- Rounded controls with crisp hierarchy.
- SF Pro Display for interface text.
- SF Mono for money, account data, balances, codes, and ASCII imagery.
- Real product context, financial data, and generated ASCII-style visuals.
- Smooth surfaces, rounded controls, crisp data hierarchy, and quiet motion.

Avoid:

- Pixar storyboard on cream paper.
- Playful illustrated characters inhabiting a warm off-white world.
- Adventure-game, mascot-led, storybook, toy-like, or cartoon fintech styling.
- Decorative character scenes or cute visual metaphors for money.
- Heavy gradients as the main brand signal.
- Low-contrast gray text on gray surfaces.
- Using orange/red for errors. Error states use coral red.

## Visual Language

### ASCII Imagery

Rail imagery should use clean ASCII-style compositions: monospaced linework, chart-like grids, terminal-inspired patterns, contour maps, vault diagrams, market traces, routes, card silhouettes, and money-flow diagrams. Imagery should look like a polished financial operating system, not an illustrated world.

Rules:

- ASCII visuals must feel designed, not nostalgic or gimmicky.
- Use SF Mono and tight grid alignment.
- Keep imagery high contrast, sparse, and data-led.
- Prefer off-white, graphite, ember, green, blue, yellow, and pink accents.
- Use ASCII visuals for onboarding, empty states, loading states, insight cards, and campaign surfaces.
- Use real app concepts as subjects: balances, rails, ledgers, routes, cards, vaults, charts, exchange flows, and account security.
- Do not use cartoon characters, soft 3D mascots, Pixar-like lighting, story panels, or adventure-game scenes.

### Image System

Images should reinforce precision and trust. When the app needs a visual, default to one of these:

- ASCII-rendered financial diagrams.
- Monospaced charts and market traces.
- Clean product screenshots or UI-derived compositions.
- Abstract money-flow maps built from lines, dots, numbers, and labels.
- Security and identity visuals built from grids, masks, keys, and account patterns.

Do not generate or commission character illustration, mascot scenes, cozy editorial drawings, clay/3D characters, Pixar-like lighting, or cream-paper storyboards. Rail can be warm through color and spacing; it should be serious through composition, typography, and subject matter.

## Color System

### Core Neutrals

| Token | Hex | Usage |
| --- | --- | --- |
| `warm-canvas` | `#fbfaf9` | Default app background |
| `stone-surface` | `#f2f0ed` | Grouped panels, inputs, subtle sections |
| `parchment-card` | `#f8f7f4` | Cards and elevated warm surfaces |
| `graphite` | `#474645` | Secondary strong text |
| `charcoal-primary` | `#343433` | Primary text |
| `midnight` | `#121212` | High-emphasis dark surfaces |
| `obsidian` | `#000000` | Max contrast, primary dark buttons |
| `ash` | `#848281` | Secondary text |
| `fog` | `#c6c6c6` | Dividers and disabled borders |
| `smoke` | `#a7a7a7` | Tertiary text |
| `pepper` | `#282624` | Dark elevated surfaces |

### Accents

| Token | Hex | Usage |
| --- | --- | --- |
| `ember-orange` | `#ff3e00` | Primary brand accent and main CTAs |
| `meadow-green` | `#00ca48` | Positive money movement and growth |
| `sky-blue` | `#0090ff` | Links, information, selected utility states |
| `sunburst-yellow` | `#ffbb26` | Warnings, highlights, rewards |
| `deep-amber` | `#d48f00` | Warning text on light yellow surfaces |
| `ocean-blue` | `#0086fc` | Charts and secondary blue actions |
| `ice-blue` | `#64c6ff` | Soft blue visual accents |
| `spearmint` | `#00c978` | Alternate positive accent |
| `flamingo` | `#ff58ae` | Limited expressive accent |
| `violet-pop` | `#9f4fff` | Limited expressive accent |
| `coral-red` | `#ff2b3a` | Errors and destructive states |
| `valid-green` | `#00c454` | Validation and successful completion |

### Semantic Mapping

| Semantic token | Color |
| --- | --- |
| `primary` | `ember-orange` |
| `background-main` | `warm-canvas` |
| `background-surface` | `stone-surface` |
| `surface` | `stone-surface` |
| `text-primary` | `charcoal-primary` |
| `text-secondary` | `ash` |
| `text-tertiary` | `smoke` |
| `success` | `meadow-green` |
| `destructive` / `error` | `coral-red` |

Color rules:

- Orange is brand/action. It is not an error color.
- Green is reserved for successful or positive money movement.
- Blue is for utility, information, links, and charts.
- Yellow is warning or attention, paired with clear text.
- Every state must include text or iconography, not color alone.

## Typography

Rail uses the fonts already bundled in the app.

| Token | Font | Usage |
| --- | --- | --- |
| `font-display` | SF Pro Display Bold | Brand moments and large headlines |
| `font-heading` | SF Pro Display Bold | Screen titles |
| `font-heading-semibold` | SF Pro Display Semibold | Dense section titles |
| `font-subtitle` | SF Pro Display Semibold | Card titles and row labels |
| `font-body` | SF Pro Display Regular | Body copy |
| `font-body-medium` | SF Pro Display Medium | Emphasized body copy |
| `font-button` | SF Pro Display Semibold | Button labels |
| `font-caption` | SF Pro Display Regular | Labels and metadata |
| `font-mono` | SF Mono Regular | Codes and ASCII visuals |
| `font-numeric` | SF Mono Medium | Balances, prices, and account data |
| `font-mono-semibold` | SF Mono Semibold | Strong numeric emphasis |

Type scale:

| Token | Size | Line height | Usage |
| --- | --- | --- | --- |
| `display` | 68px | 1.09 | Rare brand display moments |
| `heading-lg` | 44px | 1.09 | Hero headings |
| `heading` | 23px | 1.2 | Screen and sheet headings |
| `heading-sm` | 19px | 1.38 | Section headings |
| `body` | 15px | 1.47 | Default body copy |
| `caption` | 12px | 1.58 | Labels and metadata |

Typography rules:

- Money and account-like data use SF Mono.
- UI copy and labels use SF Pro.
- Keep letter spacing at `0` by default.
- Use weight and size for hierarchy before reaching for color.
- Do not go below 12px.

## Shape, Spacing, And Elevation

Spacing follows a 4px grid with semantic app tokens:

| Token | Value |
| --- | --- |
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `xxl` | 48px |

Family-inspired radius tokens:

| Token | Value | Usage |
| --- | --- | --- |
| `sm` | 2px | Hairline pills and tight badges |
| `md` | 6px | Compact controls |
| `lg` | 10px | Inputs and small cards |
| `2xl` | 17px | Standard cards |
| `3xl` | 24px | Sheets, large cards, bottom panels |
| `3xl-2` | 32px | Hero panels |
| `3xl-3` | 40px | Rare large containers |
| `full` | 72px | Pills, avatars, circular controls |

Elevation should be quiet. Prefer subtle borders and inset strokes over heavy shadows. Use stronger shadows only for modals and raised overlays.

## Components

### Buttons

- Primary CTAs use `ember-orange` or `obsidian`, depending on context.
- Secondary buttons use `parchment-card` or `stone-surface`.
- Destructive buttons use `coral-red`.
- Buttons are rounded, tactile, and at least 44px tall.
- Loading and disabled states must be visually distinct.

### Cards

- Cards use `parchment-card` or `stone-surface`.
- Standard cards use `rounded-2xl` or `rounded-3xl`.
- Use light border strokes for grouping.
- Data cards should prioritize the number, then label, then support text.

### Inputs

- Inputs use `stone-surface` with strong text contrast.
- Labels are always visible.
- Errors appear beneath the field with a recovery path.
- Sensitive financial inputs should use SF Mono where precision matters.

### Financial Data

- Balances, prices, account numbers, rates, and transaction amounts use SF Mono.
- Positive movement uses `meadow-green`.
- Negative or failed movement uses `coral-red`.
- Pending states use neutral text plus a clear status label.

## Motion

Motion should feel tactile but serious.

- Use short spring press feedback on buttons and keypads.
- Use subtle enter transitions for sheets and confirmations.
- Avoid decorative looping animation.
- Respect reduced-motion settings.
- Success can feel satisfying, but never childish.

## Voice

Rail copy should be concise, direct, and confident.

Use:

- "Send money"
- "Review withdrawal"
- "No transactions yet"
- "Try again"
- "Your balance is updating"

Avoid:

- Cute financial metaphors.
- Mascot-like encouragement.
- Long educational copy inside primary workflows.
- Vague errors like "Something went wrong" without next steps.
