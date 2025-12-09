const ProductImageGallery = ({ 
  mainImage, 
  allThumbnailImages, 
  mainImageIndex, 
  setMainImageIndex, 
  productName,
  sizeChartImage 
}) => {
  return (
    <div className="w-full lg:flex-1 lg:max-w-xl">
      {/* Main Image */}
      <div className="mb-2 sm:mb-3">
        <img
          src={mainImage}
          alt={productName}
          className="w-full max-h-64 sm:max-h-80 lg:max-h-96 object-contain rounded-lg bg-gray-50"
        />
      </div>

      {/* Thumbnail Images */}
      {allThumbnailImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {allThumbnailImages.map((img, index) => {
            // Check if this is the size chart image (last image if size chart exists)
            const isSizeChart = sizeChartImage && img === sizeChartImage && index === allThumbnailImages.length - 1;
            
            return (
              <button
                key={index}
                onClick={() => {
                  // Always set the main image index - size chart image behaves like regular image
                  setMainImageIndex(index);
                }}
                className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                  index === mainImageIndex
                    ? "border-[#ec1b45] ring-2 ring-[#ec1b45]"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                title={isSizeChart ? "Size Chart" : `${productName} view ${index + 1}`}
              >
                <img
                  src={img}
                  alt={isSizeChart ? "Size Chart" : `${productName} view ${index + 1}`}
                  className="w-full h-16 sm:h-20 object-cover"
                />
                {isSizeChart && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] sm:text-xs font-semibold px-1 py-0.5 text-center">
                    Size Chart
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;

