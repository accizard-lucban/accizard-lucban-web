When creating or modifying components, use these exact color classes:

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

### Text Sizes
- **Page titles**: `text-2xl font-bold`
- **Section headers**: `text-lg font-semibold`
- **Card titles**: `text-base font-semibold`
- **Form labels**: `text-sm font-medium`
- **Body text**: `text-sm`
- **Small text**: `text-xs`
- **Large numbers/stats**: `text-xl font-bold`

### Backgrounds
- **Page background**: `bg-gray-50`
- **Card background**: `bg-white`
- **Surface**: `bg-gray-100`

### Sidebar Colors
- **Background**: `bg-gradient-to-b from-brand-orange to-brand-red`
- **Hover**: `hover:bg-brand-orange-400/20`
- **Border**: `border-brand-orange-400/30`


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

### Text Sizes
```tsx
<h1 className="text-2xl font-bold text-gray-800">Page Title</h1>
<h2 className="text-lg font-semibold text-gray-800">Section Header</h2>
<h3 className="text-base font-semibold text-gray-800">Card Title</h3>
<label className="text-sm font-medium text-gray-800">Form Label</label>
<p className="text-sm text-gray-600">Body text</p>
<span className="text-xs text-gray-400">Small text</span>
```