const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="aspect-square shimmer"></div>
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 shimmer rounded"></div>
        <div className="h-4 w-full shimmer rounded"></div>
        <div className="h-4 w-3/4 shimmer rounded"></div>
        <div className="h-5 w-20 shimmer rounded"></div>
        <div className="h-6 w-24 shimmer rounded"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
