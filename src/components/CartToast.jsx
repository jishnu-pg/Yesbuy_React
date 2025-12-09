import { FaRegCircleCheck } from "react-icons/fa6";
import { useEffect } from "react";

const CartToast = ({ show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;
  return (
    <div className="fixed right-4 top-20 z-[9999] flex items-center gap-2 p-4 bg-black text-white rounded shadow-lg transition-all animate-fade-in">
      <FaRegCircleCheck className="text-white text-xl" />
      <span>Item Added To Cart</span>
    </div>
  );
};
export default CartToast;