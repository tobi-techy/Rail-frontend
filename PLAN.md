# Sound & Haptic Polish + Click Responsiveness Fix

## Context

Cuelume v0.1.2 ships 14 cues but we only use 10 in our export script and only expose 4 semantically in `lib/uiSounds.ts`. Several interactions (toggles, dismissals, errors, page transitions) have no dedicated sound. Additionally, users report needing multiple taps before a response — caused by dead handlers, double-haptic storms, triple-feedback scheduling, lazy player creation blocking the first touch, and `await` on void haptics creating microtask boundaries.

---

## Part 1: Add 4 Missing Cuelume Sounds

The 4 new sounds from Cuelume v0.1.2: `error`, `page`, `loading`, `ready`.

### 1A. Update export script

**File:** `scripts/export-cuelume-sounds.mjs`

Add the 4 new recipes to the `RECIPES` object (copy verbatim from Cuelume v0.1.2 source):

```js
error: {
  masterGain: 0.42,
  layers: [
    { kind: 'noise', filterType: 'bandpass', filterFrequency: 850, filterQ: 1.1, attack: 0.001, decay: 0.035, peak: 0.13 },
    { kind: 'tone', waveform: 'triangle', frequency: 440, offset: 0.025, attack: 0.004, decay: 0.09, peak: 0.045 },
    { kind: 'tone', waveform: 'triangle', frequency: 349.23, offset: 0.1, attack: 0.004, decay: 0.14, peak: 0.04 },
  ],
},
page: {
  masterGain: 0.38,
  layers: [
    { kind: 'noise', filterType: 'lowpass', filterFrequency: 1800, filterQ: 0.7, attack: 0.006, decay: 0.08, peak: 0.11 },
    { kind: 'noise', filterType: 'bandpass', filterFrequency: 4200, filterQ: 1.2, offset: 0.04, attack: 0.004, decay: 0.065, peak: 0.08 },
    { kind: 'tone', waveform: 'sine', frequency: 2400, offset: 0.075, attack: 0.002, decay: 0.045, peak: 0.02 },
  ],
},
loading: {
  masterGain: 0.42,
  layers: [
    { kind: 'noise', filterType: 'lowpass', filterFrequency: 1400, filterQ: 0.6, attack: 0.035, decay: 0.14, peak: 0.035 },
    { kind: 'tone', waveform: 'sine', frequency: 420, glideTo: 630, glideTime: 0.18, attack: 0.025, decay: 0.18, peak: 0.05 },
  ],
  shimmer: { delay: 0.11, feedback: 0.18, wet: 0.12, lowpass: 2800 },
},
ready: {
  masterGain: 0.45,
  layers: [
    { kind: 'noise', filterType: 'bandpass', filterFrequency: 3200, filterQ: 1.7, attack: 0.001, decay: 0.018, peak: 0.1 },
    { kind: 'tone', waveform: 'sine', frequency: 659.25, offset: 0.025, attack: 0.012, decay: 0.2, peak: 0.05 },
    { kind: 'tone', waveform: 'sine', frequency: 987.77, offset: 0.025, attack: 0.012, decay: 0.22, peak: 0.035 },
  ],
  shimmer: { delay: 0.13, feedback: 0.2, wet: 0.13, lowpass: 3600 },
},
```

Run `node scripts/export-cuelume-sounds.mjs` to generate the 4 new `.wav` files.

### 1B. Extend `lib/uiSounds.ts`

**File:** `lib/uiSounds.ts`

1. Add `error`, `page`, `loading`, `ready` to `CuelumeSound` type union
2. Add the 4 new `require()` entries to `CUELUME_SOURCES`
3. Add 4 new semantic `UISound` entries:
   - `toggle` → Cuelume `toggle` (for Switch components)
   - `dismiss` → Cuelume `droplet` (for closing sheets/modals/back navigation)
   - `error` → Cuelume `error` (for validation errors, API failures)
   - `pageTurn` → Cuelume `page` (for carousel/swipe/page transitions)
4. Add volume entries for the 4 new sounds (iOS: 1.0, Android: 1.15)

### 1C. Wire up new sounds across the app

**Switches/toggles** — Add `playUISound('toggle')` + `haptics.selection()`:

- `components/sheets/AppsSheet.tsx:91` (Switch `onValueChange`)
- `app/settings-notifications.tsx:34` (Switch `onValueChange`)
- `app/(tabs)/settings.tsx:200` (Switch `onValueChange` — sound/haptics toggle switches themselves)
- All other `Switch` components found via grep

**Dismiss/back** — Replace bare `playUISound('buttonClick')` with `playUISound('dismiss')`:

- `app/settings-notifications.tsx:50`
- `app/fund-crosschain.tsx:115`
- `app/withdraw/[method].tsx:452`
- `app/withdraw/usd/confirm.tsx:153`
- `app/withdraw/gbp/confirm.tsx:151`
- `app/withdraw/eur/confirm.tsx:154`
- `app/withdraw/crypto/confirm.tsx:157`
- `app/withdraw/early-withdraw.tsx:326`
- `app/kyc/tax-id.tsx:55`
- `app/kyc/verification-intro.tsx:57`
- `app/kyc/documents.tsx:148`
- `app/kyc/profile-gaps.tsx:32`
- `app/kyc/about-you.tsx:61`
- `app/kyc/source-of-funds.tsx:233`
- `app/kyc/didit-sdk.tsx:208`
- `app/fund-stash.tsx:301`
- `app/profile-edit.tsx:225`
- `components/card/CardIntroScreen.tsx:134`
- `components/sheets/VirtualAccountIntroSheet.tsx:162`
- `components/atoms/Modal.tsx:41` (backdrop dismiss)

**Error sound** — Add `playUISound('error')` + `haptics.error()`:

- `components/molecules/PasscodeInput.tsx` (when `status === 'error'`)
- Withdrawal failure handlers
- API error feedback popups

---

## Part 2: Fix Click Responsiveness

### 2A. Dead "Manage connectors" button (HIGH)

**File:** `components/sheets/AppsSheet.tsx:136`

Current: `onPress={() => { haptics.selection(); playUISound('buttonClick'); }}`
The handler fires feedback but has no action — button does nothing.

**Fix:** The button is meant to open a management flow. For now, close the sheet (the connectors aren't functional yet) or add a TODO comment + close sheet as placeholder:

```tsx
onPress={() => { haptics.selection(); playUISound('buttonClick'); onClose(); }}
```

### 2B. Double haptic on passcode entry (MEDIUM)

**Files:** `components/molecules/PasscodeInput.tsx:78,87` + `components/molecules/Keypad.tsx:51-55`

Keypad already calls `triggerFeedback()` (Medium haptic + keypress sound) before calling `onKeyPress()`. PasscodeInput then fires another `haptics.tap()` (Light haptic). During rapid passcode entry, this creates a storm of competing `setTimeout(0)` callbacks.

**Fix:** Remove `haptics.tap()` from `PasscodeInput.handleKeyPress` at lines 78 and 87. The Keypad's `triggerFeedback()` already covers both sound and haptic.

### 2C. Lazy player creation blocking first touch (MEDIUM)

**Files:** `lib/uiSounds.ts:116-127` + `app/_layout.tsx:104-110`

`warmUpUISounds()` is deferred behind `InteractionManager.runAfterInteractions` (via `DeferredPostHogProvider` → `PostReadyHooks`). If the user taps before warmup, `getPlayer()` creates a player synchronously in the touch handler, decoding the asset (10-50ms on low-end Android).

**Fix:** Move `warmUpUISounds()` into the main Layout's first `useEffect` (the one at line 198 that already runs security + fingerprint warmup). This fires immediately at mount, not deferred behind interactions:

```tsx
// In app/_layout.tsx useEffect at line 198:
import('@/lib/uiSounds').then((m) => m.warmUpUISounds()).catch(() => {});
```

And remove the `warmUpUISounds()` call from `PostReadyHooks` (keep the subscription sync logic there).

### 2D. Triple feedback before state update on filter taps (LOW-MEDIUM)

**File:** `app/(tabs)/history.tsx:198`

Current: `impact(Light); selection(); playUISound('buttonClick'); setActiveFilter(f.id);`
Three `setTimeout(0)` callbacks are queued before the state update.

**Fix:** Combine into `impact(Light) + playUISound('buttonClick')` only (drop redundant `selection()`), and move state update first:

```tsx
onPress={() => { setActiveFilter(f.id); impact(Haptics.ImpactFeedbackStyle.Light); playUISound('buttonClick'); }}
```

### 2E. `await` on void haptic (LOW)

**Files:** `components/sheets/VirtualAccountSheet.tsx:28` + `app/virtual-account.tsx:42`

Current: `await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);`
`impactAsync()` returns `void`, not `Promise`. `await undefined` creates an unnecessary microtask boundary before `Clipboard.setStringAsync`.

**Fix:** Remove `await`:

```tsx
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
await Clipboard.setStringAsync(value);
```

---

## Execution Order

1. **1A** — Update export script + run it → generates 4 new `.wav` files
2. **1B** — Extend `uiSounds.ts` with new types/sources/semantics
3. **2A** — Fix dead AppsSheet button
4. **2B** — Remove double haptic from PasscodeInput
5. **2C** — Move warmup earlier in `_layout.tsx`
6. **2D** — Fix triple feedback in history filters
7. **2E** — Fix await-on-void in virtual account
8. **1C** — Wire new sounds to toggles, dismiss, and error contexts
9. Run `bun run validate` to verify typecheck + lint + tests pass

---

## Files Modified

| File                                        | Change                                       |
| ------------------------------------------- | -------------------------------------------- |
| `scripts/export-cuelume-sounds.mjs`         | Add 4 new recipes                            |
| `assets/sounds/cuelume/*.wav`               | 4 new files generated                        |
| `lib/uiSounds.ts`                           | Extend types, sources, semantic map, volumes |
| `components/sheets/AppsSheet.tsx`           | Fix dead button handler                      |
| `components/molecules/PasscodeInput.tsx`    | Remove double haptic                         |
| `app/_layout.tsx`                           | Move warmUpUISounds earlier                  |
| `app/(tabs)/history.tsx`                    | Fix triple feedback                          |
| `components/sheets/VirtualAccountSheet.tsx` | Remove await-on-void                         |
| `app/virtual-account.tsx`                   | Remove await-on-void                         |
| ~15 files                                   | Wire new sounds (toggle, dismiss, error)     |
