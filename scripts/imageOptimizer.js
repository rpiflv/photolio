import sharp from 'sharp'

/**
 * Image size configurations for different use cases
 */
export const IMAGE_SIZES = {
  thumbnail: {
    width: 400,
    height: 400,
    quality: 75,
    fit: 'cover' // Maintains aspect ratio and crops to fill
  },
  medium: {
    width: 1200,
    quality: 80,
    fit: 'inside' // Maintains aspect ratio, scales to fit
  },
  large: {
    width: 1920,
    quality: 85,
    fit: 'inside'
  },
  full: {
    width: 2400,
    quality: 85,
    fit: 'inside'
  }
}

/**
 * Optimize and resize an image buffer to multiple sizes
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} Object with buffers for each size
 */
export async function optimizeImage(imageBuffer, options = {}) {
  const {
    sizes = ['thumbnail', 'medium', 'large'],
    format = 'jpeg', // 'jpeg' or 'webp'
    includeOriginal = false
  } = options

  const results = {}
  const image = sharp(imageBuffer)

  // Get original metadata
  const metadata = await image.metadata()
  results.metadata = {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: imageBuffer.length
  }

  // Process each size
  for (const sizeName of sizes) {
    const config = IMAGE_SIZES[sizeName]
    if (!config) {
      console.warn(`Unknown size: ${sizeName}`)
      continue
    }

    let pipeline = sharp(imageBuffer)

    // Resize
    if (config.width && config.height) {
      // For thumbnails with specific dimensions
      pipeline = pipeline.resize(config.width, config.height, {
        fit: config.fit || 'cover',
        position: 'center'
      })
    } else if (config.width) {
      // For responsive sizes
      pipeline = pipeline.resize(config.width, null, {
        fit: config.fit || 'inside',
        withoutEnlargement: true
      })
    }

    // Convert to desired format with quality settings
    if (format === 'webp') {
      pipeline = pipeline.webp({ quality: config.quality })
    } else {
      pipeline = pipeline.jpeg({ 
        quality: config.quality,
        progressive: true,
        mozjpeg: true
      })
    }

    const buffer = await pipeline.toBuffer()
    
    results[sizeName] = {
      buffer,
      size: buffer.length,
      sizeKB: Math.round(buffer.length / 1024)
    }
  }

  // Include original if requested
  if (includeOriginal) {
    results.original = {
      buffer: imageBuffer,
      size: imageBuffer.length,
      sizeKB: Math.round(imageBuffer.length / 1024)
    }
  }

  return results
}

/**
 * Generate optimized image with different formats (JPEG and WebP)
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} sizeName - Size name from IMAGE_SIZES
 * @returns {Promise<Object>} Buffers for both JPEG and WebP
 */
export async function generateMultiFormat(imageBuffer, sizeName = 'medium') {
  const config = IMAGE_SIZES[sizeName]
  
  const pipeline = sharp(imageBuffer)
  
  // Apply resize
  let resized = pipeline
  if (config.width && config.height) {
    resized = resized.resize(config.width, config.height, {
      fit: config.fit || 'cover',
      position: 'center'
    })
  } else if (config.width) {
    resized = resized.resize(config.width, null, {
      fit: config.fit || 'inside',
      withoutEnlargement: true
    })
  }

  // Generate both formats
  const [jpegBuffer, webpBuffer] = await Promise.all([
    resized.clone().jpeg({ 
      quality: config.quality,
      progressive: true,
      mozjpeg: true
    }).toBuffer(),
    resized.clone().webp({ 
      quality: config.quality 
    }).toBuffer()
  ])

  return {
    jpeg: {
      buffer: jpegBuffer,
      size: jpegBuffer.length,
      sizeKB: Math.round(jpegBuffer.length / 1024)
    },
    webp: {
      buffer: webpBuffer,
      size: webpBuffer.length,
      sizeKB: Math.round(webpBuffer.length / 1024)
    }
  }
}

/**
 * Calculate optimal quality based on file size
 * Reduces quality until file is under target size
 */
export async function optimizeToTargetSize(imageBuffer, targetSizeKB = 150, maxWidth = 400) {
  let quality = 85
  let buffer = imageBuffer
  
  while (quality >= 60) {
    const optimized = await sharp(imageBuffer)
      .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, progressive: true, mozjpeg: true })
      .toBuffer()
    
    const sizeKB = optimized.length / 1024
    
    if (sizeKB <= targetSizeKB || quality <= 60) {
      return {
        buffer: optimized,
        quality,
        size: optimized.length,
        sizeKB: Math.round(sizeKB)
      }
    }
    
    quality -= 5
  }
  
  return {
    buffer,
    quality,
    size: buffer.length,
    sizeKB: Math.round(buffer.length / 1024)
  }
}
