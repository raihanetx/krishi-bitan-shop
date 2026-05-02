/**
 * Test Connection API
 * Tests Cloudinary and Courier API connections
 * Protected: Admin only - reads credentials from env vars
 */
import { log, logError } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { steadfastService } from '@/lib/steadfast'
import { v2 as cloudinary } from 'cloudinary'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authentication required - this endpoint can reveal credential validity
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const { type } = await request.json()

    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      log('[TEST-CONNECTION] Testing:', type)
    }

    if (type === 'cloudinary') {
      return await testCloudinary()
    } else if (type === 'courier') {
      return await testCourier()
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid test type'
    })
  } catch (error) {
    logError('Test connection error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    })
  }
}

async function testCloudinary() {
  try {
    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        message: 'Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.'
      })
    }

    // Configure Cloudinary SDK
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })

    // Test using Cloudinary SDK - get account usage
    const usageResult = await cloudinary.api.usage()

    if (process.env.NODE_ENV === 'development') {
      log('[TEST-CLOUDINARY] Success! Resources:', usageResult.resources, 'Bandwidth:', usageResult.bandwidth?.used || 0)
    }

    // Format bandwidth to human readable
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const bandwidthUsed = usageResult.bandwidth?.used || 0
    const bandwidthLimit = usageResult.bandwidth?.limit || 0
    const resourcesCount = usageResult.resources || 0
    const storageUsed = usageResult.storage?.used || 0

    return NextResponse.json({
      success: true,
      message: `Cloudinary connected!`,
      details: {
        resources: resourcesCount,
        bandwidth: {
          used: bandwidthUsed,
          limit: bandwidthLimit,
          usedFormatted: formatBytes(bandwidthUsed),
          limitFormatted: bandwidthLimit > 0 ? formatBytes(bandwidthLimit) : 'unlimited'
        },
        storage: {
          used: storageUsed,
          usedFormatted: formatBytes(storageUsed)
        }
      }
    })
  } catch (error: any) {
    logError('[TEST-CLOUDINARY] Error:', error?.message || error)
    
    // Handle specific Cloudinary errors
    if (error?.http_code === 401 || error?.message?.includes('Invalid')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Cloudinary credentials. Please check your API Key and Secret.'
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Connection failed. Please check your credentials and network.'
    })
  }
}

async function testCourier() {
  try {
    // Use the existing steadfastService which handles decryption and correct API format
    const result = await steadfastService.verifyCredentials()
    
    if (process.env.NODE_ENV === 'development') {
      log('[TEST-COURIER] Verification result:', result)
    }
    
    if (result.valid) {
      return NextResponse.json({
        success: true,
        message: result.balance 
          ? `Steadfast connected! Balance: ৳${result.balance}`
          : result.message
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      })
    }
  } catch (error) {
    logError('Courier test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to Steadfast API. Please check your network connection.'
    })
  }
}
