# Image Management

This directory contains all images for the photo portfolio.

## Structure
- `gallery/` - Full-size images for the gallery
- `gallery/thumbnails/` - Optimized thumbnails (recommended: 400x400px)
- `hero/` - Hero/banner images
- `about/` - Images for the about page

## Image Guidelines
- **Full-size images**: Max 2000px on longest side, optimized for web
- **Thumbnails**: 400x400px, JPEG quality 85%
- **Supported formats**: JPG, PNG, WebP
- **Naming convention**: Use descriptive names with no spaces (use hyphens or underscores)

## Adding New Images
1. Add full-size image to `gallery/`
2. Create thumbnail and add to `gallery/thumbnails/`
3. Update the image database in `src/data/imageDatabase.json`