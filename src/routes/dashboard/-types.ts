export interface SocialAccountOption {
  id: string
  label: string
}

export interface SocialAccounts {
  x: SocialAccountOption[]
  instagram: SocialAccountOption[]
}

export type SocialPostResults = Record<string, { success: boolean; error?: string; postUrl?: string }>

export interface UploadForm {
  title: string
  description: string
  category: string
  collection: string
  location: string
  camera: string
  lens: string
}

export interface EditPhotoForm {
  title: string
  category: string
  camera: string
  collection: string
}

export interface ContactForm {
  email: string
  phone: string
  location: string
  twitter_handle: string
  twitter_url: string
  instagram_handle: string
  instagram_url: string
  heading: string
  subheading: string
}

export interface AboutForm {
  site_name: string
  hero_title: string
  hero_subtitle: string
  featured_title: string
  featured_subtitle: string
  about_title: string
  about_bio: string
}
