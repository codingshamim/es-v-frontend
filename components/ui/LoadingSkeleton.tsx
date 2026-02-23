interface LoadingSkeletonProps {
  variant?: "hero" | "card" | "product-grid" | "section";
  className?: string;
}

export function LoadingSkeleton({
  variant = "hero",
  className = "",
}: LoadingSkeletonProps) {
  if (variant === "hero") {
    return (
      <section
        className={`py-8 lg:py-16 bg-white dark:bg-black ${className}`}
        aria-busy="true"
        aria-label="Loading featured product"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* Left side skeleton */}
            <div className="order-2 lg:order-1 space-y-6">
              {/* Badge skeleton */}
              <div className="h-8 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />

              {/* Title skeleton */}
              <div className="space-y-3">
                <div className="h-10 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="h-10 w-3/4 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
              </div>

              {/* Features skeleton */}
              <div className="space-y-3">
                <div className="h-6 w-1/3 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-5 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse"
                    />
                  ))}
                </div>
              </div>

              {/* Price skeleton */}
              <div className="h-8 w-1/2 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />

              {/* Button skeleton */}
              <div className="h-12 w-full sm:w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
            </div>

            {/* Right side skeleton */}
            <div className="order-1 lg:order-2">
              <div className="aspect-square bg-gray-200 dark:bg-[#1a1a1a] rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "card") {
    return (
      <div
        className="rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-md"
        aria-busy="true"
        aria-label="Loading card"
      >
        {/* Image skeleton */}
        <div className="aspect-square bg-gray-200 dark:bg-[#1a1a1a] animate-pulse" />

        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
          <div className="h-6 w-1/3 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (variant === "product-grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-md"
            aria-busy="true"
          >
            {/* Image skeleton */}
            <div className="aspect-square bg-gray-200 dark:bg-[#1a1a1a] animate-pulse" />

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              <div className="h-4 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
              <div className="h-6 w-1/3 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "section") {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading content">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  return null;
}
