When creating or modifying components, use these exact color classes:

### Primary Actions
- **Main buttons**: `bg-brand-red hover:bg-brand-red-700 text-white`
- **Focus states**: `focus:ring-brand-red focus:border-brand-red`
- **Active states**: `bg-brand-red text-white`

### Secondary Actions  
- **Secondary buttons**: `bg-gray-100 hover:bg-gray-200 text-gray-800`
- **Outline buttons**: `border-gray-300 text-gray-800 hover:bg-gray-50`

### Status Indicators
- **Fire/Emergency**: `bg-red-100 text-red-800`
- **Flooding/Water**: `bg-blue-100 text-blue-800`
- **Success**: `bg-green-100 text-green-800`
- **Warning**: `bg-yellow-100 text-yellow-800`
- **General**: `bg-gray-100 text-gray-800`

### Text Colors
- **Primary text**: `text-gray-800`
- **Secondary text**: `text-gray-600`
- **Muted text**: `text-gray-400`
- **Brand text**: `text-brand-red`

### Backgrounds
- **Page background**: `bg-gray-50`
- **Card background**: `bg-white`
- **Surface**: `bg-gray-100`

### Sidebar Colors
- **Background**: `bg-gradient-to-b from-brand-orange to-brand-red`
- **Hover**: `hover:bg-brand-orange-400/20`
- **Border**: `border-brand-orange-400/30`

## Common Patterns

### Form Inputs
```tsx
<Input className="border-gray-300 focus:ring-brand-red focus:border-brand-red" />
```

### Primary Buttons
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

## Avoid These Colors
- Don't use random colors like `purple-500`, `indigo-600`, etc.
- Stick to the defined brand palette
- Use semantic colors only for their intended purposes
