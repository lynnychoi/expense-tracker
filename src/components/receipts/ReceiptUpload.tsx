'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, Image as ImageIcon, FileImage } from 'lucide-react'
import { compressImage } from '@/lib/storage'

interface ReceiptUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  currentFile?: File
  disabled?: boolean
  error?: string
}

export function ReceiptUpload({ 
  onFileSelect, 
  onFileRemove, 
  currentFile, 
  disabled = false,
  error 
}: ReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return
    }

    try {
      setIsCompressing(true)
      const compressedFile = await compressImage(file)
      onFileSelect(compressedFile)
    } catch (error) {
      console.error('Image compression failed:', error)
      onFileSelect(file) // Fallback to original
    } finally {
      setIsCompressing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const removeFile = () => {
    onFileRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (currentFile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">{currentFile.name}</p>
              <p className="text-xs text-gray-500">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeFile}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => !disabled && setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        {isCompressing ? (
          <div className="space-y-2">
            <ImageIcon className="mx-auto h-8 w-8 text-blue-600 animate-pulse" />
            <p className="text-sm text-gray-600">이미지 압축 중...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                영수증 이미지를 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WEBP (최대 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}