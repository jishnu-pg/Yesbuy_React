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

const AddressManagement = () => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [formData, setFormData] = useState({
    phone_number: '',
    landmark: '',
    location_address: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    tag: 'others',
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

  const resetForm = () => {
    setFormData({
      phone_number: '',
      landmark: '',
      location_address: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      tag: 'others',
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
      country: address.country || 'India',
      tag: address.tag || 'others',
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
      case 'OTHER':
        return 'bg-gray-100 text-gray-800';
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
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter phone number"
                  />
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Address *
                  </label>
                  <input
                    type="text"
                    name="location_address"
                    value={formData.location_address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter location address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter city"
                  />
                </div>

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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter pincode"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag *
                  </label>
                  <select
                    name="tag"
                    value={formData.tag}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec1b45] focus:border-transparent text-sm sm:text-base bg-white"
                  >
                    <option value="others">Others</option>
                    <option value="home">Home</option>
                    <option value="office">Office</option>
                  </select>
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
                        {address.tag || 'OTHER'}
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

