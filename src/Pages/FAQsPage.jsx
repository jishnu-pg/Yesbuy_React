import { useState, useEffect } from "react";
import { getFAQs } from "../services/api/faq";
import { showError } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";
import { IoChevronDown } from "react-icons/io5";

const FAQsPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setIsLoading(true);
      const response = await getFAQs();
      if (response.results) {
        // Filter only active FAQs
        const activeFAQs = response.results.filter(faq => faq.is_active);
        setFaqs(activeFAQs);
      }
    } catch (error) {
      console.error("Failed to fetch FAQs:", error);
      showError("Failed to load FAQs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LoaderSpinner label="Loading FAQs..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">FAQs</h1>
        
        {faqs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No FAQs available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 text-left focus:outline-none focus:ring-2 focus:ring-[#ec1b45] rounded-lg"
                >
                  <span className="text-sm sm:text-base font-medium text-gray-800 pr-4 flex-1">
                    {faq.question}
                  </span>
                  <IoChevronDown
                    size={20}
                    className={`text-gray-600 flex-shrink-0 transition-transform duration-200 ${
                      expandedId === faq.id ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                
                {expandedId === faq.id && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQsPage;

