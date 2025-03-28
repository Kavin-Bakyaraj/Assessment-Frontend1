import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Menu, MenuItem } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

// Import your logo
import logo from "../../assets/SNS Group Logo.png";

const Navbar = () => {
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  // Load profile picture from various sources, with fallbacks
  const loadProfilePicture = () => {
    // First try to load from base64 in localStorage (most reliable)
    const storedBase64Image = localStorage.getItem("studentProfilePictureBase64");
    if (storedBase64Image && storedBase64Image.startsWith('data:image/')) {
      console.log("Navbar: Using stored base64 profile picture");
      setProfilePicture(storedBase64Image);
      return true;
    }

    // Next try the regular profile picture URL
    const storedProfilePicture = localStorage.getItem("studentProfilePicture");
    if (storedProfilePicture && 
        storedProfilePicture !== "undefined" && 
        storedProfilePicture !== "null") {
      console.log("Navbar: Using stored profile picture URL");
      setProfilePicture(storedProfilePicture);
      return true;
    }

    // If nothing found locally, return false to indicate we need to fetch from API
    return false;
  };

  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem("studentName");
    if (storedUsername) {
      setUsername(decodeURIComponent(storedUsername));
    }
    
    // Try to load profile picture from localStorage first
    const pictureLoaded = loadProfilePicture();
    
    if (!pictureLoaded) {
      // If local storage doesn't have a usable picture, fetch from main profile API
      console.log("No profile picture in localStorage, fetching from API");
      
      fetch(`${API_BASE_URL}/api/student/profile/`, {
        credentials: 'include',
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && data.profileImage) {
          console.log("Fetched profile picture from API:", data.profileImage.substring(0, 50) + "...");
          setProfilePicture(data.profileImage);
          
          // Save to localStorage for future use
          localStorage.setItem("studentProfilePictureBase64", data.profileImage);
        }
      })
      .catch(error => {
        console.error("Error fetching profile from main API:", error);
      });
    }
    
    // Listen for profile picture updates from other components
    const handleStorageChange = (e) => {
      if (e.key === 'studentProfilePictureBase64' && e.newValue) {
        console.log("Profile picture updated in localStorage, updating navbar");
        setProfilePicture(e.newValue);
      }
    };
    
    // Also check for updates periodically (as a fallback)
    const checkForUpdates = setInterval(() => {
      const storedImage = localStorage.getItem("studentProfilePictureBase64");
      if (storedImage && storedImage !== profilePicture) {
        console.log("Profile picture changed in localStorage, updating navbar");
        setProfilePicture(storedImage);
      }
    }, 5000);
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkForUpdates);
    };
  }, [API_BASE_URL]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Call the backend logout endpoint
      const response = await fetch(`${API_BASE_URL}/api/student/logout/`, {
        method: 'POST',
        credentials: 'include', // Important: include credentials to send cookies
      });
      
      // Even if the backend call fails, continue with client-side cleanup
      if (!response.ok) {
        console.warn("Backend logout API call returned an error:", response.status);
      }
  
      // Clear local/session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force page reload to completely reset app state
      window.location.href = "/studentlogin";
      
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if there's an error, redirect to login
      window.location.href = "/studentlogin";
    }
  };
  
  const handleSettingsClick = () => {
    navigate('/studentprofile');
    handleMenuClose();
  };

  // Get the first letter of the username (or a default if username is empty)
  const getInitial = () => {
    return username ? username.charAt(0).toUpperCase() : 'S';
  };

  return (
    <div className={`flex sticky top-0 z-20 bg-[#faf9f9]/70 p-4 justify-between items-center transition-all duration-300 h-20`}>
      {/* Left section - Logo and Text */}
      <div className="flex items-center gap-4">
        <img src={logo} alt="Logo" className="h-12 cursor-pointer" onClick={() => navigate('/studentdashboard')} />
        <div className="flex items-center gap-2 text-white text-sm font-medium">
        </div>
      </div>
      <div className="flex items-center gap-4 text-[#fff]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#111933]">{username || "Student"}</span>
          <button onClick={handleMenuOpen} className="">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt="Profile" 
                className="rounded-full h-12 w-12 object-cover border-2 border-yellow-500"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  console.error("Failed to load profile picture:", e.target.src);
                  e.target.onerror = null; // Prevent infinite error loop
                  setProfilePicture("");
                  // Don't remove from localStorage - it might be a temporary error
                }}
              />
            ) : (
              <div 
                className="rounded-full h-12 w-12 flex items-center justify-center bg-[#111933] text-white font-bold text-xl"
              >
                {getInitial()}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleSettingsClick}>
          <AccountCircleIcon className="mr-2" /> Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon className="mr-2" /> Logout
        </MenuItem>
      </Menu>
    </div>
  );
};

export default Navbar;