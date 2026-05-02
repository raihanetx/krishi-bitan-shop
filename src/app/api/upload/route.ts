import { log, logError } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// Get Cloudinary config from environment variables only
function getCloudinaryConfig(): {
  cloud_name: string
  api_key: string
  api_secret: string
} | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  
  if (cloudName && apiKey && apiSecret) {
    return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret }
  }
  
  return null
}

// POST - Upload image to Cloudinary (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication required for uploads (prevent abuse)
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo', 'favicon', 'hero', 'product', 'category'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // Validate file size (max 10MB for Cloudinary)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Get Cloudinary config from env vars
    const config = getCloudinaryConfig()
    
    if (!config) {
      return NextResponse.json({ 
        error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.',
        needsConfig: true
      }, { status: 400 })
    }
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
    })

    // Convert file to base64 for upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    // Determine folder based on type
    const folder = `ecomart/${type || 'images'}`

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    })

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileName: uploadResult.public_id.split('/').pop(),
      width: uploadResult.width,
      height: uploadResult.height,
    })
  } catch (error: any) {
    logError('Error uploading image to Cloudinary:', error)
    
    // Provide more specific error message
    let errorMessage = 'Failed to upload image'
    if (error?.message?.includes('Invalid API Key')) {
      errorMessage = 'Invalid Cloudinary API Key. Please check your credentials.'
    } else if (error?.message?.includes('Invalid API Secret')) {
      errorMessage = 'Invalid Cloudinary API Secret. Please check your credentials.'
    } else if (error?.http_code === 401) {
      errorMessage = 'Cloudinary authentication failed. Please verify your credentials.'
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: 'Upload failed - check credentials' 
    }, { status: 500 })
  }
}

// DELETE - Delete image from Cloudinary (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Authentication required for deletes
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID required' }, { status: 400 })
    }

    // Get Cloudinary config from env vars
    const config = getCloudinaryConfig()
    
    if (!config) {
      return NextResponse.json({ error: 'Cloudinary not configured. Set CLOUDINARY_* env vars.' }, { status: 400 })
    }
    
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
    })

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      return NextResponse.json({ success: true, message: 'Image deleted' })
    } else {
      return NextResponse.json({ error: 'Failed to delete image', result }, { status: 400 })
    }
  } catch (error) {
    logError('Error deleting image from Cloudinary:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
