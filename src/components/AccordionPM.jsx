import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const AccordionPM = ({ title, isOpen, onToggle, children }) => (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 text-left font-medium hover:text-[#ec1b45] transition-colors"
      >
        <div className="flex items-center gap-2">{title}</div>
        {isOpen ? (
          <FaChevronUp className="text-gray-500 transition-transform duration-200" size={14} />
        ) : (
          <FaChevronDown className="text-gray-500 transition-transform duration-200" size={14} />
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