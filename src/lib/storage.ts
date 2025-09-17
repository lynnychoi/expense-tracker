import { supabase } from './supabase'

export interface UploadResult {
  data?: {
    path: string
    publicUrl: string
  }
  error?: string
}

export async function uploadReceiptImage(
  file: File,
  userId: string,
  transactionId?: string
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { error: '이미지 파일만 업로드할 수 있습니다.' }
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return { error: '파일 크기는 5MB 이하여야 합니다.' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${transactionId || 'temp'}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { error: '파일 업로드에 실패했습니다.' }
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path)

    return {
      data: {
        path: data.path,
        publicUrl: publicUrlData.publicUrl
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return { error: '파일 업로드 중 오류가 발생했습니다.' }
  }
}

export async function deleteReceiptImage(path: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('receipts')
      .remove([path])

    if (error) {
      console.error('Storage delete error:', error)
      return { error: '파일 삭제에 실패했습니다.' }
    }

    return {}
  } catch (error) {
    console.error('Delete error:', error)
    return { error: '파일 삭제 중 오류가 발생했습니다.' }
  }
}

export function compressImage(file: File, maxWidth = 1024, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      const { width, height } = img
      const ratio = Math.min(maxWidth / width, maxWidth / height)
      canvas.width = width * ratio
      canvas.height = height * ratio

      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file) // Fallback to original
          }
        },
        file.type,
        quality
      )
    }

    img.src = URL.createObjectURL(file)
  })
}