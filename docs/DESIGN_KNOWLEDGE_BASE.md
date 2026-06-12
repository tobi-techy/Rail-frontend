# Rail Money — Design Knowledge Base

> The definitive design reference for building Rail Money screens, components, and interactions.
> Every new feature, screen, or component MUST follow these rules.

---

## 1. Design Philosophy

Rail Money is a **wealth-building autopilot** — not a traditional banking app. The design must feel like a premium instrument that works silently in the background while giving users absolute confidence in their money.

### Core Identity

- **Automatic over manual** — The system moves money, not the user's willpower
- **Calm confidence** — White-first, clean surfaces that let numbers breathe
- **Physicality** — Every tap has weight (haptics + spring animations)
- **Trust through transparency** — Show exactly what's happening with money at all times
- **Progressive disclosure** — Reveal complexity only when the user asks for it

### The Rail Money Feeling

When a user opens Rail Money, they should feel:
1. **Safe** — "My money is handled"
2. **Smart** — "I'm building wealth without effort"
3. **Premium** — "This app respects my time and attention"
4. **In control** — "I can see and act on everything instantly"

---

## 2. Design Principles (The Non-Negotiables)

### Principle 1: Clarity First (Apple HIG)
Every element must be immediately understandable. No decoration that doesn't serve comprehension.
- Text must be legible at all sizes
- Icons must be precise and recognizable
- Never sacrifice readability for aesthetics
- **Rule:** If a user needs more than 1 second to understand what a screen does, redesign it

### Principle 2: Content Over Chrome (Deference)
The interface defers to the user's money. Balance numbers, transaction amounts, and progress indicators are the stars — not the UI frame around them.
- Controls support content, never compete with it
- Use subtle gradients and restrained styling
- White space is a feature, not wasted space
- **Rule:** The largest element on any screen should be the user's data, not a UI decoration

### Principle 3: Depth Through Layers
Visual layers communicate hierarchy and spatial relationships.
- Bottom sheets slide up FROM content, creating a "above/below" mental model
- Modals dim the background to focus attention
- Blur effects (tab bar, floating buttons) hint at content beneath
- Spring animations create a sense of physical weight
- **Rule:** Every overlay must have a clear visual relationship to what's beneath it

### Principle 4: Physicality (The Cash App Edge)
Every interaction must feel tangible. This is what separates Rail from generic fintech apps.
- Buttons scale down on press (0.97 spring) — they feel like real buttons
- Keypad keys trigger light haptic feedback on every tap
- Important actions (send, confirm) trigger medium haptic feedback
- Success/failure triggers notification haptic feedback
- **Rule:** No tap should ever feel "dead" — every interactive element responds physically

### Principle 5: Safe Failure (The Duolingo Lesson)
Money is stressful. Rail must make errors feel recoverable, not catastrophic.
- Error states use firm but not alarming red (#EF4444)
- Always show what went wrong AND what to do next
- Failed transactions show clear retry paths
- Feedback popups slide in gently, not aggressively
- **Rule:** Every error message must contain an action the user can take

### Principle 6: Progress Must Be Visible (The Duolingo Streak)
Users need to feel their wealth growing. Silent progress kills motivation.
- Balance changes should animate (not just swap numbers)
- Stash growth should be visually celebrated
- Transaction history tells a story of progress
- **Rule:** After any deposit or investment action, the user must SEE their balance change

---

## 3. Color System

### Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#FF2E01` | Brand accent, CTAs, active tab icon, splash screen, orange buttons |
| `primary-dark` | `#E02900` | Pressed/hover state for primary |
| `success` | `#00C853` | Positive amounts, deposits, growth indicators |
| `destructive` | `#EF4444` | Errors, failed transactions, negative amounts, destructive actions |
| `background` | `#FFFFFF` | Primary app background — white-first design |
| `surface` | `#F5F5F5` | Cards, input backgrounds, secondary surfaces |
| `text-primary` | `#000000` | Headlines, balance amounts, primary content |
| `text-secondary` | `#757575` | Subtitles, labels, supporting text |
| `text-tertiary` | `#6B7280` | Timestamps, metadata, least important text |
| `text-inverse` | `#FFFFFF` | Text on dark/colored backgrounds |
| `overlay` | `rgba(0,0,0,0.7)` | Modal backdrops |

### Dark Mode Palette (Foundation — Not Yet Active)

| Token | Hex | Usage |
|-------|-----|-------|
| `dark-bg` | `#000000` | Primary background |
| `dark-surface` | `#1C1C1E` | Card surfaces |
| `dark-surface-elevated` | `#2C2C2E` | Elevated cards, sheets |
| `dark-text` | `#FFFFFF` | Primary text |
| `dark-text-secondary` | `#8E8E93` | Secondary text |
| `dark-separator` | `#38383A` | Dividers |

### Color Rules

1. **White is the default.** Every screen starts white. Color is earned through content.
2. **Red (#FF2E01) is reserved for brand moments** — splash screen, primary CTAs, the keypad funding screens, tab bar active state. Never use it for errors.
3. **Error red is #EF4444** — visually distinct from brand red. Never confuse error states with brand identity.
4. **Green means money arrived.** Success green (#00C853) is ONLY for positive financial events — deposits received, balance increases, successful transactions.
5. **Never convey information through color alone** (Apple HIG accessibility). Always pair color with icons, text, or patterns.
6. **Colored backgrounds are special.** Only the funding keypad screens (fund-crosschain, fund-naira) and splash screen use the brand red background. This creates a distinct "money action" mode.
7. **Surface gray (#F5F5F5) for grouping.** Use it to create visual sections — card backgrounds, input containers, info panels. It separates content without heavy borders.

---

## 4. Typography System

### Font Families

Rail Money uses Apple's SF Pro family exclusively — the same font system Apple uses across iOS. This creates instant platform familiarity.

| Token | Font | Usage |
|-------|------|-------|
| `font-display` | SF Pro Display Bold | Hero numbers, splash |
| `font-heading` / `font-headline` | SF Pro Display Bold | Screen titles, section headers |
| `font-headline-2` | SF Pro Display Semibold | Sub-headers |
| `font-subtitle` | SF Pro Display Semibold | Card titles, list item titles, button text emphasis |
| `font-body` | SF Pro Display Regular | Body text, descriptions, subtitles |
| `font-body-medium` | SF Pro Display Medium | Emphasized body text |
| `font-button` | SF Pro Display Semibold | Button labels |
| `font-caption` | SF Pro Display Regular | Small labels, timestamps |
| `font-numeric` / `font-mono` | SF Mono Medium | Balance amounts, transaction amounts |
| `font-mono-semibold` | SF Mono Semibold | Keypad digits, emphasized numbers |

### Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `display-lg` | 48px | 1.1 | Splash screen, hero moments |
| `balance-lg` | 50px | 1.1 | Main balance display (home screen) |
| `auth-title` | 40px | 1.1 | Auth screen headlines ("Welcome Back") |
| `headline-1` | 32px | 1.2 | Primary screen titles |
| `balance-sm` | 32px | 1.1 | Secondary balance displays |
| `keypad` | 30px | 1.2 | Keypad digit buttons |
| `stash` | 26px | 1.2 | Stash card amounts |
| `headline-2` | 24px | 1.3 | Section headers |
| `headline-3` | 20px | 1.3 | Sub-section headers, sheet titles |
| `subtitle` | 18px | 1.4 | Card titles, emphasized labels |
| `button-lg` | 18px | 1.1 | Large button text |
| `body` | 16px | 1.5 | Standard body text |
| `caption` | 14px | 1.5 | Secondary text, timestamps |
| `small` | 12px | 1.5 | Tertiary text, badges, fine print |

### Typography Rules

1. **Balance amounts use SF Mono** (`font-numeric` / `font-mono-semibold`) with `tabular-nums` font variant and negative letter-spacing (-3.8px on large balances). This ensures digits align perfectly and feel premium.
2. **The home balance is 60px SF Mono Semibold** — the largest text in the app. It IS the app.
3. **Auth titles are 40px Bold** — large, confident, one line when possible.
4. **Never go below 11px** (Apple HIG minimum). Our practical minimum is 12px (`text-small`).
5. **Hierarchy is weight + size, not color.** Use Semibold/Bold for emphasis before reaching for color.
6. **Numbers that represent money always use monospace** — SF Mono ensures columns align and amounts feel precise.
7. **Line heights are tight for headlines (1.1-1.3), relaxed for body (1.5).** This creates visual density at the top and readability in content.

---

## 5. Spacing & Layout System

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps (icon-to-text inline, badge padding) |
| `sm` | 8px | Small gaps (between related items, inner padding) |
| `md` | 16px | Standard gaps (between sections, card padding) |
| `lg` | 24px | Large gaps (between major sections) |
| `xl` | 32px | Extra large (screen top padding, major separations) |
| `xxl` | 48px | Maximum spacing (hero sections, breathing room) |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 8px | Small elements (badges, tags, small inputs) |
| `rounded-md` | 16px | Cards, input fields, info panels |
| `rounded-lg` | 24px | Bottom sheets, large cards, stash cards |
| `rounded-full` | 9999px | Buttons, avatars, keypad keys, tab bar pill |

### Fixed Heights

| Token | Value | Usage |
|-------|-------|-------|
| `h-keypad` | 72px | Keypad button rows |
| `h-input` | 52px | Standard input fields |
| `h-pin-dot` | 56px | Passcode input dots |

### Layout Rules

1. **Screen padding is `px-5` (20px) or `px-6` (24px).** Consistent horizontal margins across all screens.
2. **Safe areas are always respected.** Use `SafeAreaView` with appropriate edges. Never let content hide behind notches or home indicators.
3. **Bottom sheets use 24px top border radius** (`rounded-t-3xl` equivalent) with a 36×4px drag indicator.
4. **Cards use 24px border radius** (`rounded-3xl`) — this is the signature Rail Money card shape.
5. **Buttons are always full-rounded** (`rounded-full`) — pill-shaped buttons are the Rail identity.
6. **Content flows vertically.** Rail Money is a scroll-down app. Horizontal scrolling is reserved for carousels (stash cards, onboarding slides).

### Touch Targets (Apple HIG — Non-Negotiable)

- **Minimum 44×44 points** for ALL interactive elements
- The close button on sheets is 44×44 with `hitSlop={12}`
- Tab bar items have `hitSlop={8}` for comfortable tapping
- Keypad keys are 72px tall with full-width flex — well above minimum
- **Rule:** If you can't comfortably tap it with your thumb while holding the phone one-handed, it's too small

---

## 6. Component Patterns

### Buttons

Rail Money buttons are pill-shaped with spring-based press feedback.

**Variants:**
| Variant | Background | Text | Usage |
|---------|-----------|------|-------|
| `black` | `#000000` | White | Primary action (default) |
| `white` | `#FFFFFF` + border | Black | Secondary action |
| `orange` | `#FF2E01` | White | Auth CTAs (Sign In, Sign Up) |
| `destructive` | `#F44336` | White | Dangerous actions (delete, cancel) |
| `ghost` | Transparent | Gray | Tertiary/dismiss actions |

**Sizes:** `large` (px-6 py-5, text-lg) and `small` (px-6 py-4, text-caption)

**Behavior:**
- Press in: `scale(0.97)` with spring (speed: 50, bounciness: 4)
- Press out: `scale(1)` with spring (speed: 50, bounciness: 8)
- Medium haptic on press
- Loading state shows `ActivityIndicator`, disables interaction
- Disabled state: `opacity-50`

**Rules:**
1. One primary button per screen. If two actions exist, one is `black`, the other is `white` or `ghost`.
2. Buttons stretch full-width at `large` size, hug content at `small` size.
3. Auth screens use `orange` variant. Everything else uses `black`.
4. Never put a button inside a scrollable area where it might scroll off-screen. Pin important CTAs to the bottom.

### Keypad

The keypad is Rail Money's signature interaction for money input — inspired by Cash App's keypad-first payment flow.

**Layout:** 4×3 grid (1-9, [left key], 0, backspace)
**Left key options:** fingerprint, decimal point, passkey, or empty
**Variants:** `light` (white bg, black text) and `dark` (transparent bg, white text — used on red funding screens)
**Key height:** 72px (`h-keypad`)
**Digit font:** SF Mono Semibold at 30px (`text-keypad`)
**Feedback:** Light haptic on every key press

**Rules:**
1. Keypad screens always show the amount above the keypad with `AnimatedAmount` component.
2. The keypad never scrolls — it's pinned to the bottom of the screen.
3. On red-background funding screens, use `variant="dark"`.
4. Backspace icon is always the delete icon from HugeIcons.

### Balance Card

The home screen's hero component. Shows total balance with masked/visible toggle.

**Structure:**
- "Total balance" label (caption, text-secondary)
- Balance amount (60px SF Mono Semibold, tabular-nums, letter-spacing -3.8px)
- Eye/hide toggle button (24px icon, 44pt touch target with hitSlop)
- Percent change indicator (green for positive, red for negative)

**Rules:**
1. Balance is ALWAYS the largest element on the home screen.
2. The masked state replaces digits with `•` characters — same width, same font.
3. Currency conversion happens client-side using stored FX rates.
4. Loading state shows `Skeleton` placeholders, never "0.00".

### Transaction Items

Each transaction is a pressable row with icon, title, subtitle, and amount.

**Structure:**
- 44×44px circular icon (token logo, action icon, or swap icon)
- Title (15px Semibold) + Subtitle (12px caption, secondary)
- Amount (16px, color-coded: green for credit, red for debit, gray for pending)
- Optional status badge ("Pending" in primary color, "Failed" in destructive)

**Press behavior:** `scale(0.97)` spring animation, same as buttons.

**Rules:**
1. Transaction amounts respect the balance visibility toggle (masked when hidden).
2. Withdrawal method badges appear as small overlays on the transaction icon.
3. Always show the transaction type icon — never leave it blank.

### Stash Cards

Side-by-side cards showing spending stash and investment stash.

**Structure:**
- Icon in top-left
- Amount in bottom-left (26px, `text-stash`)
- Title below amount
- Optional badge (green/red/gray dot + label)

**Colored variant:** Solid background color with white text (e.g., investment stash)
**Default variant:** White background with border, black text

**Rules:**
1. Stash cards always appear in pairs (side by side, `flex-row gap-3`).
2. The "Get started" state replaces the amount with a CTA label.
3. Loading state uses `Skeleton` components (light variant on colored cards).

### Bottom Sheets (Gorhom)

All modal content uses `@gorhom/bottom-sheet` for consistent behavior.

**Visual specs:**
- Background: white, 24px top border radius
- Drag indicator: 36×4px, `#D1D5DB`, centered, 8px top margin
- Content padding: 20px horizontal, safe area bottom padding
- Backdrop: 50% opacity black, tap-to-dismiss (when `dismissible`)

**Behavior:**
- Dynamic sizing by default (max 80% screen height)
- Optional snap points for fixed heights
- Light haptic on dismiss
- Keyboard-interactive behavior

**Rules:**
1. Every sheet has a close button (top-right, Cancel01Icon, 22px, `#9CA3AF`) unless it's a non-dismissible flow.
2. Sheet content scrolls via `BottomSheetScrollView` — never nest a `ScrollView` inside a sheet.
3. Sheets are for secondary actions. Primary flows use full screens.

### Feedback Popup

The global notification system — appears at the top of the screen over all content.

**Types:** `success` (green), `error` (red), `warning` (amber), `info` (blue)

**Visual specs:**
- White card with 20px border radius, 1px `#E5E7EB` border
- Left accent stripe (4px, type-colored)
- 28×28px icon circle with type-colored background
- Title (15px Semibold) + optional message (13px Regular)
- Close button or action button on the right

**Animation:**
- Enter: fade in (220ms) + slide down from -24px + scale from 0.98
- Exit: fade out (180ms) + slide up to -18px + scale to 0.98
- Auto-dismiss after 3200ms (configurable)

**Rules:**
1. Use `useFeedbackPopup()` hook — never create custom toast/alert components.
2. Success popups for financial actions: "Deposit successful", "Transfer complete", etc.
3. Error popups must include actionable guidance, not just "Something went wrong".
4. Only one popup visible at a time — new popups replace existing ones.

---

## 7. Animation & Motion System

Rail Money uses `react-native-reanimated` for all animations. Every animation must feel physical and intentional — never decorative.

### Animation Vocabulary

| Pattern | Config | Usage |
|---------|--------|-------|
| **Press feedback** | `scale(0.97)`, spring (damping: 20, stiffness: 300) | All pressable elements (buttons, cards, list items) |
| **Tab bar press** | `scale(0.85)`, spring (damping: 15) | Tab bar icon press |
| **Screen enter** | `translateY(32→0)` + `opacity(0→1)`, spring (damping: 24, stiffness: 200) | `AnimatedScreen` wrapper |
| **Staggered enter** | `translateY(16→0)` + `opacity(0→1)`, spring (damping: 18, stiffness: 100), delay: `index × 50ms` | `StaggeredChild` for sequential reveals |
| **Slide in up** | `SlideInUp.delay(80-100).duration(500)` | Keypad, bottom CTAs entering screen |
| **Fade in** | `FadeIn.duration(300-400)` | Headers, labels, secondary content |
| **Fade in down** | `FadeInDown.duration(300)` | Content sections appearing after navigation |
| **Keypad slide** | `translateY(60→0)`, spring (damping: 18, stiffness: 120) | Keypad entering from bottom |
| **Splash logo** | `scale(0.8→1)` spring + `opacity(0→1)` timing (300ms) + shake interval | Splash screen logo entrance |

### Spring Configurations

| Name | Damping | Stiffness | Mass | Feel |
|------|---------|-----------|------|------|
| **Snappy press** | 20 | 300 | — | Quick, responsive button feedback |
| **Gentle enter** | 18 | 100 | — | Smooth content appearance |
| **Screen enter** | 24 | 200 | 0.9 | Confident screen transition |
| **Bouncy tab** | 15 | — | — | Playful tab bar interaction |
| **Keypad enter** | 18 | 120 | — | Weighted keypad slide-up |

### Motion Rules

1. **Every interactive element must have press feedback.** Use `AnimatedPressable` with `scale` spring. No exceptions.
2. **Screen content enters with stagger.** Use `StaggeredChild` with incrementing `index` values. The first element appears immediately, subsequent elements cascade in 50ms intervals.
3. **Spring physics over timing curves.** Springs feel physical. Use `withSpring` for interactive elements, `withTiming` only for opacity fades and progress bars.
4. **Respect Reduce Motion.** When the system accessibility setting is enabled, replace slide/spring animations with simple fades. (Use `useReducedMotion()` from reanimated.)
5. **Animations must be fast.** Enter animations: 200-500ms. Press feedback: instant (spring). Exit animations: 150-200ms. If an animation takes longer than 500ms, it's too slow.
6. **No animation for animation's sake.** Every motion must communicate something: "this appeared", "you pressed this", "this is loading", "this succeeded". If you can't explain what the animation communicates, remove it.

---

## 8. Haptics System

Haptics are a first-class design element in Rail Money — not an afterthought. They create the physical feeling that separates Rail from web-wrapped fintech apps.

### Three-Tier Haptic Model

| Tier | Type | Intensity | Usage |
|------|------|-----------|-------|
| **Tier 1: Ambient** | `ImpactFeedbackStyle.Light` | Subtle | Keypad taps, tab switches, scroll snaps, selection changes |
| **Tier 2: Intentional** | `ImpactFeedbackStyle.Medium` | Noticeable | Button presses, card taps, toggle switches, sheet dismiss |
| **Tier 3: Consequential** | `NotificationFeedbackType.Success/Warning/Error` | Strong | Transaction complete, error occurred, important state change |

### Haptic Hooks

| Hook | Tier | Usage |
|------|------|-------|
| `useHaptics()` | All | General-purpose — returns `impact()`, `selection()`, `notification()` |
| `useKeypadFeedback()` | Tier 1 | Keypad digit presses |
| `useButtonFeedback()` | Tier 2 | Button press-in events |

### Haptic Rules

1. **Every tap gets a haptic.** If something is pressable, it vibrates. Period.
2. **Haptics respect user preference.** All haptic hooks check `hapticsEnabled` from `uiStore`. Never bypass this.
3. **Match haptic intensity to action importance.** Browsing = light. Acting = medium. Completing = notification.
4. **Financial confirmations always use notification haptics.** When money moves (deposit, withdrawal, transfer), the user must FEEL it.
5. **Never double-fire haptics.** If a button press triggers both `useButtonFeedback` and a success notification, the button haptic fires on press-in, the notification haptic fires on completion. They're sequential, not simultaneous.

---

## 9. Screen Patterns

### Screen Types

#### 1. Tab Screens (Home, History, Settings)
- `SafeAreaView` with top edge
- No navigation bar — custom header with avatar/notification bell
- Pull-to-refresh via `RefreshControl`
- Tab bar always visible (blurred pill, bottom-left)
- AI button floating bottom-right (when feature-gated)

#### 2. Auth Screens (Sign In, Sign Up, Verify Email, etc.)
- `AuthScreen` template or `AuthGradient` wrapper
- White background, no navigation bar
- Title: 40px Bold (`text-auth-title`)
- Subtitle: 14px Regular, 60% opacity
- `StaggeredChild` wraps each form element for cascade entrance
- Primary CTA pinned to bottom with `marginTop: 'auto'`
- Keyboard-avoiding behavior on iOS

#### 3. Funding Screens (Fund Crosschain, Fund Naira)
- **Brand red background (#FF2E01)** — the signature "money action" mode
- White text throughout
- Close button (top-left, white circle with cancel icon)
- Title centered in header
- `AnimatedAmount` display centered vertically
- `Keypad` with `variant="dark"` pinned to bottom
- CTA button between amount and keypad

#### 4. Flow Screens (Withdraw, KYC, Stash)
- Multi-step flows with progress indication
- `SafeAreaView` with white background
- Back button (top-left, surface-colored circle)
- Step content with `FadeInDown` entrance animation
- CTA pinned to bottom

#### 5. Detail Screens (Transaction Detail, Market Asset)
- Full-screen with scroll
- `FloatingBackButton` (blurred circle, bottom-left) for immersive content
- Content-first layout — data above chrome

### Navigation Rules

1. **Tab bar for top-level navigation only.** Currently: Home, History, Settings. Max 5 tabs (Apple HIG).
2. **`router.push()` for forward navigation.** New screens slide in from right.
3. **`router.back()` for backward navigation.** Screens slide out to right.
4. **`router.replace()` for completion redirects.** After a flow completes (funding success, auth complete), replace the stack so the user can't go back to the completed flow.
5. **Bottom sheets for secondary actions.** Funding options, transaction details, confirmations — anything that doesn't need a full screen.
6. **Modals for focused tasks.** KYC verification, camera overlay, payment modals (ChainRails).
7. **Never nest navigators.** Expo Router handles the stack. Don't create sub-navigators inside screens.

### Header Patterns

| Context | Left | Center | Right |
|---------|------|--------|-------|
| Home tab | Avatar | — | Notification bell |
| Funding screen | Close button (white/20 circle) | Screen title (20px Semibold, white) | Empty 44px spacer |
| Flow screen | Back button (surface circle) | — or step indicator | — |
| Sheet | — | — | Close button (Cancel01Icon) |

---

## 10. Lessons Stolen from the Best

### From Cash App: Keypad-First Money Input
Cash App proved that a keypad is the fastest way to input money. Rail Money adopted this for all funding flows. The amount display is large, centered, and animated. The keypad is always visible — no keyboard, no input field. This reduces cognitive load to near zero: see amount → tap digits → confirm.

**What Rail adds:** Spring-animated digit transitions (`AnimatedAmount`), haptic feedback on every key, and the brand-red background that creates a distinct "money mode" mental state.

### From Cash App: Bold Brand Color as Interface
Cash App's hyper neon green IS the interface. Rail Money's `#FF2E01` red serves the same purpose — it's not decoration, it's identity. When you see that red, you know you're in Rail Money. Use it sparingly but boldly.

### From Revolut: Progressive Disclosure
Revolut never shows everything at once. The home screen shows balance and recent transactions. Tap for details. Tap again for advanced options. Rail Money follows this: the home screen is clean (balance + stash cards + recent transactions). Complexity lives in sheets and sub-screens.

### From Revolut: Customizable Widgets
Revolut lets users rearrange their dashboard. Rail Money's stash cards and feature banners serve a similar purpose — modular blocks that surface what matters to each user. Future: let users choose which cards appear on their home screen.

### From Revolut: Real-Time Feedback
Every action in Revolut gets instant visual feedback. Rail Money implements this through:
- Feedback popups for all state changes
- Optimistic UI updates (balance changes before server confirms)
- Pull-to-refresh with animated refresh control
- Loading skeletons instead of spinners

### From Duolingo: The Habit Loop
Duolingo's retention comes from: Trigger → Action → Reward → Investment. Rail Money can apply this:
- **Trigger:** Push notification ("Your stash grew $12.40 this week")
- **Action:** Open app (near-zero friction — passcode/biometric)
- **Reward:** See balance increase, animated celebration
- **Investment:** Streak of consecutive savings weeks, growing stash balance

### From Duolingo: Safe Failure Design
Duolingo makes wrong answers feel like learning, not punishment. Rail Money must make financial errors feel recoverable:
- Failed transaction? Show exactly what happened + retry button
- KYC rejected? Show which document to re-upload
- Insufficient balance? Show how much more is needed + funding shortcut
- **Never show a dead-end error screen.** Every error has a next step.

### From Duolingo: Celebration Moments
Duolingo celebrates EVERYTHING — correct answers, streaks, level-ups. Rail Money should celebrate:
- First deposit (confetti + success screen)
- Stash milestones ($100, $500, $1000 saved)
- Streak achievements (consecutive weeks of saving)
- Card activation
- Use the existing `Confetti` component + notification haptics for these moments.

### From Duolingo: Color as Energy System
Duolingo uses saturated colors to create energy and excitement. Each color carries meaning. Rail Money's color system should be equally intentional:
- Red = brand energy, action mode
- Green = money arrived, growth
- White = calm, daily use
- Surface gray = information grouping
- Never use color randomly. Every color must mean something.

### From Wise: Transparency Builds Trust
Wise shows real exchange rates, fee breakdowns, and delivery estimates upfront. Rail Money must be equally transparent:
- Show fees before confirmation, never after
- Show exchange rates with source and timestamp
- Show transaction status in real-time (pending → processing → complete)
- Show exactly where money is going (address, network, recipient)

### From Stripe: Progressive Disclosure in Complex Flows
Stripe's onboarding collects complex business information without overwhelming users. Each step is one focused task. Rail Money's KYC flow follows this pattern — one screen per data category, clear progress indication, ability to go back and edit.

---

## 11. Accessibility Rules

### Non-Negotiable Requirements

1. **All interactive elements have `accessibilityRole`** — "button", "tab", "link", etc.
2. **All interactive elements have `accessibilityLabel`** — descriptive, not visual ("Submit order", not "Blue button")
3. **All interactive elements have `accessibilityState`** — `{ disabled, selected, busy }` as appropriate
4. **Touch targets are minimum 44×44 points** — use `hitSlop` to extend small visual elements
5. **Color is never the only indicator** — pair with icons, text, or patterns
6. **Contrast ratio minimum 4.5:1** for normal text, 3:1 for large text
7. **Loading states use `accessibilityState={{ busy: true }}`** and announce via `accessibilityLabel`
8. **Images and icons have alt text** via `accessibilityLabel`

### Balance Visibility

The masked balance feature (`isBalanceVisible` toggle) is an accessibility AND privacy feature:
- When hidden: digits replaced with `•` characters
- The toggle button has clear accessibility labels: "Hide balance" / "Show balance"
- Transaction amounts also respect this toggle via `MaskedBalance` component
- **Rule:** Any component displaying a money amount MUST check `isBalanceVisible` from `uiStore`

---

## 12. Icon System

Rail Money uses **HugeIcons** (`@hugeicons/react-native`) as the primary icon library.

### Icon Sizing

| Context | Size | Stroke Width |
|---------|------|-------------|
| Tab bar | 26px | Default |
| Navigation (back, close) | 20-22px | Default |
| Transaction item icon | 24px | Default |
| Inline with text | 16px | Default |
| Feature/action icons | 20-24px | Default |
| Balance eye toggle | 24px | 0.9 (thinner for subtlety) |

### Icon Usage Rules

1. **Use HugeIcons for all UI icons.** Never mix icon libraries within the same screen.
2. **Icons inside circles:** Transaction icons sit in 44×44px colored circles. Action icons sit in 48×48px surface-colored circles.
3. **Icon color follows context:** Active tab = `#FF2E01`, inactive tab = `#8C8C8C`, on dark bg = `#FFFFFF`, on light bg = `#000000` or `#757575`.
4. **Close buttons always use `Cancel01Icon`** at 20-22px.
5. **Back buttons always use `ArrowLeft01Icon`** at 20-28px.

---

## 13. Onboarding & First Impressions

### Splash Screen
- Brand red background (`#FF2E01`)
- Centered logo (150×150px) with spring entrance + periodic shake animation
- Light status bar
- Transitions to auth or home based on session state

### Onboarding Slides
- 4 slides, auto-advance every 6 seconds
- Each slide: title (bold, philosophical), subtitle (practical), description (one sentence), image
- Tone: confident, slightly provocative ("Your money shouldn't depend on willpower")
- Swipe to advance, dots indicator

### Auth Flow Design Language
- White background, no gradients
- Large bold titles (40px) that make a statement
- Staggered form field entrance (50ms delay between fields)
- Inline validation with warning popups
- "Forgot Password?" as subtle text link (self-end aligned)
- Sign up/sign in cross-links at bottom

---

## 14. The Rail Money Design Checklist

Use this checklist before shipping any new screen or component:

### Visual
- [ ] White background (unless it's a funding/splash screen)
- [ ] Correct font family and size from the type scale
- [ ] Money amounts use SF Mono with tabular-nums
- [ ] Colors match the semantic palette (no random hex values)
- [ ] Border radius follows the system (8/16/24/full)
- [ ] Spacing uses tokens (4/8/16/24/32/48)
- [ ] Cards use 24px border radius
- [ ] Buttons are pill-shaped (rounded-full)

### Interaction
- [ ] All pressable elements have spring press feedback (scale 0.97)
- [ ] All pressable elements trigger appropriate haptic tier
- [ ] Screen content enters with StaggeredChild or AnimatedScreen
- [ ] Bottom sheets use GorhomBottomSheet
- [ ] Loading states use Skeleton components, not spinners
- [ ] Error states show actionable guidance

### Accessibility
- [ ] All interactive elements have accessibilityRole
- [ ] All interactive elements have accessibilityLabel
- [ ] Touch targets are minimum 44×44 points
- [ ] Color is not the only indicator for any state
- [ ] Money amounts respect isBalanceVisible toggle

### Navigation
- [ ] Safe areas respected on all edges
- [ ] Back/close button in correct position
- [ ] Success flows use router.replace() (no going back)
- [ ] Sheets dismiss with haptic feedback
- [ ] Keyboard-avoiding behavior on forms

### Performance
- [ ] Animations use useNativeDriver or reanimated worklets
- [ ] Lists use FlatList/FlashList, not map() in ScrollView
- [ ] Images are appropriately sized and cached
- [ ] No unnecessary re-renders (check with React DevTools)

---

## 15. What Makes Rail Money Unique

Rail Money is not Revolut, Cash App, or Duolingo. It borrows their best ideas but combines them into something new:

| Competitor | Their Edge | Rail Money's Version |
|-----------|-----------|---------------------|
| Cash App | Keypad-first payments, bold brand color | Red keypad funding screens, spring-animated amounts |
| Revolut | Progressive disclosure, widget customization | Clean home screen, modular stash cards, bottom sheets for depth |
| Duolingo | Habit loops, safe failure, celebration | Savings streaks (future), recoverable errors, confetti milestones |
| Wise | Transparency, real-time tracking | Fee breakdowns, transaction status tracking, clear confirmations |
| Stripe | Developer-first, progressive onboarding | Step-by-step KYC, clear progress indicators |
| Apple (HIG) | Clarity, deference, depth, consistency | SF Pro typography, 44pt targets, spring physics, blur effects |

**The Rail Money formula:**
> Cash App's boldness + Revolut's intelligence + Duolingo's habit psychology + Apple's craft = A wealth-building app that feels like a premium instrument, not a banking chore.

---

*This document is the source of truth for all Rail Money design decisions. When in doubt, refer here. When this document conflicts with a one-off design choice, this document wins.*
