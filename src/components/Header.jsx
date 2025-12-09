import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import logo from "../assets/logo.png";
import { CiSearch, CiHeart } from "react-icons/ci";
import { BsHandbag } from "react-icons/bs";
import { GoPerson } from "react-icons/go";
import { IoMdNotificationsOutline } from "react-icons/io";
import { IoPersonOutline, IoReceiptOutline, IoHeartOutline, IoLocationOutline, IoHelpCircleOutline, IoDocumentTextOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import { selectWishlistCount } from "../features/wishlist/wishlistSlice";
import { logout } from "../utils/auth";
import { getCart } from "../services/api/cart";
import { searchSubcategories } from "../services/api/search";
import { getUserNotifications } from "../services/api/notification";

const menuOptions = [
  { key: 'profile', label: 'My Profile', icon: IoPersonOutline, path: '/profile' },
  { key: 'orders', label: 'My Orders', icon: IoReceiptOutline, path: '/orders' },
  { key: 'favorite', label: 'My Favorites', icon: IoHeartOutline, path: '/favorite' },
  { key: 'addresses', label: 'Addresses', icon: IoLocationOutline, path: '/addresses' },
  { key: 'faqs', label: 'FAQs', icon: IoHelpCircleOutline, path: '/faqs' },
  { key: 'tandc', label: 'Terms & Conditions', icon: IoDocumentTextOutline, path: '/terms-and-conditions' },
  { key: 'privacy', label: 'Privacy Policy', icon: IoShieldCheckmarkOutline, path: '/privacy-policy' },
];

const Header = () => {
  const navigate = useNavigate();
  const wishlistCount = useSelector(selectWishlistCount);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const desktopDropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);
  const profileDropdownTimeoutRef = useRef(null);
  const location = useLocation();

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationDropdownRef = useRef(null);

  // Fetch cart count from API
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        // Call getCart without cart_id - API will return current user's cart
        const response = await getCart();
        if (response.status && response.data && response.data.cart_items) {
          setCartCount(response.data.cart_items.length);
        } else {
          setCartCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch cart count:", error);
        setCartCount(0);
      }
    };

    fetchCartCount();

    // Listen for custom event when cart is updated
    window.addEventListener('cartUpdated', fetchCartCount);

    return () => {
      window.removeEventListener('cartUpdated', fetchCartCount);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedElement = event.target;

      // Check if click is outside profile dropdown (works for both desktop and mobile)
      const isInsideDesktopDropdown = desktopDropdownRef.current?.contains(clickedElement);
      const isInsideMobileDropdown = mobileDropdownRef.current?.contains(clickedElement);
      const isInsideProfileDropdown = isInsideDesktopDropdown || isInsideMobileDropdown;
      
      if (showProfileDropdown && !isInsideProfileDropdown) {
        console.log('[HEADER] Click outside profile dropdown detected');
        console.log('[HEADER] Clicked element:', clickedElement);
        console.log('[HEADER] Desktop dropdown ref element:', desktopDropdownRef.current);
        console.log('[HEADER] Mobile dropdown ref element:', mobileDropdownRef.current);
        console.log('[HEADER] Is inside desktop dropdown:', isInsideDesktopDropdown);
        console.log('[HEADER] Is inside mobile dropdown:', isInsideMobileDropdown);
        // Clear any pending timeout when closing via click
        if (profileDropdownTimeoutRef.current) {
          console.log('[HEADER] Clearing timeout due to outside click');
          clearTimeout(profileDropdownTimeoutRef.current);
          profileDropdownTimeoutRef.current = null;
        }
        setShowProfileDropdown(false);
      }

      // Check if click is outside search dropdown and search input
      // Use closest to check if the clicked element or its parent is inside the dropdown
      const isInsideSearchDropdown = searchDropdownRef.current?.contains(clickedElement);
      const isInsideSearchInput = searchInputRef.current?.contains(clickedElement);

      if (showSearchDropdown && !isInsideSearchDropdown && !isInsideSearchInput) {
        setShowSearchDropdown(false);
      }

      // Check if click is outside notification dropdown
      const isInsideNotificationDropdown = notificationDropdownRef.current?.contains(clickedElement);
      if (showNotificationDropdown && !isInsideNotificationDropdown) {
        setShowNotificationDropdown(false);
      }
    };

    if (showProfileDropdown || showSearchDropdown || showNotificationDropdown) {
      // Use 'click' instead of 'mousedown' to allow onClick handlers to fire first
      document.addEventListener('click', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      // Cleanup timeout on unmount
      if (profileDropdownTimeoutRef.current) {
        clearTimeout(profileDropdownTimeoutRef.current);
        profileDropdownTimeoutRef.current = null;
      }
    };
  }, [showProfileDropdown, showSearchDropdown, showNotificationDropdown]);

  // Search functionality with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If search query is empty, clear results
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }

    // Set searching state
    setIsSearching(true);
    setShowSearchDropdown(true);

    // Debounce search API call
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await searchSubcategories(searchQuery.trim());
        if (response && response.results) {
          setSearchResults(response.results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Handle keyboard navigation in search dropdown
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSearchDropdown || searchResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
            handleSearchResultClick(searchResults[selectedIndex], e);
          }
          break;
        case 'Escape':
          setShowSearchDropdown(false);
          setSearchQuery('');
          searchInputRef.current?.blur();
          break;
      }
    };

    if (showSearchDropdown) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSearchDropdown, searchResults, selectedIndex]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleSearchResultClick = (subcategory, e) => {
    // Prevent event from bubbling up to document click handler
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Navigate to subcategory page
    navigate(`/category/${subcategory.id}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSelectedIndex(-1);
    searchInputRef.current?.blur();
  };

  const handleSearchFocus = () => {
    if (searchResults.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await getUserNotifications();

      if (response) {
        // Combine welcome notifications and track orders
        const allNotifications = [
          ...(response.welcome_notification || []),
          ...(response.track_orders || [])
        ];
        setNotifications(allNotifications);
        // For now, count all as unread (you can add read/unread logic later)
        setUnreadCount(allNotifications.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleNotificationClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
    // Optionally mark as read when opened
    if (!showNotificationDropdown && unreadCount > 0) {
      setUnreadCount(0);
    }
  };

  return (
    <header className="bg-white sticky top-0 z-[100] flex flex-col w-full">
      {/* Main header row: logo, desktop search, icons */}
      <div className="flex items-center justify-between h-12 sm:h-20 px-4 md:px-10 md:h-24 w-full ">
        {/* Logo */}
        <Link to="/home" className="flex items-center flex-shrink-0">
          <img src={logo} alt="Logo" className="w-18 sm:w-20 md:w-32 lg:w-40 transition-all duration-200" />
        </Link>
        {/* Desktop Search Input */}
        <div className="hidden sm:flex flex-1 justify-center mx-6 max-w-lg z-50">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center p-3 pointer-events-none">
              <CiSearch size={22} className="text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              placeholder="Search By Subcategory..."
              className="w-full px-10 py-2 border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ec1b45] rounded-lg text-xs lg:text-sm transition-colors duration-300 focus:transition-shadow"
            />

            {/* Search Suggestions Dropdown */}
            {showSearchDropdown && (
              <div
                ref={searchDropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50"
              >
                {isSearching ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={(e) => handleSearchResultClick(result, e)}
                        onMouseDown={(e) => e.preventDefault()} // Prevent input blur on mousedown
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${index === selectedIndex ? 'bg-[#ec1b45] text-white hover:bg-[#d91b40]' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {result.sub_category_image && (
                            <img
                              src={result.sub_category_image}
                              alt={result.name}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${index === selectedIndex ? 'text-white' : 'text-gray-900'
                              }`}>
                              {result.name}
                            </p>
                            {result.category_name && (
                              <p className={`text-xs truncate ${index === selectedIndex ? 'text-gray-200' : 'text-gray-500'
                                }`}>
                                {result.category_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No results found
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        {/* Desktop Icons */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 ml-2 lg:ml-6 flex-shrink-0">
          {/* My Account - hidden on small screens - with dropdown */}
          <div
            className="hidden sm:block relative z-[100]"
            ref={desktopDropdownRef}
            onMouseEnter={() => {
              console.log('[HEADER] Desktop profile container onMouseEnter triggered');
              // Clear any existing timeout when mouse enters
              if (profileDropdownTimeoutRef.current) {
                console.log('[HEADER] Clearing existing timeout on mouse enter');
                clearTimeout(profileDropdownTimeoutRef.current);
                profileDropdownTimeoutRef.current = null;
              }
              setShowProfileDropdown(true);
            }}
            onMouseLeave={(e) => {
              console.log('[HEADER] Desktop profile container onMouseLeave triggered');
              console.log('[HEADER] MouseLeave event target:', e.target);
              // Set a delay before closing the dropdown
              profileDropdownTimeoutRef.current = setTimeout(() => {
                console.log('[HEADER] Desktop profile dropdown timeout executed - closing dropdown');
                setShowProfileDropdown(false);
              }, 300); // 300ms delay
            }}
          >
            {(() => {
              const isProfileActive = location.pathname === '/profile' || 
                                     location.pathname === '/orders' || 
                                     location.pathname === '/addresses' ||
                                     location.pathname.startsWith('/order/');
              return (
                <button className={`flex flex-col items-center px-1 sm:px-2 transition-colors ${
                  isProfileActive ? 'text-[#ec1b45]' : 'text-gray-700 hover:text-[#ec1b45]'
                }`}>
                  <GoPerson size={20} />
                  <span className="text-xs mt-1">My Account</span>
                </button>
              );
            })()}

            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 z-[100] animate-fade-in-down"
                onMouseEnter={() => {
                  console.log('[HEADER] Desktop dropdown menu onMouseEnter triggered');
                  // Clear timeout when mouse enters dropdown
                  if (profileDropdownTimeoutRef.current) {
                    console.log('[HEADER] Clearing existing timeout on dropdown mouse enter');
                    clearTimeout(profileDropdownTimeoutRef.current);
                    profileDropdownTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={(e) => {
                  console.log('[HEADER] Desktop dropdown menu onMouseLeave triggered');
                  console.log('[HEADER] MouseLeave event target:', e.target);
                  // Set delay when mouse leaves dropdown
                  profileDropdownTimeoutRef.current = setTimeout(() => {
                    console.log('[HEADER] Desktop dropdown menu timeout executed - closing dropdown');
                    setShowProfileDropdown(false);
                  }, 300); // 300ms delay
                }}
              >
                <div className="py-2">
                  {menuOptions.map((option) => {
                    const isActive = location.pathname === option.path;
                    return (
                      <Link
                        key={option.key}
                        to={option.path}
                        onClick={() => setShowProfileDropdown(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive
                            ? 'bg-[#ec1b45] text-white hover:bg-[#d91b40]'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <option.icon size={18} />
                        <span>{option.label}</span>
                      </Link>
                    );
                  })}
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      onClick={(e) => {
                        console.log('[HEADER] Desktop logout button clicked');
                        console.log('[HEADER] Event details:', {
                          type: e.type,
                          target: e.target,
                          currentTarget: e.currentTarget,
                          defaultPrevented: e.defaultPrevented,
                          isPropagationStopped: e.isPropagationStopped
                        });
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Clear any pending timeout to prevent dropdown from closing
                        if (profileDropdownTimeoutRef.current) {
                          console.log('[HEADER] Clearing pending timeout before logout');
                          clearTimeout(profileDropdownTimeoutRef.current);
                          profileDropdownTimeoutRef.current = null;
                        }
                        
                        console.log('[HEADER] Calling logout function');
                        logout();
                        console.log('[HEADER] Closing dropdown');
                        setShowProfileDropdown(false);
                      }}
                      onMouseDown={(e) => {
                        console.log('[HEADER] Desktop logout button mousedown');
                        e.preventDefault();
                        e.stopPropagation();
                        // Clear timeout on mousedown to prevent dropdown from closing
                        if (profileDropdownTimeoutRef.current) {
                          console.log('[HEADER] Clearing timeout on mousedown');
                          clearTimeout(profileDropdownTimeoutRef.current);
                          profileDropdownTimeoutRef.current = null;
                        }
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* My Account - Mobile only - with dropdown */}
          <div
            className="sm:hidden relative z-[100]"
            ref={mobileDropdownRef}
          >
            {(() => {
              const isProfileActive = location.pathname === '/profile' || 
                                     location.pathname === '/orders' || 
                                     location.pathname === '/addresses' ||
                                     location.pathname.startsWith('/order/');
              return (
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex flex-col items-center"
                  aria-label="My Account"
                >
                  <IconBtn 
                    icon={<GoPerson />} 
                    label="Profile"
                    className={isProfileActive ? 'text-[#ec1b45]' : 'text-gray-700 hover:text-[#ec1b45]'}
                  />
                </button>
              );
            })()}

            {/* Dropdown Menu - Mobile */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 z-[100] animate-fade-in-down shadow-xl">
                <div className="py-2">
                  {menuOptions.map((option) => {
                    const isActive = location.pathname === option.path;
                    return (
                      <Link
                        key={option.key}
                        to={option.path}
                        onClick={() => setShowProfileDropdown(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive
                            ? 'bg-[#ec1b45] text-white hover:bg-[#d91b40]'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <option.icon size={18} />
                        <span>{option.label}</span>
                      </Link>
                    );
                  })}
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Notification - visible on all screens */}
          <div
            className="relative z-[100]"
            ref={notificationDropdownRef}
          >
            <button
              onClick={handleNotificationClick}
              className="flex flex-col items-center relative"
              aria-label="Notifications"
            >
              <IconBtn 
                icon={<IoMdNotificationsOutline />} 
                label="Notifications" 
                badge={unreadCount > 0 ? unreadCount : null}
                className={showNotificationDropdown ? 'text-[#ec1b45]' : 'text-gray-700 hover:text-[#ec1b45]'}
              />
            </button>

            {/* Notification Dropdown */}
            {showNotificationDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg border border-gray-200 shadow-xl z-[100] max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
                  <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                </div>
                <div className="py-2">
                  {isLoadingNotifications ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          {notification.status_image && (
                            <img
                              src={notification.status_image}
                              alt="Notification"
                              className="w-10 h-10 rounded-full flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            {notification.content && (
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {notification.content}
                              </p>
                            )}
                            {notification.additional_info && (
                              <p className="text-xs text-gray-600">
                                {notification.additional_info}
                              </p>
                            )}
                            {notification.order_status && (
                              <p className="text-xs text-gray-500 mt-1">
                                Status: {notification.order_status}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Link 
            to="/favorite"
            className="flex flex-col items-center"
          >
            <IconBtn 
              icon={<CiHeart />} 
              label="Favorites" 
              badge={wishlistCount}
              className={location.pathname === '/favorite' ? 'text-[#ec1b45]' : 'text-gray-700 hover:text-[#ec1b45]'}
            />
          </Link>
          <Link 
            to="/cartPage"
            className="flex flex-col items-center"
          >
            <IconBtn 
              icon={<BsHandbag />} 
              label="Cart" 
              badge={cartCount}
              className={location.pathname === '/cartPage' || location.pathname === '/cartpage' ? 'text-[#ec1b45]' : 'text-gray-700 hover:text-[#ec1b45]'}
            />
          </Link>
        </div>
      </div>
      {/* Mobile Search Input (below main row) */}
      <div className="sm:hidden w-full px-2">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center p-3 pointer-events-none">
            <CiSearch size={22} className="text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            placeholder="Search By Subcategory..."
            className="w-full px-10 py-2 border-2 border-gray-200 outline-none focus:ring-2 focus:ring-[#ec1b45] rounded-lg text-xs transition-colors duration-300 focus:transition-shadow"
          />

          {/* Mobile Search Suggestions Dropdown */}
          {showSearchDropdown && (
            <div
              ref={searchDropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50"
            >
              {isSearching ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={(e) => handleSearchResultClick(result, e)}
                      onMouseDown={(e) => e.preventDefault()} // Prevent input blur on mousedown
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${index === selectedIndex ? 'bg-[#ec1b45] text-white hover:bg-[#d91b40]' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {result.sub_category_image && (
                          <img
                            src={result.sub_category_image}
                            alt={result.name}
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${index === selectedIndex ? 'text-white' : 'text-gray-900'
                            }`}>
                            {result.name}
                          </p>
                          {result.category_name && (
                            <p className={`text-xs truncate ${index === selectedIndex ? 'text-gray-200' : 'text-gray-500'
                              }`}>
                              {result.category_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No results found
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

    </header>
  );
};

const IconBtn = ({ icon, label, badge, className = "" }) => {
  // Format badge number for display (show 99+ if count is greater than 99)
  const displayBadge = badge > 99 ? '99+' : badge;

  return (
    <div className={`relative text-md sm:text-[20px] flex flex-col items-center px-1 sm:px-2 ${className || 'text-gray-700 hover:text-[#ec1b45]'}`}>
      {icon}
      {label && <span className="text-xs mt-1 hidden sm:block">{label}</span>}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#ec1b45] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] flex items-center justify-center px-1 shadow-sm">
          {displayBadge}
        </span>
      )}
    </div>
  );
};

export default Header;