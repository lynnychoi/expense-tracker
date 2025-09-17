'use client'

import { useState, useRef, useEffect } from 'react'
import { useIntersectionObserver } from '@/hooks/usePerformance'

interface LazyImageProps {
  src: string
  alt: string
  placeholder?: string
  className?: string
  width?: number
  height?: number
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5QzEwLjM0IDkgOSAxMC4zNCA5IDEyQzkgMTMuNjYgMTAuMzQgMTUgMTIgMTVDMTMuNjYgMTUgMTUgMTMuNjYgMTUgMTJDMTUgMTAuMzQgMTMuNjYgOSAxMiA5WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K',
  className = '',
  width,
  height,
  onLoad,
  onError
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  
  const { isIntersecting } = useIntersectionObserver(imgRef as React.RefObject<Element>, {
    threshold: 0.1,
    rootMargin: '50px'
  })

  useEffect(() => {
    if (isIntersecting && !isLoaded && !hasError) {
      const img = new Image()
      
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
        onLoad?.()
      }
      
      img.onerror = () => {
        setHasError(true)
        onError?.()
      }
      
      img.src = src
    }
  }, [isIntersecting, src, isLoaded, hasError, onLoad, onError])

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-50'
      } ${className}`}
      width={width}
      height={height}
      loading="lazy"
    />
  )
}