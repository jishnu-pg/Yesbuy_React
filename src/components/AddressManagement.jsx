import { useState, useEffect } from "react";
import {
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from "../services/api/address";
import { showError, showSuccess } from "../utils/toast";
import LoaderSpinner from "./LoaderSpinner";
import { FaEdit, FaTrash, FaCheck, FaPlus, FaTimes } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import { MdLocationOn } from "react-icons/md";

const AddressManagement = () => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: '',
    landmark: '',
    location_address: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: '', // Empty string to match Flutter
    tag: 'Home', // Default to 'Home' to match Flutter
    latitude: '1',
    longitude: '1',
    is_default: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await listAddresses();
      if (response.results) {
        // Sort addresses: default address first, then others
        const sortedAddresses = [...response.results].sort((a, b) => {
          // If a is default and b is not, a comes first
          if (a.is_default && !b.is_default) return -1;
          // If b is default and a is not, b comes first
          if (!a.is_default && b.is_default) return 1;
          // If both are default or both are not, maintain original order
          return 0;
        });
        setAddresses(sortedAddresses);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      showError("Failed to load addresses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Reverse geocode coordinates to get address details (matches Flutter logic)
  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      // This matches Flutter's geocoding approach
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'YesBuy-React-App' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      const address = data.address || {};

      // Map OpenStreetMap address format to match Flutter's placemark structure
      return {
        street: address.road || address.street || '',
        thoroughfare: address.road || address.street || '',
        locality: address.city || address.town || address.village || address.suburb || '',
        subLocality: address.suburb || address.neighbourhood || '',
        subAdministrativeArea: address.county || '',
        administrativeArea: address.state || address.region || '',
        postalCode: address.postcode || '',
        country: address.country || '',
        name: address.name || '',
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  // Get current location and prefill form (matches Flutter's useCurrentLocation)
  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser.");
      return;
    }

    try {
      setIsLocationLoading(true);

      // Get current position (matches Flutter's getCurrentPosition)
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address (matches Flutter's getAddressFromPosition)
      const addressData = await reverseGeocode(latitude, longitude);

      if (!addressData) {
        showError("Failed to get address from location. Please enter manually.");
        setIsLocationLoading(false);
        return;
      }

      // Prefill form fields (matches Flutter's logic in useCurrentLocation)
      setFormData(prev => {
        const newData = { ...prev };

        // Fill location_address (Name) - use name or thoroughfare
        if (addressData.name && addressData.name.trim()) {
          newData.location_address = addressData.name;
        } else if (addressData.thoroughfare && addressData.thoroughfare.trim()) {
          newData.location_address = addressData.thoroughfare;
        }

        // Fill address (Flat No. Street Details) - use thoroughfare or street
        if (addressData.thoroughfare && addressData.thoroughfare.trim()) {
          newData.address = addressData.thoroughfare;
        } else if (addressData.street && addressData.street.trim()) {
          newData.address = addressData.street;
        }

        // Fill landmark - use subLocality or locality (matches Flutter)
        if (addressData.subLocality && addressData.subLocality.trim()) {
          newData.landmark = addressData.subLocality;
        } else if (addressData.locality && addressData.locality.trim()) {
          newData.landmark = addressData.locality;
        }

        // Fill state (administrativeArea)
        if (addressData.administrativeArea && addressData.administrativeArea.trim()) {
          newData.state = addressData.administrativeArea;
        }

        // Fill city (district) - use locality or subAdministrativeArea (matches Flutter)
        if (addressData.locality && addressData.locality.trim()) {
          newData.city = addressData.locality;
        } else if (addressData.subAdministrativeArea && addressData.subAdministrativeArea.trim()) {
          newData.city = addressData.subAdministrativeArea;
        }

        // Fill pincode
        if (addressData.postalCode && addressData.postalCode.trim()) {
          newData.pincode = addressData.postalCode;
        }

        // Update latitude and longitude
        newData.latitude = latitude.toString();
        newData.longitude = longitude.toString();

        return newData;
      });

      showSuccess("Location details filled successfully!");
    } catch (error) {
      console.error('Location error:', error);
      if (error.code === 1) {
        showError("Location permission denied. Please enable location access in your browser settings.");
      } else if (error.code === 2) {
        showError("Location unavailable. Please check your GPS settings.");
      } else if (error.code === 3) {
        showError("Location request timed out. Please try again.");
      } else {
        showError("Failed to get current location. Please try again or enter manually.");
      }
    } finally {
      setIsLocationLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      phone_number: '',
      landmark: '',
      location_address: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: '', // Empty string to match Flutter
      tag: 'Home', // Default to 'Home' to match Flutter
      latitude: '1',
      longitude: '1',
      is_default: false,
    });
    setEditingAddress(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        // Always include latitude and longitude (set to '1' if not provided)
        if (key === 'latitude' || key === 'longitude') {
          formDataToSend.append(key, formData[key] || '1');
        } else if (key === 'country') {
          // Always send country as empty string to match Flutter
          formDataToSend.append(key, '');
        } else if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (editingAddress) {
        await updateAddress(editingAddress.id, formDataToSend);
        showSuccess("Address updated successfully!");
      } else {
        await addAddress(formDataToSend);
        showSuccess("Address added successfully!");
      }

      resetForm();
      fetchAddresses();
    } catch (error) {
      console.error("Failed to save address:", error);
      showError("Failed to save address. Please try again.");
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      phone_number: address.phone_number || '',
      landmark: address.landmark || '',
      location_address: address.location_address || '',
      address: address.address || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      country: address.country || '', // Empty string to match Flutter
      tag: address.tag || 'Home', // Default to 'Home' to match Flutter
      latitude: address.latitude || '1',
      longitude: address.longitude || '1',
      is_default: address.is_default || false,
    });
    setShowForm(true);
  };

  const handleDeleteClick = (addressId) => {
    setAddressToDelete(addressId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;

    try {
      await deleteAddress(addressToDelete);
      showSuccess("Address deleted successfully!");
      fetchAddresses();
      setShowDeleteModal(false);
      setAddressToDelete(null);
    } catch (error) {
      console.error("Failed to delete address:", error);
      showError("Failed to delete address. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAddressToDelete(null);
  };

  const handleSetDefault = async (addressId) => {
    try {
      await setDefaultAddress(addressId);
      showSuccess("Default address updated!");
      fetchAddresses();
    } catch (error) {
      console.error("Failed to set default address:", error);
      showError("Failed to set default address. Please try again.");
    }
  };

  const getTagColor = (tag) => {
    switch (tag?.toUpperCase()) {
      case 'HOME':
        return 'bg-blue-100 text-blue-800';
      case 'OFFICE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoaderSpinner label="Loading addresses..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">My Addresses</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage your delivery addresses</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#ec1b45] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md hover:bg-[#d91b40] transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
          >
            <FaPlus size={16} />
            <span>Add New Address</span>
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Add/Edit Form - Left Side */}
        {showForm && (
          <div className="w-full lg:w-1/2 bg-white rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              {/* Use Current Location Button - matches Flutter */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocationLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#ec1b45] text-white px-4 py-3 rounded-md hover:bg-[#d91b40] transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLocationLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Fetching location...</span>
                    </>
                  ) : (
                    <>
                      <MdLocationOn size={20} />
                      <span>Use Current Location</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Name (Location Address) - matches Flutter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="location_address"
                    value={formData.location_address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter name"
                  />
                </div>

                {/* Mobile Number - matches Flutter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                    maxLength={10}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter mobile number"
                  />
                </div>

                {/* Flat No. Street Details (Address) - matches Flutter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flat No. Street Details *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter flat no. and street details"
                  />
                </div>

                {/* Landmark - matches Flutter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark *
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter landmark"
                  />
                </div>

                {/* State - matches Flutter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter state"
                  />
                </div>

                {/* District (City) - matches Flutter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter district"
                  />
                </div>

                {/* Pincode - matches Flutter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                    maxLength={6}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter pincode"
                  />
                </div>

                {/* Address Type (Tag) - matches Flutter: Home/Office only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                  <input
                        type="radio"
                        name="tag"
                        value="Home"
                        checked={formData.tag === 'Home'}
                    onChange={handleInputChange}
                        className="w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-[#ec1b45]"
                        style={{ accentColor: '#ec1b45' }}
                  />
                      <span className="text-sm text-gray-700">Home</span>
                  </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                    name="tag"
                        value="Office"
                        checked={formData.tag === 'Office'}
                    onChange={handleInputChange}
                        className="w-4 h-4 text-[#ec1b45] border-gray-300 focus:ring-[#ec1b45]"
                        style={{ accentColor: '#ec1b45' }}
                      />
                      <span className="text-sm text-gray-700">Office</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  name="is_default"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={handleInputChange}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#ec1b45] border-gray-300 rounded focus:ring-[#ec1b45] cursor-pointer"
                />
                <label htmlFor="is_default" className="text-sm sm:text-base text-gray-700 cursor-pointer">
                  Set as default address
                </label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#ec1b45] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-md hover:bg-[#d91b40] transition-colors font-medium text-sm sm:text-base"
                >
                  {editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List - Right Side */}
        <div className={`${showForm ? 'w-full lg:w-1/2' : 'w-full'}`}>

          {addresses.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-white rounded-lg border border-gray-200 px-4">
              <IoLocationOutline size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4 sm:mb-6" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No addresses found</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Add your first address to get started</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-[#ec1b45] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md hover:bg-[#d91b40] transition-colors font-medium text-sm sm:text-base"
              >
                Add Address
              </button>
            </div>
          ) : (
            <div className={`${showForm ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'}`}>
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border-2 rounded-lg p-4 transition-all hover:border-[#ec1b45] bg-white ${address.is_default
                      ? 'border-[#ec1b45] bg-red-50'
                      : 'border-gray-200 hover:shadow-md'
                    }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getTagColor(address.tag)}`}>
                        {address.tag || 'Home'}
                      </span>
                      {address.is_default && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ec1b45] text-white">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(address)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(address.id)}
                        className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-700 mb-3">
                    <p className="font-semibold text-base text-gray-900">{address.address}</p>
                    <p className="text-gray-600 text-xs">{address.location_address}</p>
                    <p className="text-gray-600 text-xs">📍 {address.landmark}</p>
                    <p className="text-gray-600 text-xs">
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="text-gray-600 text-xs">{address.country}</p>
                    <p className="text-gray-700 font-medium mt-2 text-xs">📞 {address.phone_number}</p>
                  </div>

                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="flex items-center gap-1.5 text-xs text-[#ec1b45] hover:text-[#d91b40] font-medium py-1.5 px-3 hover:bg-red-50 rounded transition-colors w-full justify-center"
                    >
                      <FaCheck size={12} />
                      <span>Set as Default</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl border-2 border-gray-200 pointer-events-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Delete Address</h3>
              <button
                onClick={handleDeleteCancel}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressManagement;

