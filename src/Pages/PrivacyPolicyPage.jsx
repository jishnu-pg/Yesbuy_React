import { useState, useEffect } from "react";
import { getPrivacyPolicy } from "../services/api/privacy";
import { showError } from "../utils/toast";
import LoaderSpinner from "../components/LoaderSpinner";

const PrivacyPolicyPage = () => {
  const [content, setContent] = useState(null);
  const [title, setTitle] = useState("Privacy Policy");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      setIsLoading(true);
      const response = await getPrivacyPolicy();
      if (response.results && response.results.length > 0) {
        const privacyData = response.results[0];
        setTitle(privacyData.title || "Privacy Policy");
        setContent(privacyData.content || "");
      }
    } catch (error) {
      console.error("Failed to fetch Privacy Policy:", error);
      showError("Failed to load Privacy Policy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Format content with proper line breaks
  const formatContent = (text) => {
    if (!text) return "";
    // Replace \r\n with actual line breaks and handle multiple line breaks
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n") // Replace 3+ line breaks with 2
      .split("\n")
      .map((line, index) => {
        // If line is empty, return a break
        if (line.trim() === "") {
          return <br key={index} />;
        }
        // All text same size, no bold
        return (
          <p key={index} className="text-gray-700 mb-3 text-sm sm:text-base leading-relaxed">
            {line.trim()}
          </p>
        );
      });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <LoaderSpinner label="Loading Privacy Policy..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">{title}</h1>
        
        {content ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
            <div className="prose max-w-none">
              {formatContent(content)}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No Privacy Policy available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
