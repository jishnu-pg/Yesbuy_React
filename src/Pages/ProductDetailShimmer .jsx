const ProductDetailShimmer = () => {
  return (
    <div className="p-4 max-w-5xl mx-auto flex flex-col md:flex-row gap-8 animate-pulse">
      {/* Image Gallery Shimmer */}
      <div className="flex-1">
        {/* Main Image */}
        <div className="w-full h-96 bg-gray-200 rounded-lg mb-4"></div>
        {/* Thumbnails */}
        <div className="flex gap-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="w-20 h-20 bg-gray-200 rounded-lg"
            ></div>
          ))}
        </div>
      </div>

      {/* Details Shimmer */}
      <div className="flex-1 space-y-4">
        {/* Title */}
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        {/* Brand */}
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        {/* Price */}
        <div className="h-7 bg-gray-200 rounded w-1/4"></div>

        {/* Sizes */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="w-10 h-8 bg-gray-200 rounded-md"
            ></div>
          ))}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <div className="w-32 h-10 bg-gray-200 rounded-md"></div>
          <div className="w-32 h-10 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailShimmer;