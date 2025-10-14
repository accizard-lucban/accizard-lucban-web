# AcciZard UI Design Guide
## Complete Design System & Brand Guidelines

### Design Philosophy
AcciZard follows a **"Clean Professionalism with Flat Design & Strategic Gradients"** aesthetic that prioritizes:
- **Accessibility and clarity** for emergency situations
- **Professional trust** through clean, flat design
- **Data readability** for complex dashboard information
- **Modern usability** with strategic gradient accents
- **Consistency** through comprehensive design standards

---

## Core Design System

### Primary Aesthetic: Material Design 3.0 Foundation
- **Clean card-based layouts** with flat design principles
- **High contrast** for emergency readability
- **Consistent navigation** patterns
- **Clear information hierarchy**
- **Strategic gradient accents** for brand identity

### Visual Approach: Flat Design with Gradients
- **Flat cards** with subtle shadows for depth
- **Strategic gradients** for navigation and brand elements
- **Solid backgrounds** for readability
- **Clean borders** and spacing
- **High contrast** for critical information

---

## Color System

### Core Brand Colors

#### Primary Colors
```css
--brand-orange: #f97316 (orange-500)        /* Main brand color */
--brand-orange-hover: #fb923c (orange-400)  /* Interactive states */
--brand-red: #991b1b (red-800)              /* Secondary/accent color */
--brand-red-hover: #b91c1c (red-700)        /* Secondary hover states */
```

#### Neutral Foundation
```css
--text-primary: #1f2937 (gray-800)      /* Main text */
--text-secondary: #4b5563 (gray-600)    /* Secondary text */
--text-muted: #9ca3af (gray-400)        /* Muted text */
--bg-page: #f9fafb (gray-50)            /* Page backgrounds */
--bg-surface: #ffffff (white)           /* Card backgrounds */
--bg-card: #f3f4f6 (gray-100)           /* Surface backgrounds */
--border-default: #d1d5db (gray-300)    /* Borders, inputs */
```

#### Semantic Colors
```css
--success: #059669 (green-600)          /* Success states */
--warning-bg: #fef3c7 (yellow-100)      /* Warning backgrounds */
--warning-text: #92400e (yellow-800)    /* Warning text */
--error: #ef4444 (red-500)              /* Error states */
--info-bg: #dbeafe (blue-100)           /* Info backgrounds */
--info-text: #1e40af (blue-800)         /* Info text */
```

### Quick Color Reference (Tailwind Classes)

#### Primary Actions
- **Main buttons**: `bg-brand-orange hover:bg-brand-orange-400 text-white`
- **Focus states**: `focus:ring-brand-orange focus:border-brand-orange`
- **Active states**: `bg-brand-orange text-white`

#### Secondary Actions  
- **Secondary buttons**: `bg-brand-red hover:bg-brand-red-700 text-white`
- **Outline buttons**: `border-gray-300 text-gray-800 hover:bg-gray-50`
- **Tertiary buttons**: `bg-gray-100 hover:bg-gray-200 text-gray-800`

#### Text Colors
- **Primary text**: `text-gray-800`
- **Secondary text**: `text-gray-600`
- **Muted text**: `text-gray-400`
- **Brand text**: `text-brand-orange`
- **Secondary brand text**: `text-brand-red`

#### Backgrounds
- **Page background**: `bg-gray-50`
- **Card background**: `bg-white`
- **Surface**: `bg-gray-100`

#### Sidebar Colors
- **Background**: `bg-gradient-to-b from-brand-orange to-brand-red`
- **Hover**: `hover:bg-brand-orange-400/20`
- **Border**: `border-brand-orange-400/30`

---

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

### Component-Specific Text Size Guide

Use this guide to ensure consistency across similar UI components:

| Component Type | Primary Text | Secondary Text | Metadata | Example |
|----------------|--------------|----------------|----------|---------|
| **Dashboard Stats Card** | `text-2xl font-bold` (value) | `text-sm font-medium` (title) | `text-xs text-gray-500` (description) | Total Reports: 1,240 |
| **Weather Card** | `text-2xl font-bold` (temp) | `text-sm text-gray-600` (condition) | `text-xs text-gray-500` (details) | 28°C, Partly Cloudy |
| **Form Input** | `text-sm sm:text-base` (input) | `text-sm sm:text-base font-medium` (label) | `text-xs text-gray-500` (helper) | Email field with hint |
| **Login/Auth Header** | `text-2xl sm:text-3xl font-bold` (title) | `text-sm text-gray-600` (subtitle) | - | "Account Login" |
| **Page Header** | `text-2xl font-bold` (title) | `text-sm text-gray-500` (subtitle) | - | Dashboard overview |
| **Dialog/Modal Header** | `text-lg font-semibold` (title) | `text-sm text-gray-600` (description) | - | Confirmation dialog |
| **User Profile Display** | `text-sm font-medium` (name) | `text-sm text-gray-500` (role) | - | Header dropdown |
| **Notification Item** | `text-sm font-medium` (title) | `text-xs text-gray-700` (content) | `text-xs text-gray-400` (timestamp) | New report alert |
| **Tab/Toggle Button** | `text-xs sm:text-sm font-medium` | - | - | Super Admin / Admin |
| **Chart Legend** | `text-sm` | - | - | Road Crash (45%) |
| **Weather Forecast Day** | `text-lg font-bold` (temp) | `text-sm font-medium` (day) | `text-xs text-gray-500` (condition) | 5-day outlook |
| **Toast/Alert Message** | `text-sm text-gray-600` | - | - | Success message |

### Text Size Consistency Checklist

Before committing your component, verify:

- [ ] **Page titles** use `text-2xl` or `text-2xl sm:text-3xl` with `font-bold`
- [ ] **Section headers** use `text-lg` with `font-semibold`
- [ ] **Card titles** use `text-sm` or `text-base` with `font-medium` or `font-semibold`
- [ ] **Form labels** use `text-sm sm:text-base` with `font-medium`
- [ ] **Form inputs** use `text-sm sm:text-base`
- [ ] **Body text** uses `text-sm` with `text-gray-600` or `text-gray-800`
- [ ] **Helper text/metadata** uses `text-xs` with `text-gray-500` or `text-gray-400`
- [ ] **Dashboard stats** use `text-2xl font-bold` for numbers
- [ ] **Buttons** use `text-sm sm:text-base` with `font-medium`
- [ ] **Responsive sizing** is applied where appropriate (especially for forms and titles)
- [ ] **Line height** is set appropriately for the text size
- [ ] **Font weight** matches the semantic importance (normal → medium → semibold → bold)

### Common Mistakes to Avoid

#### ❌ Don't Do This

```tsx
// Inconsistent stat card sizes
<div className="text-3xl">1,240</div>  // Too large
<div className="text-base">23</div>     // Too small

// Missing responsive sizing on forms
<Input className="text-base" />         // Not responsive

// Wrong weight for importance
<h1 className="text-2xl font-medium">  // Too light for page title

// Unspecified text size (defaults to base)
<div className="text-gray-500">John Doe</div>  // Should specify text-sm

// Mixing sizes for similar content
<label className="text-sm">Email</label>
<label className="text-base">Password</label>  // Inconsistent
```

#### ✅ Do This Instead

```tsx
// Consistent stat card sizes
<div className="text-2xl font-bold text-brand-orange">1,240</div>
<div className="text-2xl font-bold text-brand-red">23</div>

// Responsive form inputs
<Input className="text-sm sm:text-base" />

// Correct weight for page titles
<h1 className="text-2xl font-bold text-gray-800">

// Always specify text size
<div className="text-sm text-gray-500">John Doe</div>

// Consistent sizes for similar elements
<label className="text-sm font-medium text-gray-800">Email</label>
<label className="text-sm font-medium text-gray-800">Password</label>
```

### Typography Testing Guide

When implementing a new component or page:

1. **Compare with existing patterns**: Look at similar components in the codebase
2. **Use the component table above**: Find the matching component type
3. **Test responsive behavior**: Check text sizes on mobile (< 640px) and desktop
4. **Verify hierarchy**: Ensure visual hierarchy matches semantic importance
5. **Check readability**: Text should be comfortable to read at typical viewing distances
6. **Validate contrast**: Ensure text colors meet accessibility standards with their backgrounds

---

## Component Guidelines

### Buttons
```tsx
/* Primary Actions */
<Button className="bg-brand-orange hover:bg-brand-orange-400 text-white shadow-sm text-sm sm:text-base font-medium">
  Primary Action
</Button>

/* Secondary Actions */
<Button className="bg-brand-red hover:bg-brand-red-700 text-white shadow-sm text-sm sm:text-base font-medium">
  Secondary Action
</Button>

/* Emergency Actions */
<Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg font-semibold text-sm sm:text-base">
  Emergency Action
</Button>

/* Tertiary Actions */
<Button className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-sm sm:text-base">
  Tertiary Action
</Button>

/* Outline Buttons */
<Button className="border-gray-300 text-gray-800 hover:bg-gray-50 text-sm sm:text-base">
  Outline Button
</Button>
```

### Cards and Surfaces
```tsx
/* Standard Cards */
<Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
  <CardContent className="p-6">
    Content
  </CardContent>
</Card>

/* Elevated Cards (for important data) */
<Card className="bg-white border border-gray-200 shadow-md rounded-lg">
  <CardContent className="p-6">
    Important Content
  </CardContent>
</Card>

/* Accent Cards (with subtle gradient) */
<Card className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg">
  <CardContent className="p-6">
    Highlighted Content
  </CardContent>
</Card>

/* Modal/Dialog Cards */
<Card className="bg-white border border-gray-200 shadow-xl rounded-lg">
  <CardContent className="p-6">
    Modal Content
  </CardContent>
</Card>
```

### Form Inputs
```tsx
/* Standard Inputs */
<Input className="border-gray-300 focus:border-brand-orange focus:ring-brand-orange/20 bg-white text-sm sm:text-base h-10 sm:h-12" />

/* Error States */
<Input className="border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50 text-sm sm:text-base h-10 sm:h-12" />

/* Success States */
<Input className="border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50 text-sm sm:text-base h-10 sm:h-12" />

/* With Labels */
<div className="space-y-2">
  <Label className="text-sm sm:text-base font-medium text-gray-800">Email Address</Label>
  <Input className="border-gray-300 focus:ring-brand-orange focus:border-brand-orange text-sm sm:text-base h-10 sm:h-12" />
  <span className="text-xs text-gray-500">We'll never share your email</span>
</div>
```

### Status Indicators
```tsx
/* Success Badge */
<Badge className="bg-green-100 text-green-800 border-green-200">
  Success
</Badge>

/* Warning Badge */
<Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
  Warning
</Badge>

/* Error Badge */
<Badge className="bg-red-100 text-red-800 border-red-200">
  Error
</Badge>

/* Emergency Badge */
<Badge className="bg-red-600 text-white border-red-700 font-semibold">
  Emergency
</Badge>

/* Info Badge */
<Badge className="bg-blue-100 text-blue-800 border-blue-200">
  Info
</Badge>
```

---

## Gradient System

### Primary Gradient (Navigation/Sidebar)
```tsx
// Main sidebar gradient
className="bg-gradient-to-b from-brand-orange to-brand-red"
// Used for: Sidebar, main navigation, primary brand areas
```

### Accent Gradients (Subtle Backgrounds)
```tsx
// Light accent for cards (very subtle)
className="bg-gradient-to-br from-orange-50 to-red-50"

// Slightly stronger for highlights
className="bg-gradient-to-br from-orange-100 to-red-100"

// Medium strength for emphasis
className="bg-gradient-to-br from-orange-200 to-red-200"
```

### Hero/CTA Gradients (High Impact)
```tsx
// Horizontal gradient for hero sections
className="bg-gradient-to-r from-brand-orange to-brand-red text-white"

// Diagonal gradient for dynamic feel
className="bg-gradient-to-br from-brand-orange via-orange-600 to-brand-red text-white"

// Vertical gradient for headers
className="bg-gradient-to-b from-brand-orange to-brand-red text-white"
```

### Status Gradients
```tsx
// Success gradient
className="bg-gradient-to-r from-green-500 to-green-600 text-white"

// Warning gradient
className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"

// Error/Emergency gradient
className="bg-gradient-to-r from-red-500 to-red-600 text-white"

// Info gradient
className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
```

### Gradient Applications

```tsx
/* Sidebar Navigation */
<div className="bg-gradient-to-b from-brand-orange to-brand-red min-h-screen">
  Navigation Content
</div>

/* Accent Cards */
<Card className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200">
  <CardContent className="p-6">
    Highlighted Content
  </CardContent>
</Card>

/* Hero Sections */
<div className="bg-gradient-to-r from-brand-orange to-brand-red text-white p-12">
  <h1 className="text-4xl font-bold">Welcome to AcciZard</h1>
</div>

/* Status Highlights */
<div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md p-4">
  <p className="font-semibold">Report Resolved Successfully</p>
</div>

/* Button with Gradient Background */
<Button className="bg-gradient-to-r from-brand-orange to-brand-red hover:from-brand-orange-400 hover:to-brand-red-700 text-white">
  Get Started
</Button>
```

### Gradient Best Practices

1. **Use Sparingly**: Gradients should enhance, not overwhelm
2. **Maintain Readability**: Ensure text contrast remains high (4.5:1 minimum for body text)
3. **Consistent Direction**: 
   - Use `to-b` (top to bottom) for sidebars and vertical navigation
   - Use `to-r` (left to right) for CTAs and hero sections
   - Use `to-br` (top-left to bottom-right) for accent cards
4. **Limit Color Range**: Stick to 2-3 colors maximum in a gradient
5. **Brand Consistency**: Primary gradients should always use brand orange and red
6. **Avoid Complex Gradients on Text Areas**: Use solid backgrounds for body text areas
7. **Test Accessibility**: Always verify WCAG compliance for text on gradients

---

## Layout Principles

### Spacing System
```css
/* Consistent spacing scale */
--space-xs: 0.25rem (4px)   /* gap-1, p-1 */
--space-sm: 0.5rem (8px)    /* gap-2, p-2 */
--space-md: 1rem (16px)     /* gap-4, p-4 */
--space-lg: 1.5rem (24px)   /* gap-6, p-6 */
--space-xl: 2rem (32px)     /* gap-8, p-8 */
--space-2xl: 3rem (48px)    /* gap-12, p-12 */
```

### Grid and Layout Patterns

```tsx
/* Dashboard Grid */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stat cards */}
</div>

/* Two Column Layout */
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Content sections */}
</div>

/* Card with Consistent Padding */
<Card className="bg-white border border-gray-200">
  <CardHeader className="pb-4">
    <CardTitle className="text-lg font-semibold">Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6">
    Content
  </CardContent>
</Card>
```

---

## Emergency-Specific Guidelines

### High Priority Elements
- **Emergency buttons**: Use `bg-red-600 hover:bg-red-700` with `shadow-lg` for maximum visibility
- **Critical alerts**: Solid backgrounds with high contrast text (minimum 7:1 ratio)
- **Status indicators**: Clear, unambiguous colors (red for danger, green for safe, orange for warning)
- **Data visualization**: Minimal styling, focus on data clarity and readability

### Accessibility Requirements
- **Minimum contrast ratio**: 4.5:1 for normal text, 3:1 for large text (18px+)
- **Focus indicators**: Visible focus rings on all interactive elements using brand colors
- **Touch targets**: Minimum 44px height for mobile interactions (use `h-10 sm:h-12`)
- **Screen reader support**: Proper ARIA labels and semantic HTML
- **Keyboard navigation**: All interactive elements must be keyboard accessible

### Emergency Action Patterns

```tsx
/* Emergency Alert */
<Alert className="bg-red-600 text-white border-red-700">
  <AlertTriangle className="h-5 w-5" />
  <AlertTitle className="text-white font-bold">Critical Alert</AlertTitle>
  <AlertDescription className="text-white">
    Immediate action required
  </AlertDescription>
</Alert>

/* Emergency Button */
<Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg font-semibold text-base h-12">
  <AlertTriangle className="mr-2 h-5 w-5" />
  Emergency Response
</Button>

/* High Priority Status */
<Badge className="bg-red-600 text-white border-red-700 font-bold text-sm px-3 py-1">
  URGENT
</Badge>
```

---

## Modern UI Elements

### Micro-interactions
```css
/* Subtle hover effects */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Button press effect */
.button-press:active {
  transform: translateY(1px);
}

/* Loading states */
.loading-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Success feedback */
.success-bounce {
  animation: bounce 0.6s ease-in-out;
}

/* Fade in animation */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Floating Elements

```tsx
/* Floating Action Button */
<Button className="fixed bottom-6 right-6 bg-brand-orange hover:bg-brand-orange-400 text-white rounded-full shadow-lg h-14 w-14">
  <Plus className="h-6 w-6" />
</Button>

/* Modal Overlay */
<div className="fixed inset-0 bg-black/50 z-40">
  <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
    <Card className="bg-white border border-gray-200 shadow-2xl rounded-lg max-w-lg w-full">
      <CardContent className="p-6">
        Modal Content
      </CardContent>
    </Card>
  </div>
</div>

/* Notification Toast */
<div className="fixed top-4 right-4 bg-white border border-gray-200 shadow-lg rounded-lg p-4 max-w-sm">
  <p className="text-sm text-gray-800">Notification message</p>
</div>
```

---

## Dashboard-Specific Guidelines

### Data Visualization
- **Charts**: Clean, minimal styling with brand colors
- **Tables**: Alternating row colors (`bg-gray-50` for even rows)
- **Cards**: Consistent padding (`p-6`) and spacing
- **Metrics**: Large, bold numbers (`text-2xl font-bold`) with clear labels

### Dashboard Layout Pattern

```tsx
/* Dashboard Stats Row */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
      <FileText className="h-4 w-4 text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-brand-orange">1,240</div>
      <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
    </CardContent>
  </Card>
</div>

/* Data Table */
<Card>
  <CardHeader>
    <CardTitle className="text-lg font-semibold">Recent Reports</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead className="text-sm font-semibold">ID</TableHead>
          <TableHead className="text-sm font-semibold">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="hover:bg-gray-50">
          <TableCell className="text-sm">001</TableCell>
          <TableCell><Badge>Active</Badge></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### Navigation
- **Sidebar**: Gradient background (`bg-gradient-to-b from-brand-orange to-brand-red`)
- **Active states**: Clear visual indication with lighter background
- **Icons**: Consistent sizing (`h-5 w-5`) with proper spacing
- **Mobile**: Collapsible sidebar with overlay backdrop

---

## Implementation Checklist

### Phase 1: Core Foundation
- [ ] Implement Material Design 3.0 card system with flat design
- [ ] Apply consistent spacing and typography standards
- [ ] Ensure high contrast for accessibility (4.5:1 minimum)
- [ ] Test with screen readers and keyboard navigation
- [ ] Implement responsive breakpoints (sm, md, lg, xl)

### Phase 2: Visual Enhancement
- [ ] Apply strategic gradient accents (sidebar, hero sections)
- [ ] Implement subtle micro-interactions (hover, focus states)
- [ ] Create floating action buttons for key actions
- [ ] Add loading states and user feedback (toasts, alerts)
- [ ] Enhance with consistent shadows and borders

### Phase 3: Emergency Optimization
- [ ] Optimize critical actions for emergency situations
- [ ] Test under stress conditions and varying network speeds
- [ ] Ensure mobile responsiveness across all devices
- [ ] Validate WCAG 2.1 AA accessibility compliance
- [ ] Implement proper error handling and user guidance

---

## Brand Consistency

### Do's ✅
- Use brand orange (#f97316) for primary actions and main CTAs
- Use brand red (#991b1b) for secondary actions and accents
- Maintain high contrast (4.5:1+) for all text on backgrounds
- Apply consistent spacing using the defined scale
- Use flat design with strategic gradient accents
- Implement responsive typography (`text-sm sm:text-base`)
- Follow the component-specific text size guide
- Use proper semantic HTML and ARIA labels
- Test on mobile and desktop viewports
- Maintain clean, professional layouts

### Don'ts ❌
- Use heavy gradients that reduce readability
- Compromise accessibility for aesthetics
- Use inconsistent spacing or colors outside the palette
- Make emergency actions hard to find or unclear
- Use arbitrary text sizes not in the typography scale
- Ignore responsive design patterns
- Use low contrast color combinations
- Overwhelm interfaces with excessive gradients or effects
- Skip proper focus indicators on interactive elements
- Use glassmorphism or heavy transparency effects

---

## Quick Reference

### Common Patterns at a Glance

```tsx
// Page Title
<h1 className="text-2xl sm:text-3xl font-bold text-gray-800">

// Section Header
<h2 className="text-lg font-semibold text-gray-800">

// Form Label
<Label className="text-sm sm:text-base font-medium text-gray-800">

// Form Input
<Input className="text-sm sm:text-base h-10 sm:h-12 border-gray-300 focus:ring-brand-orange">

// Primary Button
<Button className="bg-brand-orange hover:bg-brand-orange-400 text-white text-sm sm:text-base font-medium">

// Card
<Card className="bg-white border border-gray-200 shadow-sm">

// Stat Number
<div className="text-2xl font-bold text-brand-orange">1,240</div>

// Helper Text
<span className="text-xs text-gray-500">Helper text</span>

// Sidebar Gradient
<div className="bg-gradient-to-b from-brand-orange to-brand-red">
```

---

This comprehensive guide ensures AcciZard maintains its professional, trustworthy appearance through clean flat design enhanced with strategic gradient accents, while prioritizing accessibility and usability for the critical nature of emergency management interfaces.
