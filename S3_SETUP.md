# S3 Photo Portfolio Setup Guide

> **Note**: This portfolio now uses **Supabase** for photo metadata storage and **S3** for image hosting. This guide covers S3 setup for images only. Photo metadata is managed via Supabase.

This photo portfolio uses Amazon S3 for image storage, providing better performance, scalability, and professional image hosting.

## Prerequisites

1. **AWS Account**: You need an AWS account with S3 access
2. **S3 Bucket**: Create an S3 bucket for your photos
3. **AWS Credentials**: Access keys for programmatic access

## Setup Steps

### 1. Create AWS S3 Bucket

1. Log into AWS Console
2. Navigate to S3 service
3. Create a new bucket (e.g., `your-photo-portfolio-bucket`)
4. Configure bucket settings:
   - **Block Public Access**: Disable for public photo access
   - **Bucket Versioning**: Enable (optional)
   - **Server-side encryption**: Enable (recommended)

### 2. Set Bucket Policy for Public Read Access

Add this bucket policy to allow public read access to your photos:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-photo-portfolio-bucket/*"
        }
    ]
}
```

### 3. Create IAM User for Photo Management

1. Go to IAM service in AWS Console
2. Create new user (e.g., `photo-portfolio-user`)
3. Attach this policy for S3 access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-photo-portfolio-bucket",
                "arn:aws:s3:::your-photo-portfolio-bucket/*"
            ]
        }
    ]
}
```

4. Create access keys for this user

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your AWS credentials in `.env`:
   ```env
   VITE_AWS_REGION=us-east-1
   VITE_AWS_ACCESS_KEY_ID=your-access-key-id
   VITE_AWS_SECRET_ACCESS_KEY=your-secret-access-key
   VITE_S3_BUCKET_NAME=your-photo-portfolio-bucket
   
   # Optional: CloudFront domain for better performance
   VITE_CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
   ```

### 5. Upload Your Photos

1. Create uploads folder:
   ```bash
   npm run setup-uploads
   ```

2. Add your photos to `scripts/uploads/` folder

3. Upload to S3:
   ```bash
   npm run upload-photos
   ```

   Photos are automatically added to your Supabase database during upload.

4. Edit photo metadata in the Supabase dashboard or using SQL queries

### 6. (Optional) Set up CloudFront CDN

For better performance, set up CloudFront:

1. Create CloudFront distribution
2. Set S3 bucket as origin
3. Configure caching and image optimization
4. Add the CloudFront domain to your `.env` file

## Photo Management Workflow

### Adding New Photos

1. **Prepare Photos**: 
   - Resize/optimize images (recommended: max 2000px width for web)
   - Use descriptive filenames

2. **Upload Process**:
   ```bash
   # Add photos to uploads folder
   cp /path/to/your/photos/* scripts/uploads/
   
   # Upload to S3 and save metadata to Supabase
   npm run upload-photos
   ```

3. **Update Metadata**:
   - Log into your Supabase dashboard
   - Go to Table Editor → `photos`
   - Edit titles, descriptions, categories, and technical details
   - Mark featured photos by setting `featured = true`

4. **Deploy**:
   ```bash
   npm run build
   # Deploy your built site
   ```
 Photo Metadata Management

Photo metadata is stored in **Supabase**, not in JSON files. 

### Supabase Tables:

**`photos` table**
Each photo in `photoDatabase.json` has this structure:

```json
{
  "id": "unique-photo-id",
  "title": "Photo Title",
  "description": "Detailed description",
  "s3Key": "gallery/category/photo-filename.jpg",
  "category": "portrait|landscape|street|nature|architecture|other",
  "date": "2024-03-15",
  "featured": true,
  "tags": ["tag1", "tag2"],
  "location": "Location Name",
  "camera": "Camera Model",
  "lens": "Lens Model",
  "settings": {
    "aperture": "f/2.8",
    "shutter": "1/250s",
    "iso": 400,
    "focalLength": "85mm"
  },
  "dimensions": {
    "width": 3000,
    "height": 4000
  }
}
```

## Benefits of S3 Integration

- **Performance**: Fast image loading with CDN support
- **Scalability**: Handle unlimited photos without server storage limits  
- **Professional**: Proper image hosting infrastructure
- **Optimization**: Automatic image resizing and optimization options
- **Backup**: Built-in redundancy and versioning
- **SEO**: Better loading times improve search rankings

## Costs

- **S3 Storage**: ~$0.023 per GB per month
- **Data Transfer**: First 1GB free per month, then ~$0.09 per GB
- **CloudFront**: Free tier includes 1TB transfer per month

For a typical photo portfolio with 100 high-quality photos (~2GB), expect costs under $5/month.

## Security Notes

- Never commit `.env` file to version control
- Use IAM roles with minimal required permissions  
- Enable S3 bucket logging for security monitoring
- Consider using AWS Secrets Manager for production deployments