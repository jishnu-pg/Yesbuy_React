import Banner from "../components/Banner";
import Trending from "../components/Trending";
import DiscountCategories from "../components/DiscountCategories";
import LimitedDiscountProducts from "../components/LimitedDiscountProducts";
import CategoryShopping from "../components/CategoryShopping";
import TopBrands from "../components/TopBrands";

const HomeContent = () => {
  return (
    <div className="px-2 sm:px-4 space-y-4 sm:space-y-6 md:space-y-8">
      <Banner />
      <DiscountCategories />
      <LimitedDiscountProducts />
      <Trending />
      <CategoryShopping />
    </div>
  );
};

export default HomeContent;
