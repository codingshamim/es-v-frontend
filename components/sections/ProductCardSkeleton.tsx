function ProductCardSkeleton() {
  return (
    <article
      className="rounded-2xl overflow-hidden border border-gray-200 dark:border-[#222222] bg-gray-100 dark:bg-[#111111] animate-pulse"
      aria-hidden="true"
    >
      <div className="aspect-square bg-gray-200 dark:bg-[#1a1a1a]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-[#1a1a1a] rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-[#1a1a1a] rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-[#1a1a1a] rounded w-2/3" />
        <div className="h-8 bg-gray-200 dark:bg-[#1a1a1a] rounded w-full" />
      </div>
    </article>
  );
}

export default ProductCardSkeleton;
