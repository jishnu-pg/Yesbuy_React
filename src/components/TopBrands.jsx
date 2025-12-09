import { useEffect, useState } from "react";
import Carousel from "./Carousel";
import { Link } from "react-router-dom";

const brands = [
  {
    name: "H&M",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-S11-TOPBRANDS-h&m-upto50-03042025.jpg"
  },
  {
    name: "USPA",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-TOPBRANDS-uspa-min40-03042025.jpg"
  },
  {
    name: "Puma",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-TOPBRANDS-puma-min40-03042025.jpg"
  },
  {
    name: "Adidas",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-TOPBRANDS-adidas-min30-03042025.jpg"
  },
  {
    name: "The Bear House",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-TOPBRANDS-thebearhouse-5080-03042025.jpg"
  },
  {
    name: "Louis Philippe",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-TOPBRANDS-louisphilippe-min30-03042025.jpg"
  },
  {
    name: "GAP",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-TOPBRANDS-gap-upto50-03042025.jpg"
  },
  {
    name: "Red Tape",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-TOPBRANDS-redtape-min80-03042025.jpg"
  },
  {
    name: "AX & USPA",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-Summersale-ax-uspa-min40-03042025.jpg"
  },
  {
    name: "Levis & DNMX",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-Summersale-Levis-dnmx-min40-03042025.jpg"
  },
  {
    name: "Poshax & Benekleed",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-Summersale-poshax-benekleed-starting599-03042025.jpg"
  },
  {
    name: "Superdry & M&S",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-Summersale-superdry-m&S-min50-03042025.jpg"
  },
  {
    name: "Adidas & Nike",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-Summersale-adidas-nike-min30-03042025.jpg"
  },
  {
    name: "Jockey & Van Heusen",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-Summersale-jockey-vanheusen-starting199-03042025.jpg"
  },
  {
    name: "Trends, Netplay & JP",
    image: "https://assets.ajio.com/cms/AJIO/WEB/D-AM-MHP-1.0-trends-netplay-jp-min50-03042025.jpg"
  }
];

const TopBrands = () => {
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(4); // 2x2 grid on small screens
      } else {
        setItemsPerPage(6); // default for larger screens
      }
    };
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-[20px] md:text-4xl text-center font-bold text-gray-800 mt-3 mb-3  md:mt-10 md:mb-10 ">Top Brands</h1>
      <Carousel
        items={brands}
        itemsPerPage={itemsPerPage}
        renderItem={(b) => (
          <Link
            key={b.name}
            to={`/category/${b.name}/products`}
            className="bg-white shadow flex flex-col items-center justify-center h-30 md:h-90 text-lg font-semibold text-gray-700 hover:text-white transition relative"
          >
            <img
              src={b.image}
              alt={b.name}
              className="w-full h-full object-contain "
            />
          </Link>
        )}
      />
    </div>
  );
};

export default TopBrands;