import Banner from "../components/Banner";
import Trending from "../components/Trending";
import DiscountCategories from "../components/DiscountCategories";
import LimitedDiscountProducts from "../components/LimitedDiscountProducts";
import CategoryShopping from "../components/CategoryShopping";
import YBProducts from "../components/YBProducts";
import TopBrands from "../components/TopBrands";

const HomeContent = () => {
  return (
    <div className="px-2 sm:px-4 space-y-3 sm:space-y-6 md:space-y-8">
      <Banner />
      <DiscountCategories />
      <LimitedDiscountProducts />
      <Trending />
      <CategoryShopping />
      <YBProducts />
    </div>
  );
};

export default HomeContent;
