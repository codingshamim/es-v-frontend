# Featured Products Slider - Implementation Guide

## Overview
This is a production-grade featured products slider that:
- Fetches products from MongoDB where `isFeatured: true`
- Creates a modern slider without external libraries
- Includes auto-play, manual navigation, and responsive design
- Has proper error handling and loading states
- Follows accessibility best practices

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in your frontend directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
```

### 2. Database Records
Make sure you have products in MongoDB with `isFeatured: true`:
```javascript
db.products.updateOne(
  { _id: ObjectId("...") },
  { $set: { isFeatured: true, status: "Active" } }
)
```

### 3. File Structure
```
frontend/
├── app/
│   └── api/
│       └── products/
│           └── featured/
│               └── route.ts         (API endpoint)
├── lib/
│   ├── db/
│   │   └── connect.ts              (MongoDB connection)
│   └── models/
│       └── Product.ts              (Mongoose schema)
├── components/
│   ├── ui/
│   │   └── ProductSlider.tsx        (Slider component)
│   └── sections/
│       └── FeaturedProducts.tsx     (Main section)
└── .env.local                       (Environment variables)
```

## Components

### ProductSlider.tsx
**Props:**
- `products` (SlideProduct[]) - Array of featured products

**Features:**
- Auto-play every 5 seconds (pauses on hover)
- Previous/Next buttons for manual navigation
- Thumbnail strip for quick selection
- Dot indicators for slide progress
- Smooth transitions (500ms)
- Fully responsive design

**Example Usage:**
```tsx
import { ProductSlider } from '@/components/ui/ProductSlider';

<ProductSlider products={featuredProducts} />
```

### FeaturedProducts.tsx
**Features:**
- Fetches products from `/api/products/featured`
- Loading spinner during fetch
- Error message display
- Empty state handling
- Re-fetch on component mount

## API Endpoint: `/api/products/featured`

**Method:** GET

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Product Name",
      "slug": "product-slug",
      "pricing": {
        "regularPrice": 1000,
        "salePrice": 800,
        "discount": 20,
        "currency": "BDT"
      },
      "images": {
        "main": "https://example.com/image.jpg",
        "gallery": []
      },
      "colors": [...],
      "ratings": {
        "average": 4.5,
        "count": 120
      },
      "soldCount": 45
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to fetch featured products"
}
```

## Slider Features

### Auto-Play
- Automatically advances to next slide every 5 seconds
- Pauses when user hovers over slider
- Stops auto-play when user manually navigates

### Navigation
1. **Previous/Next Buttons**
   - Visible when multiple products exist
   - Disabled during transition animation

2. **Thumbnail Strip**
   - Shows all product images below slider
   - Click to jump to any product
   - Selected thumbnail has teal border and scale effect

3. **Dot Indicators**
   - Animated dots showing current slide
   - Click to navigate to specific slide
   - Slide counter (e.g., "1 / 8")

### Responsive Design
- Mobile: Single column layout
- Tablet: Optimized spacing
- Desktop: Full width with maximum container

### Accessibility
- Semantic HTML structure
- ARIA labels for buttons and navigation
- Keyboard navigation support
- Proper color contrast ratios

## Styling

The slider uses Tailwind CSS with:
- Dark mode support
- Accent color: `accent-teal`
- Smooth transitions and animations
- Gradient overlay for text readability

### Customization

To customize timing or appearance:

**Slide Duration (Auto-play interval):**
```typescript
const SLIDE_INTERVAL = 5000; // 5 seconds
```

**Animation Duration:**
```typescript
const SLIDE_ANIMATION_DURATION = 500; // 0.5 seconds
```

**Image Quality:**
```typescript
quality={90} // Change in ProductSlider component
```

## Performance Optimizations

1. **Image Optimization**
   - Next.js Image component with lazy loading
   - Responsive image sizing with `sizes` prop
   - Quality set to 90 for balance

2. **Caching**
   - API response cached for 1 hour (with stale-while-revalidate)
   - Database query uses `.lean()` for read-only data

3. **State Management**
   - Minimal re-renders with `useCallback`
   - Auto-play controlled by state

4. **Bundle Size**
   - No external slider libraries
   - Lightweight CSS-in-JS solution

## Testing

### Test Featured Products Display
```javascript
// Add isFeatured: true to test products
const testProduct = {
  name: "Test Product",
  isFeatured: true,
  status: "Active",
  // ... other fields
};
```

### Test Error Handling
- Disconnect MongoDB to see error state
- Check console for error logs

### Test Loading States
- Open DevTools Network tab
- Slow down connection to see spinner

## Troubleshooting

### "Failed to fetch featured products"
- Check MONGODB_URI in `.env.local`
- Ensure MongoDB connection is active
- Verify database has products with `isFeatured: true`

### Images not loading
- Check image URLs are accessible
- Verify Next.js Image domains in `next.config.ts`
- Check image quality and sizing parameters

### Slider not auto-playing
- Check `SLIDE_INTERVAL` constant
- Verify `isAutoPlay` state in DevTools
- Check if slider is being hovered

## Production Checklist

- [ ] Set `MONGODB_URI` in `.env.local`
- [ ] Verify featured products exist in database
- [ ] Test slider on mobile devices
- [ ] Check image load performance
- [ ] Verify error handling
- [ ] Test accessibility with screen readers
- [ ] Monitor API response times
- [ ] Set up error logging/monitoring

## Browser Support

- Chrome/Edge: Latest
- Firefox: Latest
- Safari: Latest
- Mobile browsers: iOS Safari, Chrome Mobile

## License

Part of ES-Vibes e-commerce platform
