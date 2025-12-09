import { Link } from "react-router-dom";
import { MdOutlinePerson } from "react-icons/md";
import { GoHome, GoClock} from "react-icons/go";
import { BiCategory } from "react-icons/bi";

const MobileNavBar = () => {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center py-2 z-150 sm:hidden shadow">
      <Link to="/home" className="flex flex-col items-center text-gray-700 hover:text-[#ec1b45]">
        <GoHome size={26} />
        <span className="text-xs">Home</span>
      </Link>
      <Link to="/category/men" className="flex flex-col items-center text-gray-700 hover:text-[#ec1b45]">
        <BiCategory size={26} color="#9CA3AF
" />
        <span className="text-xs">Categories</span>
      </Link>
      <Link to="/orders" className="flex flex-col items-center text-gray-700 hover:text-[#ec1b45]">
        <GoClock size={26} />
        <span className="text-xs">Orders</span>
      </Link>
      <Link to="/profile" className="flex flex-col items-center text-gray-700 hover:text-[#ec1b45]">
        <MdOutlinePerson size={26} />
        <span className="text-xs">Profile</span>
      </Link>
    </nav>
  );
};

export default MobileNavBar; 