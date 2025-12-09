import { useState, useEffect } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { BiLogOut } from "react-icons/bi";
import { IoPersonOutline, IoReceiptOutline, IoHeartOutline, IoLocationOutline, IoHelpCircleOutline, IoDocumentTextOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import WishlistEdit from "../components/WishlistEdit";
import ProfileEdit from "../components/ProfileEdit";
import AddressManagement from "../components/AddressManagement";
import { logout } from "../utils/auth";
import { getUserProfile } from "../services/api/profile";

const menuOptions = [
  { key: 'profile', label: 'My Profile', icon: IoPersonOutline },
  { key: 'orders', label: 'My Orders', icon: IoReceiptOutline },
  { key: 'favorite', label: 'My Favorites', icon: IoHeartOutline },
  { key: 'addresses', label: 'Addresses', icon: IoLocationOutline },
  { key: 'faqs', label: 'FAQs', icon: IoHelpCircleOutline },
  { key: 'tandc', label: 'Terms & Conditions', icon: IoDocumentTextOutline },
  { key: 'privacy', label: 'Privacy Policy', icon: IoShieldCheckmarkOutline },
];

const Profile = () => {
  const [selected, setSelected] = useState('profile');
  const [user, setUser] = useState({
    avatar: null,
    username: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Fetch user profile function
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
      // Set default values on error
      setUser({
        avatar: null,
        username: '',
        phone: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Content for each section
  const renderContent = () => {
    switch (selected) {
      case 'profile':
        return (
          <ProfileEdit onProfileUpdate={fetchUserProfile}/>
        );
      case 'orders':
        return <div className="bg-white rounded-lg px-8 py-8 text-lg">My Orders content goes here.</div>;
      case 'favorite':
        return (
          <WishlistEdit/>
        );
      case 'addresses':
        return <AddressManagement />;
      case 'faqs':
        return <div className="bg-white rounded-lg px-8 py-8 text-lg">FAQs content goes here.</div>;
      case 'tandc':
        return <div className="bg-white rounded-lg px-8 py-8 text-lg">Terms & Conditions content goes here.</div>;
      case 'privacy':
        return <div className="bg-white rounded-lg px-8 py-8 text-lg">Privacy Policy content goes here.</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Simple Header */}
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

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg">
              <nav className="p-4">
                {menuOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSelected(opt.key)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors mb-1 ${
                      selected === opt.key 
                        ? 'bg-[#ec1b45] text-white' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <opt.icon size={18} />
                    <span className="flex-1 text-left text-sm">{opt.label}</span>
                  </button>
                ))}
                
                {/* Logout Button */}
                <div className="mt-4 pt-4 border-t">
                  <button
                    className="w-full flex items-center gap-3 px-3 py-3 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    onClick={logout}
                  >
                    <BiLogOut size={18} />
                    <span className="flex-1 text-left text-sm">Logout</span>
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg min-h-[500px]">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile; 