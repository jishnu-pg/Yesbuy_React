import { useState } from "react";

const ProductImageGallery = ({
  mainImage,
  allThumbnailImages,
  mainImageIndex,
  setMainImageIndex,
  productName,
  sizeChartImage,
  onZoomChange // New prop
}) => {
  // Zoom State
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, imgWidth: 0, imgHeight: 0 });
  const [lens, setLens] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const ZOOM_LEVEL = 2.5;
  // Fixed size for zoom window to match the CSS class (w-[500px] h-[500px])
  const ZOOM_WINDOW_SIZE = 300;

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (onZoomChange) onZoomChange(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (onZoomChange) onZoomChange(false);
  };

  const handleMouseMove = (e) => {
    // Get the bounding rectangle of the image container
    // We target the inner div that has the aspect-square class
    const imageContainer = e.currentTarget.querySelector('.aspect-square');
    if (!imageContainer) return;

    const { left, top, width, height } = imageContainer.getBoundingClientRect();

    // Calculate mouse position relative to image
    const x = e.clientX - left;
    const y = e.clientY - top;

    // Check if mouse is inside the image loop
    if (x < 0 || x > width || y < 0 || y > height) {
      handleMouseLeave();
      return;
    }

    // Calculate Lens Dimensions
    const lensWidth = ZOOM_WINDOW_SIZE / ZOOM_LEVEL;
    const lensHeight = ZOOM_WINDOW_SIZE / ZOOM_LEVEL;

    // Calculate Lens Position (centered on mouse)
    let lensX = x - lensWidth / 2;
    let lensY = y - lensHeight / 2;

    // Clamp Lens within image bounds
    if (lensX < 0) lensX = 0;
    if (lensX > width - lensWidth) lensX = width - lensWidth;
    if (lensY < 0) lensY = 0;
    if (lensY > height - lensHeight) lensY = height - lensHeight;

    setMousePos({ x, y, imgWidth: width, imgHeight: height });
    setLens({ x: lensX, y: lensY, width: lensWidth, height: lensHeight });
  };
  return (
    <>
      {/* Main Image */}
      {/* Main Image Container */}
      <div
        className="mb-2 sm:mb-3 w-full max-w-sm mx-auto relative z-50 group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div
          className="aspect-square relative rounded-lg bg-gray-50 overflow-hidden cursor-crosshair border border-gray-100"
        >
          <img
            src={mainImage}
            alt={productName}
            className="w-full h-full object-contain"
          />

          {/* Lens */}
          {isHovering && (
            <div
              className="absolute bg-blue-500/10 border border-blue-400 hidden lg:block pointer-events-none"
              style={{
                top: `${lens.y}px`,
                left: `${lens.x}px`,
                width: `${lens.width}px`,
                height: `${lens.height}px`,
              }}
            />
          )}
        </div>

        {/* Zoom Window */}
        {isHovering && (
          <div
            className="absolute top-0 left-[105%] w-[500px] h-[500px] bg-white border border-gray-200 shadow-2xl hidden lg:block overflow-hidden rounded-lg z-[100]"
            style={{
              backgroundImage: `url(${mainImage})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${mousePos.imgWidth * ZOOM_LEVEL}px ${mousePos.imgHeight * ZOOM_LEVEL}px`,
              backgroundPosition: `-${lens.x * ZOOM_LEVEL}px -${lens.y * ZOOM_LEVEL}px`,
            }}
          />
        )}
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
                className={`relative border-2 rounded-lg overflow-hidden transition-all aspect-square ${index === mainImageIndex
                  ? "border-[#ec1b45] ring-2 ring-[#ec1b45]"
                  : "border-gray-300 hover:border-gray-400"
                  }`}
                title={isSizeChart ? "Size Chart" : `${productName} view ${index + 1}`}
              >
                <img
                  src={img}
                  alt={isSizeChart ? "Size Chart" : `${productName} view ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {isSizeChart && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] sm:text-xs font-semibold px-1 py-0.5 text-center z-10">
                    Size Chart
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

export default ProductImageGallery;

