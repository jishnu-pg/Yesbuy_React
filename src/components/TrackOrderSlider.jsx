import { useState, useEffect } from "react";
import { FaTimes, FaCheckCircle, FaBox, FaTruck, FaHome } from "react-icons/fa";
import { trackOrder } from "../services/api/tracking";
import { showError } from "../utils/toast";
import LoaderSpinner from "./LoaderSpinner";

const TrackOrderSlider = ({ isOpen, onClose, orderId }) => {
    const [trackingData, setTrackingData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (isOpen && orderId) {
            fetchTrackingData();
        }
    }, [isOpen, orderId]);

    const fetchTrackingData = async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            const response = await trackOrder(orderId);

            // If we get here, status was true
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setTrackingData(response.data);
            } else {
                setErrorMessage(response.message || "No tracking information available");
            }
        } catch (error) {
            console.error("Failed to fetch tracking data:", error);

            // Check if error has response data attached (happens when status: false)
            // The HTTP service throws error for status:false but attaches the response
            if (error.response && error.response.data && Array.isArray(error.response.data) && error.response.data.length > 0) {
                // We have tracking data even though status was false (dummy data)
                setTrackingData(error.response.data);
            } else {
                setErrorMessage(error.message || "Failed to load tracking information. Please try again.");
                showError("Failed to load tracking information");
            }
        } finally {
            setIsLoading(false);
        }
    };


    const getStatusIcon = (title) => {
        // Use the same green checkmark icon for all statuses
        return <FaCheckCircle className="text-green-500" size={20} />;
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed top-0 right-0 h-full w-full sm:w-[40%] sm:min-w-[400px] sm:max-w-[500px] bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out border-l-2 border-gray-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            {/* Header */}
            <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 flex items-center justify-between z-10 border-b border-gray-200">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">Track Order</h2>
                    {/* <p className="text-xs sm:text-sm text-gray-600 mt-1">Order ID: {orderId}</p> */}
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close"
                >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto h-[calc(100vh-80px)] p-4 sm:p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <LoaderSpinner label="Loading tracking information..." />
                    </div>
                ) : errorMessage ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <FaBox size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-600 text-sm">{errorMessage}</p>
                        <button
                            onClick={fetchTrackingData}
                            className="mt-4 px-4 py-2 bg-[#ec1b45] text-white rounded-lg hover:bg-[#d91b40] transition-colors text-sm font-medium"
                        >
                            Retry
                        </button>
                    </div>
                ) : trackingData.length > 0 ? (
                    <div className="space-y-4">
                        {trackingData.map((item, index) => (
                            <div key={index} className="relative">
                                {/* Timeline connector line */}
                                {index < trackingData.length - 1 && (
                                    <div className="absolute left-[10px] top-[30px] w-0.5 h-[calc(100%+16px)] bg-gray-200"></div>
                                )}

                                {/* Status Item */}
                                <div className="flex gap-4">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 w-5 h-5 mt-1 relative z-10 bg-white">
                                        {getStatusIcon(item.title)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-6">
                                        <h3 className="text-base font-bold text-gray-900 mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {item.description}
                                        </p>
                                        <div className="flex flex-col gap-1 text-xs text-gray-500">
                                            {item.date_time && (
                                                <span>{item.date_time}</span>
                                            )}
                                            {item.location && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                    </svg>
                                                    {item.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <FaBox size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-600 text-sm">No tracking information available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackOrderSlider;
