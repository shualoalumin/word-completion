# 🩺 Troubleshooting: UI Glitches in Practice Modal & Countdown

**Date**: 2026-02-05 **Issues**:

1. Long white box flashing briefly before the "Get Ready" modal appeared.
2. An unintended box/border surrounding the numbers during the "3, 2, 1"
   countdown.
3. Blinking text cursor appearing next to the countdown numbers.

## 🔴 Core Issues Identified

### 1. Initial State Flickering

- **Problem**: The `showGetReadyModal` state was initially set based on logic
  that evaluated _after_ the first render, or the component defaulted to a state
  that rendered the main content (or a loading skeleton) for a split second
  before showing the modal.
- **Impact**: Users saw a "white flash" or a "long white box" (Skeleton UI)
  before the dark-themed modal covered it.

### 2. Default Browser Styling & Shadow/Border

- **Problem**: In some browsers or due to global CSS resets, the large countdown
  number container inherited a border, outline, or subtle box-shadow that looked
  like a "box" surrounding the number.
- **Impact**: The clean, minimalist countdown look was ruined by an ugly frame.

### 3. Focus Retention (Caret Blink)

- **Problem**: When the modal closed and the countdown started, the focus often
  remained on a button or an invisible element, causing the browser to render a
  blinking text cursor (caret) near the countdown numbers.

## 🟢 Solutions Applied

### 1. Deterministic Initial State

Modified the initial state to be `true` for all new sessions immediately upon
mounting:

```tsx
const isNewSession = !reviewExerciseId && !historyId;
const [showGetReadyModal, setShowGetReadyModal] = useState(isNewSession);
```

This prevents the component from even trying to render the main content
background or skeletons before the modal is ready.

### 2. Explicit Style Resets for Countdown

Added explicit CSS overrides to the countdown container to force-remove any
inherited borders or shadows:

```tsx
className={cn(
  "text-[120px] font-black leading-none",
  "[text-shadow:none] [box-shadow:none]" // Remove any unintended shadows
)}
style={{ outline: 'none', border: 'none' }} // Force remove borders/outlines
```

### 3. Caret & Focus Management

- Added `caretColor: 'transparent'` to the countdown wrapper.
- Implemented an effect to `blur()` any active element as soon as the countdown
  begins to ensure no cursor is visible.

## 📝 Lessons Learned

- **Initial State is King**: For full-screen overlays, the initial React state
  must favor the overlay to prevent layout shifts or flashes.
- **Reset Everything**: When using large fonts or unique UI elements, don't
  trust global styles—explicitly reset `box-shadow`, `outline`, and `border`.
- **UX is in the Details**: Small things like a blinking caret or a focus ring
  can break the immersion of a "Get Ready" sequence.
