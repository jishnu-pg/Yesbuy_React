import { IoIosAdd, IoIosRemove } from "react-icons/io";

const AccordionPM = ({ title, isOpen, onToggle, children }) => (
    <div className="mb-4 border-b border-gray-200 pb-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 text-left font-medium hover:text-[#ec1b45] transition-colors"
      >
        <span>{title}</span>
        {isOpen ? (
          <IoIosRemove className="text-gray-500 transition-transform duration-200" />
        ) : (
          <IoIosAdd className="text-gray-500 transition-transform duration-200" />
        )}
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  );

  export default AccordionPM;