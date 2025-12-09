import { useState, useEffect } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import ProfileEdit from "../components/ProfileEdit";
import { getUserProfile } from "../services/api/profile";

const MyProfile = () => {
  const [user, setUser] = useState({
    avatar: null,
    username: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getUserProfile();
      
      if (response.results) {
        const profileData = response.results;
        setUser({
          avatar: profileData.profile_picture || null,
          username: profileData.user_name || '',
          phone: profileData.phone_number || '',
        });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setUser({
        avatar: null,
        username: '',
        phone: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user.avatar && !imgError ? (
              <img
                src={user.avatar}
                alt={user.username || 'User'}
                className="w-16 h-16 rounded-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#ec1b45] flex items-center justify-center">
                <FaRegUserCircle size={32} className="text-white" />
              </div>
            )}
            <div>
              {isLoading ? (
                <>
                  <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-800">{user.username || 'User'}</h1>
                  <p className="text-gray-600">{user.phone || 'No phone number'}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg">
          <ProfileEdit onProfileUpdate={fetchUserProfile} />
        </div>
      </div>
    </div>
  );
};

export default MyProfile;

