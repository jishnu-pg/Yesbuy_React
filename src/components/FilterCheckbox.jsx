
const FilterCheckbox = ({ 
  label, 
  checked, 
  onChange, 
  className = "" 
}) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer hover:text-[#ec1b45] transition-colors ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-[#ec1b45] bg-gray-100 border-gray-300 rounded focus:ring-[#ec1b45] focus:ring-2 accent-[#ec1b45]"
        style={{ accentColor: '#ec1b45' }}
      />
      <span className="text-sm">{label}</span>
    </label>
  );
};

export default FilterCheckbox; 