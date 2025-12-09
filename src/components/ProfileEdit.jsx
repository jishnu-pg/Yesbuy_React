import { useState, useEffect, useRef } from "react";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegUserCircle } from "react-icons/fa";
import { getUserProfile, updateUserProfile } from "../services/api/profile";
import { showSuccess, showError } from "../utils/toast";

const initialUser = {
  userId: '',
  avatar: null,
  username: '',
  phone: '',
  email: '',
  gender: '',
  dob: '',
  first_name: '',
};

// Helper function to convert backend gender to form value
const mapGenderFromBackend = (gender) => {
  if (!gender) return '';
  
  // If already in numeric format ("0", "1", "2"), return as-is
  if (gender === '0' || gender === '1' || gender === '2') {
    return gender;
  }
  
  // Otherwise, convert from text format to numeric
  const lowerGender = gender.toLowerCase();
  if (lowerGender === 'male') return '0';
  if (lowerGender === 'female') return '1';
  if (lowerGender === 'others' || lowerGender === 'other') return '2';
  return '';
};

// Helper function to convert form gender value to display text
const getGenderDisplayText = (value) => {
  switch (value) {
    case '0': return 'Male';
    case '1': return 'Female';
    case '2': return 'Others';
    default: return '';
  }
};

const ProfileEdit = ({ onProfileUpdate }) => {
  const [user, setUser] = useState(initialUser);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(initialUser);
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [errorField, setErrorField] = useState(null);
  
  // Refs for input fields
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const dobRef = useRef(null);
  const genderRef = useRef(null);

  // Calculate max date for DOB (today's date)
  const maxDate = new Date().toISOString().split('T')[0];

  const handleEdit = () => {
    setEditMode(true);
    setForm(user);
    setProfilePicture(null);
    setProfilePicturePreview(null);
    setImgError(false);
    setErrorField(null);
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm(user);
    setProfilePicture(null);
    setProfilePicturePreview(null);
    setImgError(false);
    setErrorField(null);
  };

  // Validation function
  const validateForm = () => {
    setErrorField(null);
    
    // Validate Username
    if (!form.username || form.username.trim() === '') {
      showError("Username is required");
      setErrorField('username');
      usernameRef.current?.focus();
      return false;
    }

    if (form.username.trim().length < 2) {
      showError("Username must be at least 2 characters");
      setErrorField('username');
      usernameRef.current?.focus();
      return false;
    }

    // Validate Email
    if (!form.email || form.email.trim() === '') {
      showError("Email is required");
      setErrorField('email');
      emailRef.current?.focus();
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      showError("Please enter a valid email address");
      setErrorField('email');
      emailRef.current?.focus();
      return false;
    }

    // Validate Date of Birth (if provided)
    if (form.dob) {
      const dobDate = new Date(form.dob);
      const today = new Date();
      
      if (dobDate > today) {
        showError("Date of Birth cannot be in the future");
        setErrorField('dob');
        dobRef.current?.focus();
        return false;
      }

      // Check if age is reasonable (not more than 150 years)
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age > 150) {
        showError("Please enter a valid Date of Birth");
        setErrorField('dob');
        dobRef.current?.focus();
        return false;
      }
    }

    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append("user_name", form.username.trim());
      formData.append("email", form.email.trim());
      formData.append("dob", form.dob || "");
      // Default gender to "0" (male) if not selected
      formData.append("gender", form.gender || "0");
      
      // Add profile picture if a new one was selected
      if (profilePicture) {
        formData.append("profile_picture", profilePicture);
      }
      
      // Call API
      const response = await updateUserProfile(formData);
      
      if (response.message) {
        showSuccess(response.message || "Profile updated successfully");
        
        // Update local state
        setUser({
          ...form,
          avatar: profilePicturePreview || user.avatar,
        });
        setEditMode(false);
        setProfilePicture(null);
        setProfilePicturePreview(null);
        
        // Refresh profile data
        await fetchUserProfile();
        
        // Notify parent component to refresh
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      // Error toast is already shown by http.js
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error field when user starts typing
    if (errorField === name) {
      setErrorField(null);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showError("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError("Image size should be less than 5MB");
        return;
      }
      
      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch user profile function
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getUserProfile();
      
      if (response.results) {
        const profileData = response.results;
        
        // Map API response to form fields
        const mappedUser = {
          userId: profileData.id?.toString() || profileData.user_name || '',
          avatar: profileData.profile_picture || null,
          username: profileData.user_name || '',
          phone: profileData.phone_number || '',
          email: profileData.email || '',
          gender: mapGenderFromBackend(profileData.gender), // Convert "male"/"female"/"others" to "0"/"1"/"2"
          dob: profileData.dob || '',
          first_name: profileData.first_name || '',
        };
        
        setUser(mappedUser);
        setForm(mappedUser);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Failed to load profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Scroll to error field when validation fails
  useEffect(() => {
    if (errorField) {
      let refToFocus = null;
      switch (errorField) {
        case 'username':
          refToFocus = usernameRef.current;
          break;
        case 'email':
          refToFocus = emailRef.current;
          break;
        case 'dob':
          refToFocus = dobRef.current;
          break;
        case 'gender':
          refToFocus = genderRef.current;
          break;
        default:
          break;
      }
      
      if (refToFocus) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          refToFocus.scrollIntoView({ behavior: 'smooth', block: 'center' });
          refToFocus.focus();
        }, 100);
      }
    }
  }, [errorField]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#ec1b45] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Personal Information</h2>
          <p className="text-gray-600 text-sm">Manage your account details</p>
        </div>
        {!editMode && (
          <button 
            onClick={handleEdit}
            className="flex items-center gap-2 bg-[#ec1b45] text-white px-4 py-2 rounded-md hover:bg-[#d91b40] transition-colors text-sm"
          >
            <MdOutlineEdit size={16} />
            Edit Profile
          </button>
        )}
      </div>

      <form className="space-y-6" onSubmit={handleSave} noValidate>
        {/* Profile Picture Upload */}
        {editMode && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : user.avatar && !imgError ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <FaRegUserCircle size={48} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <span className="bg-[#ec1b45] text-white px-4 py-2 rounded-md hover:bg-[#d91b40] transition-colors text-sm inline-block">
                    Choose Image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
            <input
              type="text"
              value={form.userId || ''}
              disabled
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              ref={usernameRef}
              type="text"
              name="username"
              value={form.username || ''}
              onChange={handleChange}
              disabled={!editMode}
              className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${
                errorField === 'username'
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : editMode 
                    ? 'border-gray-300 focus:border-[#ec1b45] focus:outline-none bg-white' 
                    : 'border-gray-300 bg-gray-50 text-gray-700'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
            <input
              type="text"
              name="phone"
              value={form.phone || ''}
              onChange={handleChange}
              disabled
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              ref={emailRef}
              type="text"
              name="email"
              value={form.email || ''}
              onChange={handleChange}
              disabled={!editMode}
              className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${
                errorField === 'email'
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : editMode 
                    ? 'border-gray-300 focus:border-[#ec1b45] focus:outline-none bg-white' 
                    : 'border-gray-300 bg-gray-50 text-gray-700'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              ref={dobRef}
              type="date"
              name="dob"
              value={form.dob || ''}
              onChange={handleChange}
              disabled={!editMode}
              max={maxDate}
              className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${
                errorField === 'dob'
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : editMode 
                    ? 'border-gray-300 focus:border-[#ec1b45] focus:outline-none bg-white' 
                    : 'border-gray-300 bg-gray-50 text-gray-700'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              ref={genderRef}
              name="gender"
              value={form.gender || ''}
              onChange={handleChange}
              disabled={!editMode}
              className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${
                errorField === 'gender'
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : editMode 
                    ? 'border-gray-300 focus:border-[#ec1b45] focus:outline-none bg-white' 
                    : 'border-gray-300 bg-gray-50 text-gray-700'
              } focus:outline-none`}
            >
              <option value="">Select Gender</option>
              <option value="0">Male</option>
              <option value="1">Female</option>
              <option value="2">Others</option>
            </select>
          </div>
        </div>

        {editMode && (
          <div className="flex gap-3 pt-4 border-t">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-[#ec1b45] text-white px-4 py-2 rounded-md hover:bg-[#d91b40] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
            <button 
              type="button" 
              onClick={handleCancel}
              disabled={isSaving}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
      {/* <div className="flex items-center gap-3 shadow shadow-red-500 p-4 h-50 mt-8">
        {user.avatar && !imgError ? (
          <img
            src={user.avatar}
            alt="User Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-red-400"
            onError={() => setImgError(true)}
          />
        ) : (
          <FaRegUserCircle size={96} className="text-gray-300" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-6 ">
            <span className="text-2xl font-semibold text-gray-900 truncate ">{user.username}</span>
            {!editMode && (
              <button className="ml-auto underline text-red-500 hover:bg-gray-100 transition" aria-label="Edit Profile" onClick={handleEdit}>
                Edit
              </button>
            )}
          </div>
          <div className="text-gray-500 text-lg mt-1">{user.phone}</div>
        </div>
      </div> */}
    </div>
  );
};

export default ProfileEdit;