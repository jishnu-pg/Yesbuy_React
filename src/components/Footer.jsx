import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { SiGoogleplay, SiAppstore } from "react-icons/si";
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaCcPaypal, FaCcApplePay } from "react-icons/fa";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-200 pt-12 pb-6 mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-gray-700 pb-10">
          {/* Yesbuy */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              
              <span className="text-xl font-bold tracking-wide">Yesbuy</span>
            </div>
            <p className="text-gray-400 text-sm mb-2">Your one-stop shop for the latest trends and best deals. Shop with confidence and enjoy fast delivery, easy returns, and 24/7 support.</p>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="hover:text-[#ec1b45] transition"><FaFacebook size={22} /></a>
              <a href="#" aria-label="Instagram" className="hover:text-[#ec1b45] transition"><FaInstagram size={22} /></a>
              <a href="#" aria-label="Twitter" className="hover:text-[#ec1b45] transition"><FaTwitter size={22} /></a>
              <a href="#" aria-label="YouTube" className="hover:text-[#ec1b45] transition"><FaYoutube size={22} /></a>
            </div>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Help</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-[#ec1b45] transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">FAQs</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">Returns</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">Shipping</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">Track Order</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Shop By */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop By</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-[#ec1b45] transition">Men</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">Women</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">Kids</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">Beauty</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">Accessories</a></li>
              <li><a href="#" className="hover:text-[#ec1b45] transition">Brands</a></li>
            </ul>
          </div>

          {/* Follow Us & App Download */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Get Our App</h3>
            <div className="flex gap-3 mb-4">
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gray-800 px-3 py-2 rounded hover:bg-[#ec1b45] transition">
                <SiGoogleplay size={20} /> <span className="text-sm font-medium">Play Store</span>
              </a>
              <a href="https://www.apple.com/in/app-store/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gray-800 px-3 py-2 rounded hover:bg-[#ec1b45] transition">
                <SiAppstore size={20} /> <span className="text-sm font-medium">App Store</span>
              </a>
            </div>
            <h3 className="text-lg font-semibold mb-4 mt-6">We Accept</h3>
            <div className="flex gap-4 mt-2">
              <FaCcVisa size={32} className="text-gray-400" />
              <FaCcMastercard size={32} className="text-gray-400" />
              <FaCcAmex size={32} className="text-gray-400" />
              <FaCcPaypal size={32} className="text-gray-400" />
              <FaCcApplePay size={32} className="text-gray-400" />
            </div>
          </div>
        </div>
        <div className="text-center text-gray-500 text-xs mt-8">&copy; {new Date().getFullYear()} Yesbuy. All rights reserved.</div>
      </div>
    </footer>
  );
};

export default Footer; 