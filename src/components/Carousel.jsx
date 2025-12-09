import { useEffect, useRef, useState } from "react";

const Carousel = ({
  items = [],
  itemsPerPage = 5,
  renderItem,
  autoScrollInterval = 2500,
  slideDuration = 400,
  className = "",
  dotActiveClass = "bg-red-400 px-3",
  dotInactiveClass = "border border-red-400",
}) => {
  const [page, setPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const numPages = Math.ceil(items.length / itemsPerPage);
  const pages = Array.from({ length: numPages }, (_, idx) =>
    items.slice(idx * itemsPerPage, (idx + 1) * itemsPerPage)
  );

  useEffect(() => {
    if (!isPaused && items.length > 0) {
      intervalRef.current = setInterval(() => {
        setPage((prev) => (prev + 1) % numPages);
      }, autoScrollInterval);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPaused, numPages, items.length, autoScrollInterval]);

  const handleDotClick = (idx) => {
    setPage(idx);
  };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div
        className="overflow-hidden w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="flex transition-transform"
          style={{
            width: `${numPages * 100}%`,
            transform: `translateX(-${page * (100 / numPages)}%)`,
            transitionDuration: `${slideDuration}ms`,
          }}
        >
          {pages.map((group, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-full grid grid-cols-2 grid-rows-2 sm:grid-cols-4 sm:grid-rows-1 md:grid-cols-4 md:grid-rows-1 lg:grid-cols-6 gap-6"
              style={{ width: `${100 / numPages}%` }}
            >
              {group.map((item, i) => renderItem(item, i))}
            </div>
          ))}
        </div>
      </div>
      {/* Dots navigation */}
      {numPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: numPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`w-1 h-1 md:w-2 md:h-2 rounded-full cursor-pointer transition-all duration-200 ${page === idx ? dotActiveClass : dotInactiveClass}`}
              aria-label={`Go to page ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel; 