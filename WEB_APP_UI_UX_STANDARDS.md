# Web Application UI/UX Standards Guide

> **Comprehensive guidelines for building intuitive, accessible, and user-friendly web applications**  
> Last Updated: October 20, 2025

---

## Table of Contents

1. [Visual Design Standards](#visual-design-standards)
2. [Typography](#typography)
3. [Color & Contrast](#color--contrast)
4. [Layout & Spacing](#layout--spacing)
5. [Navigation Patterns](#navigation-patterns)
6. [Interactive Elements](#interactive-elements)
7. [Forms & Input](#forms--input)
8. [Feedback & Status](#feedback--status)
9. [Responsive Design](#responsive-design)
10. [Accessibility (WCAG)](#accessibility-wcag)
11. [Performance](#performance)
12. [Content Strategy](#content-strategy)
13. [Error Handling](#error-handling)
14. [Loading States](#loading-states)
15. [Security UX](#security-ux)

---

## 1. Visual Design Standards

### Design Principles

#### **Consistency**
- Use consistent UI patterns throughout the application
- Maintain uniform spacing, colors, and typography
- Apply design system components consistently
- Keep naming conventions predictable

#### **Visual Hierarchy**
- Most important elements should be most prominent
- Use size, color, and position to establish importance
- Group related items together
- Create clear content flow (F-pattern or Z-pattern)

#### **Clarity and Simplicity**
- Remove unnecessary elements (progressive disclosure)
- One primary action per screen
- Clear, concise labels and messaging
- Minimize cognitive load

#### **White Space**
- Use generous padding and margins
- Don't fill every pixel
- White space improves readability by 20%
- Recommended: 8px grid system (8, 16, 24, 32, 40, 48, 64...)

---

## 2. Typography

### Font Selection

**Primary Font:** Choose 1-2 professional fonts
- **Sans-serif** for UI (Inter, DM Sans, Roboto, Open Sans)
- **Serif** for content-heavy sites (Georgia, Merriweather)
- **Monospace** for code (Fira Code, JetBrains Mono)

### Font Size Standards

```css
/* Minimum sizes */
Body text:       16px (1rem)      /* Never go below 14px */
Small text:      14px (0.875rem)
Large text:      18px (1.125rem)
H1:              2.5rem - 3rem    (40-48px)
H2:              2rem - 2.25rem   (32-36px)
H3:              1.5rem - 1.75rem (24-28px)
H4:              1.25rem - 1.5rem (20-24px)
H5:              1.125rem         (18px)
H6:              1rem             (16px)
```

### Line Height

```css
Headings:        1.2 - 1.3
Body text:       1.5 - 1.6
Small text:      1.4
```

### Text Width

- **Optimal:** 50-75 characters per line (CPL)
- **Maximum:** 85 CPL for comfortable reading
- Use `max-width: 65ch` for long-form content

### Font Weight

```css
Light:    300  /* Rarely use */
Regular:  400  /* Body text */
Medium:   500  /* Emphasis, buttons */
Semibold: 600  /* Subheadings */
Bold:     700  /* Headings, strong emphasis */
```

---

## 3. Color & Contrast

### WCAG Contrast Requirements

| Text Type | Level AA | Level AAA |
|-----------|----------|-----------|
| **Normal text** (< 18px) | 4.5:1 | 7:1 |
| **Large text** (≥ 18px or 14px bold) | 3:1 | 4.5:1 |
| **UI Components** | 3:1 | - |

### Color Palette Structure

```javascript
// Recommended color system
{
  // Primary (brand color)
  primary: {
    50:  '#lightest',
    100: '#lighter',
    // ... through ...
    900: '#darkest',
    DEFAULT: '#500' // main brand color
  },
  
  // Semantic colors
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  error:   '#ef4444', // red-500
  info:    '#3b82f6', // blue-500
  
  // Neutral scale (gray)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    // ... through ...
    900: '#111827'
  }
}
```

### Color Usage Guidelines

- **Limit palette:** 3-5 primary colors maximum
- **60-30-10 rule:** 60% dominant, 30% secondary, 10% accent
- **Semantic meaning:** 
  - 🔴 Red = Danger, error, delete
  - 🟢 Green = Success, confirmation
  - 🟡 Yellow/Orange = Warning, caution
  - 🔵 Blue = Information, links
- **Don't rely on color alone:** Use icons, text, or patterns too

### Color Accessibility

```css
/* ✅ Good - sufficient contrast */
color: #1f2937; /* gray-800 */
background: #ffffff; /* white */
/* Contrast ratio: 13.6:1 */

/* ❌ Bad - insufficient contrast */
color: #9ca3af; /* gray-400 */
background: #ffffff; /* white */
/* Contrast ratio: 2.3:1 (fails WCAG) */
```

---

## 4. Layout & Spacing

### Grid System

**Use a 12-column grid:**
- Mobile: 4 columns
- Tablet: 8 columns
- Desktop: 12 columns

### Spacing Scale (8px system)

```css
spacing: {
  0:   0,      /* 0px */
  1:   0.25rem, /* 4px - tight spacing */
  2:   0.5rem,  /* 8px - base unit */
  3:   0.75rem, /* 12px */
  4:   1rem,    /* 16px - comfortable spacing */
  6:   1.5rem,  /* 24px - section spacing */
  8:   2rem,    /* 32px - large spacing */
  12:  3rem,    /* 48px - major sections */
  16:  4rem,    /* 64px - page sections */
}
```

### Container Widths

```css
sm:   640px   /* Mobile landscape */
md:   768px   /* Tablet */
lg:   1024px  /* Desktop */
xl:   1280px  /* Large desktop */
2xl:  1536px  /* Extra large */

/* Recommended max-width for content: 1280px - 1440px */
```

### Component Spacing

```css
/* Card padding */
padding: 1.5rem; /* 24px - standard */
padding: 2rem;   /* 32px - spacious */

/* Section margins */
margin-bottom: 3rem; /* 48px between sections */
margin-bottom: 4rem; /* 64px for major divisions */

/* Element gaps */
gap: 1rem;  /* 16px - between related items */
gap: 1.5rem; /* 24px - between sections */
```

---

## 5. Navigation Patterns

### Top Navigation (Header)

**Standards:**
- Height: 56-64px (mobile), 64-80px (desktop)
- Sticky/fixed for important actions
- Max 5-7 primary nav items
- Logo on left, actions on right (Western layouts)

```
[Logo]  [Nav Items]              [Search] [User] [Menu]
```

### Sidebar Navigation

**Standards:**
- Width: 240-280px (expanded), 64-80px (collapsed)
- Place on left (primary) or right (secondary)
- Active state clearly indicated
- Collapsible on mobile

### Breadcrumbs

```
Home > Category > Subcategory > Current Page
```

- Show user's location in hierarchy
- Each item is clickable (except current)
- Separate with `/` or `>` symbols
- Use on sites with 3+ levels of hierarchy

### Mobile Navigation

**Hamburger Menu:**
- Place in top-right or top-left
- Animated transition (300ms)
- Full-screen overlay or slide-in panel
- Include close button (X)

**Bottom Navigation:**
- 3-5 primary destinations
- Icons + labels recommended
- Active state clearly visible
- Height: 56px minimum

---

## 6. Interactive Elements

### Buttons

#### Size Standards

```css
/* Minimum touch target: 44x44px */
Small:     px-3 py-1.5  /* 32px height */
Medium:    px-4 py-2    /* 40px height - default */
Large:     px-6 py-3    /* 48px height */
X-Large:   px-8 py-4    /* 56px height */
```

#### Button Hierarchy

```
Primary:   [Solid background, high contrast]
Secondary: [Outlined, medium contrast]
Tertiary:  [Text only, low contrast]
Danger:    [Red, for destructive actions]
```

#### Button States

```css
Default:   opacity: 1
Hover:     background: darker 10-20%
Active:    background: darker 20-30%, scale: 0.98
Disabled:  opacity: 0.5, cursor: not-allowed
Loading:   spinner + "Loading..." text
```

### Links

```css
/* Standard link */
color: #3b82f6;        /* blue-500 */
text-decoration: underline;

/* Hover */
color: #2563eb;        /* blue-600 */

/* Visited */
color: #7c3aed;        /* purple-600 */

/* Focus */
outline: 2px solid currentColor;
outline-offset: 2px;
```

### Icons

- **Size:** 16px (small), 20px (medium), 24px (large)
- **Spacing:** 8px gap between icon and text
- **Alignment:** Vertically center with text
- **Color:** Match text color or slightly muted

### Hover Effects

```css
/* Smooth transitions */
transition: all 200ms ease-in-out;

/* Subtle scale */
transform: scale(1.05);

/* Elevation change */
box-shadow: 0 10px 25px rgba(0,0,0,0.15);

/* Color change */
background-color: /* 10-20% darker */
```

---

## 7. Forms & Input

### Input Field Standards

```css
/* Minimum height: 40px (44px for mobile) */
Height:   40px - 48px
Padding:  px-3 py-2 (12px horizontal, 8px vertical)
Border:   1px solid #d1d5db (gray-300)
Radius:   4px - 8px
Font:     16px (prevents iOS zoom on focus)
```

### Input States

```css
Default:   border: #d1d5db, background: white
Focus:     border: primary color, ring: 2-4px shadow
Error:     border: red, background: red-50
Success:   border: green, background: green-50
Disabled:  background: gray-100, opacity: 0.6
```

### Label Guidelines

- **Position:** Above input (preferred) or floating
- **Font size:** 14px (0.875rem)
- **Font weight:** 500 (medium)
- **Color:** #374151 (gray-700)
- **Required indicator:** Red asterisk (*) or "(required)"

### Form Layout

```
[Label] *                    ← Required indicator
[Input field]                ← Main input
[Helper text]                ← Optional guidance
[Error message]              ← Validation feedback

Gap between fields: 16-24px
```

### Validation

**Real-time validation:**
- ✅ On blur (when user leaves field)
- ✅ On submit
- ❌ NOT on every keystroke (annoying)

**Error messages:**
```
❌ "Invalid input"           (Bad - not helpful)
✅ "Email must include @"    (Good - specific)
✅ "Password must be 8+ characters" (Good - actionable)
```

### Form Controls

**Checkboxes:**
- Size: 16-20px
- Rounded: 2-4px
- Gap from label: 8px

**Radio buttons:**
- Size: 16-20px
- Fully rounded (circle)
- Gap from label: 8px

**Toggles/Switches:**
- Width: 44px, Height: 24px
- Clear ON/OFF states
- Animated transition

**Dropdowns/Selects:**
- Same height as inputs (40-48px)
- Chevron icon on right
- Max height for dropdown: 300px (scrollable)

---

## 8. Feedback & Status

### Toast Notifications

**Position:** Top-right or top-center
**Duration:**
- Success: 3-4 seconds
- Info: 4-5 seconds
- Warning: 5-6 seconds
- Error: 7-8 seconds (or persist until dismissed)

**Components:**
```
[Icon] [Message text]                [X]
       [Optional description]
       [Optional action button]
```

### Alert Banners

```css
/* Full-width, at top of content */
padding: 12px 16px;
border-left: 4px solid [semantic color];
background: [semantic color]-50;
```

### Status Badges

```css
/* Small, inline indicators */
Size:     px-2 py-1 (20-24px height)
Radius:   rounded-full or rounded-md
Font:     12px, font-weight: 500
```

Examples:
- 🟢 Active / Success / Approved
- 🟡 Pending / Warning / In Progress
- 🔴 Inactive / Error / Rejected
- 🔵 Info / New

### Progress Indicators

**Linear Progress Bar:**
```
[████████░░░░░░░░] 60%
```
- Height: 4-8px
- Show percentage if applicable
- Smooth animation

**Circular Progress:**
- Size: 40-48px (standard)
- Stroke width: 3-4px
- Indeterminate or determinate

**Skeleton Screens:**
- Use while loading content
- Match layout of actual content
- Subtle shimmer animation

---

## 9. Responsive Design

### Breakpoint Standards

```css
/* Mobile First Approach */
/* Base styles: 320px+ */

sm:  640px   /* @media (min-width: 640px) */
md:  768px   /* @media (min-width: 768px) */
lg:  1024px  /* @media (min-width: 1024px) */
xl:  1280px  /* @media (min-width: 1280px) */
2xl: 1536px  /* @media (min-width: 1536px) */
```

### Mobile Considerations

**Touch Targets:**
- Minimum: 44x44px (iOS), 48x48px (Android)
- Spacing between: 8px minimum

**Font Scaling:**
```css
/* Mobile: 14-16px base */
html { font-size: 16px; }

/* Desktop: 16-18px base */
@media (min-width: 1024px) {
  html { font-size: 18px; }
}
```

**Navigation:**
- Mobile: Hamburger menu or bottom navigation
- Tablet: Collapsed sidebar or tabs
- Desktop: Full sidebar or horizontal nav

### Content Reflow

**Single Column → Multi Column:**
```css
/* Mobile: Stack vertically */
display: flex;
flex-direction: column;

/* Desktop: Side by side */
@media (min-width: 768px) {
  flex-direction: row;
  gap: 2rem;
}
```

**Hide/Show Elements:**
```css
/* Hide on mobile */
.desktop-only { display: none; }
@media (min-width: 768px) {
  .desktop-only { display: block; }
}

/* Hide on desktop */
.mobile-only { display: block; }
@media (min-width: 768px) {
  .mobile-only { display: none; }
}
```

---

## 10. Accessibility (WCAG)

### WCAG 2.1 Compliance Levels

- **Level A:** Minimum (basic accessibility)
- **Level AA:** Recommended standard (most sites)
- **Level AAA:** Enhanced (government, critical services)

### Keyboard Navigation

**Tab Order:**
- Logical sequence (top to bottom, left to right)
- Skip links for main content
- All interactive elements must be keyboard accessible

**Keyboard Shortcuts:**
```
Tab:         Next element
Shift + Tab: Previous element
Enter:       Activate button/link
Space:       Activate button, toggle checkbox
Esc:         Close modal/dropdown
Arrow keys:  Navigate lists, menus
```

**Focus Indicators:**
```css
/* NEVER remove outlines without replacement */
*:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Or use box-shadow */
*:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

### Screen Reader Support

**Semantic HTML:**
```html
✅ Use: <header>, <nav>, <main>, <aside>, <footer>
✅ Use: <button> for buttons, <a> for links
❌ Avoid: <div onclick="...">
```

**ARIA Labels:**
```html
<!-- Icon-only buttons -->
<button aria-label="Close dialog">
  <XIcon />
</button>

<!-- Images -->
<img src="chart.png" alt="Sales increased 24% in Q4">

<!-- Form labels -->
<label for="email">Email Address</label>
<input id="email" type="email" aria-required="true">
```

**ARIA Live Regions:**
```html
<!-- Announce dynamic changes -->
<div aria-live="polite" aria-atomic="true">
  Item added to cart
</div>

<!-- Urgent announcements -->
<div aria-live="assertive">
  Error: Form submission failed
</div>
```

### Color Blindness

- ✅ Don't rely on color alone
- ✅ Use patterns, icons, or text labels
- ✅ Test with color blindness simulators
- ✅ Red-green is most common (8% of men)

### Animation & Motion

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Performance

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5-4s | > 4s |
| **FID** (First Input Delay) | ≤ 100ms | 100-300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1-0.25 | > 0.25 |

### Loading Performance

**Target Metrics:**
```
First Paint:              < 1s
Time to Interactive:      < 3s
Total Page Load:          < 5s
```

**Optimization Techniques:**
- ✅ Lazy load images and components
- ✅ Code splitting (dynamic imports)
- ✅ Minify CSS/JS
- ✅ Compress images (WebP, AVIF)
- ✅ Use CDN for static assets
- ✅ Enable browser caching
- ✅ Prefetch critical resources

### Image Optimization

```html
<!-- Responsive images -->
<img 
  src="image.jpg" 
  srcset="image-320w.jpg 320w,
          image-640w.jpg 640w,
          image-1280w.jpg 1280w"
  sizes="(max-width: 640px) 100vw, 
         (max-width: 1024px) 50vw, 
         33vw"
  alt="Description"
  loading="lazy"
  decoding="async"
>
```

**Image formats:**
- **WebP:** 30% smaller than JPEG
- **AVIF:** 50% smaller than JPEG (newer)
- **SVG:** Vector graphics, logos, icons
- **JPEG:** Photos (quality: 75-85%)
- **PNG:** Transparency needed

### Bundle Size

```
JavaScript bundle:  < 200KB (gzipped)
CSS bundle:         < 50KB (gzipped)
Total page size:    < 1MB initial load
```

---

## 12. Content Strategy

### Writing for the Web

**Principles:**
- **Scan-friendly:** Users scan, don't read
- **Concise:** 50% less text than print
- **Actionable:** Start with verbs
- **Clear:** Avoid jargon and complexity

### Heading Structure

```html
<h1>Page Title</h1>              <!-- One per page -->
  <h2>Main Section</h2>           <!-- Multiple allowed -->
    <h3>Subsection</h3>
      <h4>Detail Point</h4>
      
<!-- ❌ Don't skip levels (h1 → h3) -->
<!-- ✅ Maintain hierarchy -->
```

### Microcopy

**Button Text:**
```
❌ "Submit"          → ✅ "Create Account"
❌ "Click here"      → ✅ "Download Report"
❌ "OK"              → ✅ "Got it" or "Continue"
```

**Empty States:**
```
❌ "No data"
✅ "No reports yet. Create your first report to get started."
```

**Error Messages:**
```
❌ "Error 500"
✅ "Something went wrong. Please try again or contact support."
```

### Content Hierarchy

**F-Pattern:** Users scan in F-shape
```
████████████          ← Most important
████████              ← Second most important
█
███████               ← Third most important
████
█
```

**Z-Pattern:** For simple layouts
```
████████████████      ← Start
              ↓
         ↓
    ↓
████████████████      ← End (CTA)
```

---

## 13. Error Handling

### Error Message Principles

1. **Be human:** Use conversational language
2. **Be specific:** Explain what happened
3. **Be helpful:** Suggest how to fix it
4. **Be apologetic:** Take responsibility

### Error Types & Responses

**Validation Errors:**
```
❌ "Invalid email"
✅ "Please enter a valid email address (example@domain.com)"
```

**Network Errors:**
```
❌ "Error 503"
✅ "We're having trouble connecting. Please check your internet and try again."
```

**Permission Errors:**
```
❌ "Access denied"
✅ "You don't have permission to view this page. Contact your administrator for access."
```

**404 Errors:**
```
❌ "Page not found"
✅ "We can't find that page. It may have moved or been deleted."
   [Go to Homepage] [Contact Support]
```

### Error Prevention

- ✅ Disable submit until form is valid
- ✅ Confirm destructive actions
- ✅ Provide undo functionality
- ✅ Auto-save drafts
- ✅ Show character counts
- ✅ Disable double-clicks

---

## 14. Loading States

### Skeleton Screens

```
[████████░░░░░░░░]     ← Title
[████░░░░]             ← Date
[██████████████░░]     ← Description
[████████████░░░░]
```

**Benefits:**
- Reduces perceived wait time
- Shows content structure
- Better than blank screen or spinner

### Loading Spinners

**When to use:**
- Indeterminate progress (unknown duration)
- Small operations (< 10 seconds)
- Inline actions (button loading)

```html
<!-- Button with spinner -->
<button disabled>
  <Spinner /> Loading...
</button>
```

### Progress Bars

**When to use:**
- Determinate progress (known duration)
- File uploads/downloads
- Multi-step processes

```html
<div class="progress-bar">
  <div class="progress-fill" style="width: 60%"></div>
</div>
<p>Uploading... 60% complete</p>
```

### Optimistic UI

```javascript
// Show result immediately, rollback if fails
const addComment = async (text) => {
  // 1. Add to UI immediately
  const tempId = Date.now();
  addCommentToUI({ id: tempId, text });
  
  try {
    // 2. Send to server
    const response = await api.post('/comments', { text });
    updateCommentInUI(tempId, response.id);
  } catch (error) {
    // 3. Rollback on error
    removeCommentFromUI(tempId);
    showError('Failed to add comment');
  }
};
```

---

## 15. Security UX

### Password Fields

**Requirements Display:**
```
✓ At least 8 characters
✓ Contains uppercase letter
✓ Contains number
✗ Contains special character
```

**Show/Hide Toggle:**
```html
<input type="password" id="password">
<button type="button" aria-label="Show password">
  👁️
</button>
```

**Strength Meter:**
```
[████░░░░] Weak
[████████] Strong
```

### Authentication

**Login Form:**
- Email/username field
- Password field with show/hide
- "Remember me" checkbox (optional)
- "Forgot password?" link
- Clear error messages
- Don't reveal which field is wrong (security)

**Two-Factor Authentication:**
- Clear instructions
- Code input (6 digits typically)
- Resend code option
- "Trust this device" option

### Session Management

**Timeout Warning:**
```
⚠️ Your session will expire in 2 minutes.
[Stay logged in] [Log out]
```

**Auto-save:**
- Save drafts automatically
- Notify user when saved
- Restore on return

---

## Implementation Checklist

### Visual Design
- [ ] Consistent design system in place
- [ ] Color palette follows accessibility guidelines
- [ ] Typography scales established
- [ ] Spacing system implemented (8px grid)
- [ ] Component library created

### Interaction
- [ ] All interactive elements have hover/focus/active states
- [ ] Touch targets minimum 44x44px
- [ ] Smooth transitions (200-300ms)
- [ ] Loading states for all async operations
- [ ] Error handling for all user actions

### Accessibility
- [ ] WCAG 2.1 Level AA compliant
- [ ] Keyboard navigation works throughout
- [ ] Screen reader tested
- [ ] Color contrast ratios meet standards
- [ ] Focus indicators visible
- [ ] ARIA labels where needed

### Responsiveness
- [ ] Mobile-first approach
- [ ] Tested on 320px to 1920px+
- [ ] Touch-friendly on mobile/tablet
- [ ] Content reflows properly
- [ ] Images responsive and optimized

### Performance
- [ ] Core Web Vitals in "Good" range
- [ ] Images optimized and lazy-loaded
- [ ] Code split and tree-shaken
- [ ] Bundle size < 200KB gzipped
- [ ] Caching strategy implemented

### Content
- [ ] Clear, concise copy
- [ ] Helpful error messages
- [ ] Proper heading hierarchy
- [ ] Alt text for all images
- [ ] Empty states designed

---

## Tools & Resources

### Design Tools
- **Figma:** UI/UX design and prototyping
- **Adobe XD:** Design and collaboration
- **Sketch:** macOS design tool

### Accessibility Testing
- **WAVE:** Web accessibility evaluation tool
- **axe DevTools:** Browser extension
- **Lighthouse:** Chrome DevTools audit
- **NVDA/JAWS:** Screen readers

### Performance Testing
- **Google PageSpeed Insights**
- **WebPageTest**
- **Chrome DevTools Performance tab**

### Color Tools
- **Coolors:** Color palette generator
- **WebAIM Contrast Checker**
- **ColorBox:** Color scale generator

### Typography
- **Google Fonts**
- **Fontjoy:** Font pairing
- **Type Scale:** Typography calculator

---

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design 3](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Nielsen Norman Group](https://www.nngroup.com/)
- [Web.dev Best Practices](https://web.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## Version History

- **v1.0** - October 20, 2025 - Initial comprehensive guide
- Last reviewed: October 20, 2025

---

> **Note:** These standards should be adapted to your specific project needs and user base. Always conduct user testing to validate design decisions.

