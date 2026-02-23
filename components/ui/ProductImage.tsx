import Image from 'next/image';

interface ProductImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

export function ProductImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = '',
  sizes,
}: ProductImageProps) {
  const imageProps = fill
    ? {
        fill: true,
        sizes: sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      }
    : {
        width: width || 400,
        height: height || 400,
      };

  return (
    <Image
      src={src}
      alt={alt}
      {...imageProps}
      className={`w-full aspect-square object-cover ${className}`}
      loading={priority ? undefined : 'lazy'}
      priority={priority}
    />
  );
}
