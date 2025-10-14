# AcciZard Brand Guidelines
## Quick Reference for Developers

> **📖 For comprehensive design guidelines, see [UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md)**

## Quick Color Reference

### Primary Actions
- **Main buttons**: `bg-brand-orange hover:bg-brand-orange-400 text-white`
- **Focus states**: `focus:ring-brand-orange focus:border-brand-orange`
- **Active states**: `bg-brand-orange text-white`

### Secondary Actions  
- **Secondary buttons**: `bg-brand-red hover:bg-brand-red-700 text-white`
- **Outline buttons**: `border-gray-300 text-gray-800 hover:bg-gray-50`
- **Tertiary buttons**: `bg-gray-100 hover:bg-gray-200 text-gray-800`

### Text Colors
- **Primary text**: `text-gray-800`
- **Secondary text**: `text-gray-600`
- **Muted text**: `text-gray-400`
- **Brand text**: `text-brand-orange`
- **Secondary brand text**: `text-brand-red`

### Backgrounds
- **Page background**: `bg-gray-50`
- **Card background**: `bg-white`
- **Surface**: `bg-gray-100`

### Sidebar Colors
- **Background**: `bg-gradient-to-b from-brand-orange to-brand-red`
- **Hover**: `hover:bg-brand-orange-400/20`
- **Border**: `border-brand-orange-400/30`

## Common Components

### Form Inputs
```tsx
<Input className="border-gray-300 focus:ring-brand-orange focus:border-brand-orange" />
```

### Primary Buttons
```tsx
<Button className="bg-brand-orange hover:bg-brand-orange-400 text-white">
```

### Secondary Buttons
```tsx
<Button className="bg-brand-red hover:bg-brand-red-700 text-white">
```

### Status Badges
```tsx
<Badge className="bg-red-100 text-red-800">Emergency</Badge>
```

### Cards
```tsx
<Card className="bg-white border-gray-200">
```

## Typography System

### Font Family
- **Primary**: Poppins (defined in `tailwind.config.ts`)
- Applied globally via `font-poppins` class

### Typography Scale & Usage Guidelines

| Size Class | Font Size | Usage | Font Weight | Example |
|------------|-----------|-------|-------------|---------|
| `text-xs` | 0.75rem (12px) | Metadata, timestamps, helper text, small labels | `font-normal` or `font-medium` | "Last updated 2 mins ago" |
| `text-sm` | 0.875rem (14px) | Body text, form labels, descriptions, buttons | `font-normal` or `font-medium` | Form labels, card descriptions |
| `text-base` | 1rem (16px) | Default body text, form inputs, card titles | `font-normal` or `font-semibold` | Input fields, section content |
| `text-lg` | 1.125rem (18px) | Section headers, dialog titles, subheadings | `font-semibold` or `font-bold` | Dialog headings, card section titles |
| `text-xl` | 1.25rem (20px) | Page subtitles, prominent card headers | `font-bold` | Featured content headers |
| `text-2xl` | 1.5rem (24px) | Page titles, main headings, stat numbers | `font-bold` | Dashboard stats, page headers |
| `text-3xl` | 1.875rem (30px) | Hero titles, login/signup headers | `font-bold` | "Account Login", welcome messages |
| `text-4xl` | 2.25rem (36px) | Extra large hero text (use sparingly) | `font-bold` | Landing page heroes |

### Common Typography Patterns

#### Page Headers
```tsx
<h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
```

#### Section Headers
```tsx
<h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
```

#### Card Titles
```tsx
<CardTitle className="text-base sm:text-lg font-semibold text-gray-800">Statistics</CardTitle>
```

#### Form Labels
```tsx
<Label className="text-sm font-medium text-gray-800">Email Address</Label>
```

#### Body Text
```tsx
<p className="text-sm text-gray-600">Your account has been successfully created.</p>
```

#### Metadata/Helper Text
```tsx
<span className="text-xs text-gray-500">Updated 5 minutes ago</span>
```

#### Stat Numbers
```tsx
<div className="text-2xl font-bold text-brand-orange">1,240</div>
```

#### Descriptions
```tsx
<CardDescription className="text-sm text-gray-600">View and manage your reports</CardDescription>
```

### Responsive Typography

For better mobile experience, use responsive text sizes:

```tsx
// Page titles
className="text-2xl sm:text-3xl font-bold"

// Form inputs and labels
className="text-sm sm:text-base"

// Buttons
className="text-sm sm:text-base font-medium"
```

### Font Weight Guidelines

- **font-normal** (400): Regular body text, descriptions
- **font-medium** (500): Form labels, emphasized text, navigation items
- **font-semibold** (600): Section headers, card titles, dialog headers
- **font-bold** (700): Page titles, stat numbers, primary headings

### Line Height Best Practices

- **Small text** (xs, sm): Use default or `leading-normal` (1.5)
- **Body text** (base): Use `leading-relaxed` (1.625) for readability
- **Headings** (lg, xl, 2xl+): Use `leading-tight` (1.25) or `leading-snug` (1.375)

### Quick Reference Examples

```tsx
// Large Page Title
<h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">Page Title</h1>

// Section Header
<h2 className="text-lg font-semibold text-gray-800 leading-snug">Section Header</h2>

// Card Title
<h3 className="text-base font-semibold text-gray-800">Card Title</h3>

// Form Label
<label className="text-sm font-medium text-gray-800">Email Address</label>

// Body Text
<p className="text-sm text-gray-600 leading-relaxed">Description or body content goes here.</p>

// Small Metadata
<span className="text-xs text-gray-500">Helper text or timestamp</span>

// Dashboard Stat
<div className="text-2xl font-bold text-brand-orange">1,240</div>
<p className="text-xs text-gray-500">Active users</p>

// Button Text
<Button className="text-sm sm:text-base font-medium">Submit</Button>
```

---

**For detailed design principles, accessibility guidelines, and modern UI patterns, refer to the complete [UI Design Guide](./UI_DESIGN_GUIDE.md).**