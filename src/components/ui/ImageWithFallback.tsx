'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  width = 600,
  height = 400,
  className = '',
  fallbackSrc,
  priority = false,
}) => {
  // Create a local SVG fallback instead of relying on external services
  const createLocalFallback = (text: string) => {
    const encodedText = encodeURIComponent(text);
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e9ecef"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle" dy=".3em">${text}</text>
      </svg>
    `)}`;
  };

  // Handle both old and new placeholder URLs by creating local fallbacks
  const getImageSrc = () => {
    if (!src) return createLocalFallback('No Image');

    if (src.includes('placehold.co') || src.includes('via.placeholder.com')) {
      // Extract text from placeholder URL
      const textMatch = src.match(/text=([^&]+)/);
      const text = textMatch ? decodeURIComponent(textMatch[1].replace(/\+/g, ' ')) : 'Image';
      return createLocalFallback(text);
    }

    return src;
  };

  const [imgSrc, setImgSrc] = useState(getImageSrc());
  const [hasError, setHasError] = useState(false);

  // Local fallback
  const defaultFallback = createLocalFallback('Image Not Available');
  const finalFallbackSrc = fallbackSrc || defaultFallback;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(finalFallbackSrc);
    }
  };

  const handleLoad = () => {
    setHasError(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className="object-cover"
        onError={handleError}
        onLoad={handleLoad}
        priority={priority}
        unoptimized={imgSrc.includes('placeholder') || imgSrc.includes('placehold')}
      />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          <div className="text-center">
            <div className="mb-2">📷</div>
            <div>Image not available</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageWithFallback;
