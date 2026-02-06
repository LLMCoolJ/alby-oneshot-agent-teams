# Specification 04: Shared Components

## Purpose

Define reusable UI components that form the building blocks for all scenario pages.

## Dependencies

- [01-project-setup.md](./01-project-setup.md) - Tailwind CSS configuration
- [03-shared-types.md](./03-shared-types.md) - Type definitions

## Component Overview

| Component | Purpose | Location |
|-----------|---------|----------|
| Button | Primary action button | `src/components/ui/Button.tsx` |
| Input | Text input with label | `src/components/ui/Input.tsx` |
| Card | Container component | `src/components/ui/Card.tsx` |
| Badge | Status indicator | `src/components/ui/Badge.tsx` |
| Spinner | Loading indicator | `src/components/ui/Spinner.tsx` |
| QRCode | QR code display | `src/components/ui/QRCode.tsx` |
| CopyButton | Copy to clipboard | `src/components/ui/CopyButton.tsx` |

---

## Button Component

**File**: `src/components/ui/Button.tsx`

### Interface

```typescript
import type { ButtonVariant, Size } from '@/types';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}
```

### Implementation Requirements

1. Support variants: `primary`, `secondary`, `danger`, `ghost`
2. Support sizes: `sm`, `md`, `lg`
3. Show spinner when `loading` is true
4. Disable button when loading or disabled
5. Support optional leading icon
6. Full width option via className

### Visual Specifications

| Variant | Background | Text | Hover |
|---------|------------|------|-------|
| primary | `bg-bitcoin` (#f7931a) | white | `bg-bitcoin-dark` |
| secondary | `bg-slate-200` | slate-900 | `bg-slate-300` |
| danger | `bg-red-600` | white | `bg-red-700` |
| ghost | transparent | slate-600 | `bg-slate-100` |

| Size | Padding | Font Size |
|------|---------|-----------|
| sm | `py-1.5 px-3` | `text-sm` |
| md | `py-2 px-4` | `text-base` |
| lg | `py-3 px-6` | `text-lg` |

### Test Requirements

```typescript
// tests/unit/components/Button.test.tsx
describe('Button', () => {
  it('renders children correctly', () => {});
  it('applies primary variant styles by default', () => {});
  it('applies correct variant styles', () => {});
  it('shows spinner when loading', () => {});
  it('is disabled when loading', () => {});
  it('calls onClick when clicked', () => {});
  it('does not call onClick when disabled', () => {});
  it('renders with icon', () => {});
});
```

---

## Input Component

**File**: `src/components/ui/Input.tsx`

### Interface

```typescript
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: Size;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}
```

### Implementation Requirements

1. Support label above input
2. Show error message in red below input
3. Show hint in gray when no error
4. Support left and right addons (icons, buttons)
5. Apply error styling (red border) when error prop is set
6. Forward ref to input element

### Visual Specifications

- Border: `border-slate-300`, on error: `border-red-500`
- Focus: `ring-2 ring-bitcoin`
- Label: `text-sm font-medium text-slate-700`
- Error: `text-sm text-red-600`
- Hint: `text-sm text-slate-500`

### Test Requirements

```typescript
// tests/unit/components/Input.test.tsx
describe('Input', () => {
  it('renders label when provided', () => {});
  it('renders error message when provided', () => {});
  it('renders hint when no error', () => {});
  it('applies error styles when error is set', () => {});
  it('forwards ref to input element', () => {});
  it('handles onChange events', () => {});
  it('renders left addon', () => {});
  it('renders right addon', () => {});
});
```

---

## Card Component

**File**: `src/components/ui/Card.tsx`

### Interface

```typescript
export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
```

### Implementation Requirements

1. White background with subtle shadow and border
2. Optional title and subtitle in header
3. Optional header action (e.g., button) aligned right
4. Optional footer section
5. Configurable padding

### Visual Specifications

- Background: `bg-white`
- Border: `border border-slate-200`
- Shadow: `shadow-sm`
- Border radius: `rounded-xl`
- Title: `text-lg font-semibold text-slate-900`
- Subtitle: `text-sm text-slate-500`

### Test Requirements

```typescript
// tests/unit/components/Card.test.tsx
describe('Card', () => {
  it('renders children', () => {});
  it('renders title when provided', () => {});
  it('renders subtitle when provided', () => {});
  it('renders header action', () => {});
  it('renders footer', () => {});
  it('applies custom className', () => {});
});
```

---

## Badge Component

**File**: `src/components/ui/Badge.tsx`

### Interface

```typescript
import type { BadgeVariant, Size } from '@/types';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
}
```

### Implementation Requirements

1. Small inline element for status display
2. Support color variants
3. Optional dot indicator
4. Pill-shaped (fully rounded)

### Visual Specifications

| Variant | Background | Text |
|---------|------------|------|
| success | `bg-green-100` | `text-green-800` |
| warning | `bg-yellow-100` | `text-yellow-800` |
| error | `bg-red-100` | `text-red-800` |
| info | `bg-blue-100` | `text-blue-800` |
| default | `bg-slate-100` | `text-slate-800` |

### Test Requirements

```typescript
// tests/unit/components/Badge.test.tsx
describe('Badge', () => {
  it('renders children', () => {});
  it('applies default variant', () => {});
  it('applies correct variant colors', () => {});
  it('applies size classes', () => {});
});
```

---

## Spinner Component

**File**: `src/components/ui/Spinner.tsx`

### Interface

```typescript
export interface SpinnerProps {
  size?: Size;
  className?: string;
}
```

### Implementation Requirements

1. Animated spinning circle
2. Use CSS animation (not JS)
3. Accessible with `role="status"` and sr-only text

### Visual Specifications

- Color: `border-bitcoin` with transparent segment
- Animation: `animate-spin`
- Sizes: sm=16px, md=24px, lg=32px

### Test Requirements

```typescript
// tests/unit/components/Spinner.test.tsx
describe('Spinner', () => {
  it('renders with spin animation', () => {});
  it('has accessible role', () => {});
  it('applies size classes', () => {});
});
```

---

## QRCode Component

**File**: `src/components/ui/QRCode.tsx`

### Interface

```typescript
export interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  showValue?: boolean;
  label?: string;
}
```

### Implementation Requirements

1. Use `qrcode.react` library
2. Display QR code at specified size (default 200px)
3. Optional: show truncated value below QR
4. Optional: show label above QR
5. Include copy button for value

### Visual Specifications

- Container: `bg-white p-4 rounded-lg`
- QR: centered, with padding
- Label: `text-sm font-medium text-slate-700`
- Value: `text-xs font-mono text-slate-500 truncate`

### Test Requirements

```typescript
// tests/unit/components/QRCode.test.tsx
describe('QRCode', () => {
  it('renders QR code with correct value', () => {});
  it('applies custom size', () => {});
  it('shows value when showValue is true', () => {});
  it('shows label when provided', () => {});
  it('includes copy functionality', () => {});
});
```

---

## CopyButton Component

**File**: `src/components/ui/CopyButton.tsx`

### Interface

```typescript
export interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  onCopied?: () => void;
}
```

### Implementation Requirements

1. Copy text to clipboard on click
2. Show visual feedback (icon change, toast) on success
3. Handle copy failures gracefully
4. Use Clipboard API with fallback

### Visual Specifications

- Default: clipboard icon
- Copied: checkmark icon for 2 seconds
- Tooltip: "Copy" / "Copied!"

### Test Requirements

```typescript
// tests/unit/components/CopyButton.test.tsx
describe('CopyButton', () => {
  it('copies value to clipboard on click', () => {});
  it('shows copied state after click', () => {});
  it('calls onCopied callback', () => {});
  it('resets state after timeout', () => {});
});
```

---

## Component Index

**File**: `src/components/ui/index.ts`

```typescript
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { QRCode } from './QRCode';
export type { QRCodeProps } from './QRCode';

export { CopyButton } from './CopyButton';
export type { CopyButtonProps } from './CopyButton';
```

---

## Accessibility Requirements

All components must meet WCAG 2.1 AA standards:

1. **Keyboard Navigation**: All interactive elements focusable via Tab
2. **Focus Indicators**: Visible focus ring on all interactive elements
3. **Color Contrast**: Minimum 4.5:1 for text
4. **Screen Readers**: Appropriate ARIA labels and roles
5. **Motion**: Respect `prefers-reduced-motion`

---

## Test File Structure

```
tests/unit/components/
├── Button.test.tsx
├── Input.test.tsx
├── Card.test.tsx
├── Badge.test.tsx
├── Spinner.test.tsx
├── QRCode.test.tsx
└── CopyButton.test.tsx
```

---

## Acceptance Criteria

- [ ] All components render without errors
- [ ] All components have proper TypeScript types
- [ ] All components pass accessibility audit
- [ ] All variants/sizes render correctly
- [ ] Components work in light/dark mode (future)
- [ ] All component tests pass
- [ ] Components are properly exported from index

## Related Specifications

- [03-shared-types.md](./03-shared-types.md) - Type definitions
- [06-layout.md](./06-layout.md) - Uses Card, Button
- [07-scenario-1-simple-payment.md](./07-scenario-1-simple-payment.md) - Uses Input, QRCode, Button
