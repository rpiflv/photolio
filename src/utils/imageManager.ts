import fs from 'fs/promises'
import path from 'path'

export interface ImageManagerOptions {
  imagesDir: string
  thumbnailsDir: string
  databasePath: string
}

export class ImageManager {
  private options: ImageManagerOptions

  constructor(options: ImageManagerOptions) {
    this.options = options
  }

  // Get all image files from the gallery directory
  async getImageFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.options.imagesDir)
      return files.filter(file => 
        /\.(jpg|jpeg|png|webp)$/i.test(file)
      )
    } catch (error) {
      console.error('Error reading images directory:', error)
      return []
    }
  }

  // Get all thumbnail files
  async getThumbnailFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.options.thumbnailsDir)
      return files.filter(file => 
        /\.(jpg|jpeg|png|webp)$/i.test(file)
      )
    } catch (error) {
      console.error('Error reading thumbnails directory:', error)
      return []
    }
  }

  // Check if an image has a corresponding thumbnail
  async hasMatchingThumbnail(imageFilename: string): Promise<boolean> {
    const thumbnails = await this.getThumbnailFiles()
    return thumbnails.includes(imageFilename)
  }

  // Get images that are missing thumbnails
  async getImagesWithoutThumbnails(): Promise<string[]> {
    const images = await this.getImageFiles()
    const thumbnails = await this.getThumbnailFiles()
    
    return images.filter(image => !thumbnails.includes(image))
  }

  // Load the image database
  async loadDatabase() {
    try {
      const data = await fs.readFile(this.options.databasePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error loading image database:', error)
      return { images: [], categories: [], metadata: {} }
    }
  }

  // Save the image database
  async saveDatabase(database: any) {
    try {
      await fs.writeFile(
        this.options.databasePath, 
        JSON.stringify(database, null, 2)
      )
    } catch (error) {
      console.error('Error saving image database:', error)
    }
  }

  // Generate a basic database entry for a new image
  generateImageEntry(filename: string, overrides: Partial<any> = {}) {
    const id = Date.now().toString()
    const nameWithoutExt = path.parse(filename).name
    const title = nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())

    return {
      id,
      filename,
      title,
      description: '',
      category: 'uncategorized',
      tags: [],
      date: new Date().toISOString().split('T')[0],
      featured: false,
      dimensions: { width: 0, height: 0 },
      ...overrides
    }
  }

  // Sync filesystem with database
  async syncDatabase() {
    const database = await this.loadDatabase()
    const imageFiles = await this.getImageFiles()
    
    // Find new images not in database
    const existingFilenames = database.images.map((img: any) => img.filename)
    const newImages = imageFiles.filter(file => !existingFilenames.includes(file))
    
    // Add new images to database
    for (const filename of newImages) {
      const entry = this.generateImageEntry(filename)
      database.images.push(entry)
    }

    // Update metadata
    database.metadata = {
      ...database.metadata,
      lastUpdated: new Date().toISOString(),
      totalImages: database.images.length
    }

    await this.saveDatabase(database)
    return database
  }
}

// Default instance
export const imageManager = new ImageManager({
  imagesDir: path.join(process.cwd(), 'public', 'images', 'gallery'),
  thumbnailsDir: path.join(process.cwd(), 'public', 'images', 'gallery', 'thumbnails'),
  databasePath: path.join(process.cwd(), 'src', 'data', 'imageDatabase.json')
})