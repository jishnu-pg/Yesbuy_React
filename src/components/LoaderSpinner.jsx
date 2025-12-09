import { ClipLoader } from "react-spinners";

const LoaderSpinner = ({ label = "Loading...", size = 35, color = "#ec1b45" }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-gray-500 py-6">
      <ClipLoader color={color} size={size} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
};

export default LoaderSpinner;


