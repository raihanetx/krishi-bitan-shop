import { CartItem } from '@/types'

// Products for Shop page — populated from database, not hardcoded
export const shopProducts: CartItem[] = []

// Hero carousel images — populated from database settings
export const heroImages: string[] = []

// Categories for shop — populated from database
export const shopCategories: { icon: string; name: string }[] = []

// Related products — populated from database
export const relatedProducts: CartItem[] = []

// Logo URL — set via Admin → Settings
export const logoUrl = ''

// Settings — set via Admin → Settings
export const settings = {
  slogan: '',
}
