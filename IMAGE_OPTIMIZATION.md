# Image Optimization Guide

This photo portfolio app now includes automatic image optimization to reduce S3 bandwidth and improve loading times.

## 🎯 Optimization Results

### Image Sizes
The system automatically generates 3 optimized versions of each photo:

| Size | Dimensions | Quality | Typical Size | Use Case |
|------|-----------|---------|--------------|----------|
| **Thumbnail** | 400x400px | 75% | 50-100 KB | Grid view |
| **Medium** | 1200px wide | 80% | 150-300 KB | Responsive loading |
| **Large** | 1920px wide | 85% | 200-500 KB | Full-size modal view |

**Bandwidth savings: ~80-90%** compared to loading full-resolution images everywhere.

## 📦 How It Works

### 1. Automatic Upload Optimization
When you upload new photos using `npm run upload-photos`, the system:
- Reads original images from `scripts/uploads/`
- Generates 3 optimized versions (thumbnail, medium, large)
- Uploads all versions to S3 with proper naming
- Stores metadata in Supabase database

### 2. Responsive Image Loading
The app uses modern responsive images techniques:
```html
<img 
  src="thumbnail.jpg"           <!-- Fallback -->
  srcset="medium.jpg 1200w,     <!-- Different sizes -->
          large.jpg 1920w,
          full.jpg 2400w"
  sizes="(max-width: 768px) 100vw, 1920px"  <!-- Browser picks best -->
  loading="lazy"                 <!-- Only loads when visible -->
/>
```

### 3. CloudFront Support (Optional)
To further optimize delivery:
1. Set up an AWS CloudFront distribution
2. Add `VITE_CLOUDFRONT_DOMAIN` to your `.env` file
3. The app will automatically use CloudFront URLs for faster global delivery

## 🚀 Usage

### Upload New Photos
```bash
# 1. Add images to uploads folder
# 2. Run upload script
npm run upload-photos
```

The script will:
- ✅ Generate 3 optimized sizes
- ✅ Upload to S3
- ✅ Save metadata to Supabase
- ✅ Clean up local files

### Optimize Existing Photos
If you have photos already uploaded, run:
```bash
npm run optimize-existing
```

This migration script:
- Downloads existing photos from S3
- Generates optimized versions
- Re-uploads with proper naming
- Updates database records

## 🔧 Configuration

### Environment Variables
```env
# Required
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret
VITE_S3_BUCKET_NAME=your-bucket

# Optional - for CDN
VITE_CLOUDFRONT_DOMAIN=d123456.cloudfront.net
```

### Customizing Image Sizes
Edit `scripts/imageOptimizer.js` to adjust:
- Dimensions (width/height)
- Quality (1-100)
- Fit mode (cover, inside, etc.)

```javascript
export const IMAGE_SIZES = {
  thumbnail: {
    width: 400,     // Change dimensions
    height: 400,
    quality: 75,    // Change quality
    fit: 'cover'
  },
  // ... more sizes
}
```

## 📊 Database Schema

The Supabase `photos` table includes:
- `s3_key` - Main/large image
- `thumbnail_s3_key` - Thumbnail version
- `medium_s3_key` - Medium version
- `dimensions` - Original width/height

## 🎨 File Naming Convention

For a file `sunset.jpg` in the `landscape` category:
```
gallery/landscape/sunset.jpg         (large - 1920px)
gallery/landscape/sunset-medium.jpg  (medium - 1200px)
gallery/landscape/sunset-thumb.jpg   (thumbnail - 400px)
```

## 🌐 CloudFront Setup (Optional)

1. Create CloudFront distribution in AWS Console
2. Set origin to your S3 bucket
3. Enable gzip/brotli compression
4. Add cache behaviors for images
5. Copy distribution domain to `.env`

Benefits:
- 🚀 Faster global delivery via CDN edge locations
- 💰 Reduced S3 bandwidth costs
- 🔒 Optional custom domain with SSL

## 💡 Tips

1. **Use WebP format** - Edit `imageOptimizer.js` to use WebP for even smaller files (~30% smaller)
2. **Lazy loading** - Already enabled! Images only load when visible
3. **Cache-Control** - Set to 1 year for optimal browser caching
4. **Monitor costs** - Use AWS Cost Explorer to track S3/CloudFront usage

## 🐛 Troubleshooting

**Images not loading?**
- Check S3 bucket permissions (public read access)
- Verify environment variables
- Check browser console for 403/404 errors

**Upload script fails?**
- Ensure Sharp is installed: `npm install --save-dev sharp`
- Check AWS credentials are valid
- Verify Supabase service key has write access

**Optimization too slow?**
- Reduce number of sizes in config
- Use lower quality settings
- Process in smaller batches
