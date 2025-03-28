"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import ProfileIcon from "../../assets/Dashboard icon.png";
import ProfileBackIcon from "../../assets/Iconbackground.png";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StaffProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    department: "",
    collegename: "",
  });
  const [profilePicture, setProfilePicture] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  
  // Use ref to track if profile has been fetched
  const profileFetched = useRef(false);
  const fetchInProgress = useRef(false);
  const isMounted = useRef(true);
  
  // Create a ref to store the next allowed fetch time
  const nextAllowedFetchTime = useRef(0);
  
  // Memoize loadProfilePicture to avoid recreating on each render
  const loadProfilePicture = useCallback(() => {
    try {
      const storedBase64Image = localStorage.getItem("staffProfilePictureBase64");

      if (storedBase64Image && storedBase64Image.startsWith('data:image/')) {
        setProfilePicture(storedBase64Image);
        setImageLoading(false);
        return true;
      }

      const storedProfilePicture = localStorage.getItem("staffProfilePicture");

      if (storedProfilePicture && storedProfilePicture !== "undefined" && storedProfilePicture !== "null") {
        if (storedProfilePicture.startsWith("/") && !storedProfilePicture.startsWith("http")) {
          const fullImageUrl = `${API_BASE_URL}${storedProfilePicture}`;
          setProfilePicture(fullImageUrl);
        } else if (storedProfilePicture.includes("googleusercontent.com")) {
          let highResUrl = storedProfilePicture;
          if (storedProfilePicture.includes("=s")) {
            highResUrl = storedProfilePicture.replace(/=s\d+-c/, "=s400-c");
          }
          setProfilePicture(highResUrl);
        } else if (storedProfilePicture.startsWith("http")) {
          setProfilePicture(storedProfilePicture);
        } else {
          setProfilePicture(storedProfilePicture);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error loading profile picture:", err);
      return false;
    } finally {
      setImageLoading(false);
    }
  }, [API_BASE_URL]);

  // Combined fetch profile function that only runs once
// Update fetchProfileData to implement proper caching
const fetchProfileData = useCallback(async () => {
  // If fetch is in progress, don't fetch again
  if (fetchInProgress.current) return;

  try {
    fetchInProgress.current = true;
    setLoading(true);
    
    // First try to load from localStorage to show something immediately
    const hasLocalImage = loadProfilePicture();
    
    // Try to load profile data from localStorage
    const storedProfileData = localStorage.getItem('staffProfileData');
    const lastFetch = localStorage.getItem('profileLastFetchTime');
    const currentTime = Date.now();
    
    // If we have stored data, use it first
    if (storedProfileData) {
      try {
        const parsedData = JSON.parse(storedProfileData);
        setProfile(parsedData);
        setLoading(false);
        
        // If data is fresh (fetched within last 5 minutes), don't fetch again
        if (lastFetch && (currentTime - parseInt(lastFetch)) < 300000) {
          console.log("Using cached profile data, last fetched", new Date(parseInt(lastFetch)).toLocaleTimeString());
          fetchInProgress.current = false;
          return;
        }
      } catch (e) {
        console.error("Failed to parse stored profile data");
      }
    }
    
    // Make API call to get fresh data
    const response = await axios.get(`${API_BASE_URL}/api/staff/profile/`, {
      withCredentials: true,
    });

    if (!isMounted.current) return;

    // Update profile state
    setProfile(response.data);
    
    // Save profile data and fetch time to localStorage
    try {
      localStorage.setItem('staffProfileData', JSON.stringify(response.data));
      localStorage.setItem('profileLastFetchTime', currentTime.toString());
    } catch (e) {
      console.error("Failed to store profile data in localStorage:", e);
    }

    // Update profile image if API returned one
    if (response.data.profileImage && response.data.profileImage.startsWith('data:image/')) {
      localStorage.setItem("staffProfilePictureBase64", response.data.profileImage);
      setProfilePicture(response.data.profileImage);
    } else if (response.data.profilepicture && (!hasLocalImage || response.data.profilepicture !== localStorage.getItem("staffProfilePicture"))) {
      localStorage.setItem("staffProfilePicture", response.data.profilepicture);
      // Reload profile picture from localStorage with the new value
      loadProfilePicture();
    }
    
    // Mark as fetched to prevent additional calls
    profileFetched.current = true;
  } catch (err) {
    console.error("Failed to fetch staff profile data:", err);
    
    // If we get a rate limit response, log it
    if (err.response?.status === 429) {
      console.warn("Rate limited by the API - using cached data if available");
    }
    
    // Try to load from localStorage as fallback if we haven't already
    const storedProfileData = localStorage.getItem('staffProfileData');
    if (storedProfileData) {
      try {
        const parsedData = JSON.parse(storedProfileData);
        setProfile(parsedData);
      } catch (e) {
        console.error("Failed to parse stored profile data");
      }
    }
  } finally {
    if (isMounted.current) {
      setLoading(false);
    }
    fetchInProgress.current = false;
  }
}, [API_BASE_URL, loadProfilePicture]);

  useEffect(() => {
    // Set isMounted to true when component mounts
    isMounted.current = true;
    
    // Fetch profile data when component mounts
    fetchProfileData();
    
    // Add event listener to detect changes in profile picture from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'staffProfilePictureBase64' || e.key === 'profileUpdatedAt') {
        loadProfilePicture();
      } else if (e.key === 'staffProfileData') {
        try {
          const parsedData = JSON.parse(localStorage.getItem('staffProfileData') || '{}');
          setProfile(parsedData);
        } catch (e) {
          console.error("Failed to parse stored profile data");
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up function
    return () => {
      isMounted.current = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchProfileData, loadProfilePicture]);

  // Handle image load
  const handleImageLoad = () => {
    if (isMounted.current) {
      setImageLoading(false);
    }
  };

  // Handle image error
  const handleImageError = (e) => {
    console.error("Failed to load profile picture:", e);
    if (isMounted.current) {
      setProfilePicture("");
    }
  };

  // Get the first letter of the username (for fallback avatar)
  const getInitial = () => {
    return profile.name ? profile.name.charAt(0).toUpperCase() : 'S';
  };

  // Trigger file input click
  const handleChoosePhoto = () => {
    fileInputRef.current.click();
  };

  // Enhanced image compression function with optional base64 output
  const compressImage = (file, outputBase64 = false) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          
          // Calculate new dimensions (max 800px width/height while maintaining aspect ratio)
          let width = img.width;
          let height = img.height;
          const maxDimension = 800;
          
          if (width > height && width > maxDimension) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          if (outputBase64) {
            // Return as base64 data URL
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            resolve(base64);
          } else {
            // Return as blob/file
            canvas.toBlob(
              (blob) => {
                // Create a new file from the blob
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              },
              'image/jpeg',
              0.8  // 80% quality - good balance between size and quality
            );
          }
        };
        
        img.onerror = (error) => {
          reject(error);
        };
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  // Handle file selection and compression
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !isMounted.current) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      toast.error('Please select an image file', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      toast.error('Image size should be less than 5MB', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    setUploading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      // Generate a base64 version directly for upload
      const base64Data = await compressImage(file, true);
      
      // Upload to server
      const response = await axios.post(
        `${API_BASE_URL}/api/staff/update-profile-picture/`,
        { profileImageBase64: base64Data },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      
      if (response.status === 200 && isMounted.current) {
        // Get the base64 image from the response
        const base64Image = response.data.profileImage;
        
        // Store the base64 in localStorage
        localStorage.setItem('staffProfilePictureBase64', base64Image);
        localStorage.setItem('profileUpdatedAt', Date.now().toString());
        
        // Update state with the base64 image
        setProfilePicture(base64Image);
        setSuccessMessage("Profile picture updated successfully!");
        
        // Show success toast
        toast.success("Profile picture updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      const errorMessage = err.response?.data?.error || "Failed to upload profile picture";
      
      if (isMounted.current) {
        setError(errorMessage);
        
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } finally {
      if (isMounted.current) {
        setUploading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen ">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111933]"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#ecf2fe] p-9 max-h-screen py-44 pt-44">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 9999 }}
      />
      <div className="bg-white m-auto max-w-2xl rounded-lg shadow-lg overflow-hidden">
        <div className="px-8 pb-8">
          {/* Profile Image Section */}
          <div className="flex justify-center mt-4 relative">
            {/* Background Icon */}
            <img
              src={ProfileBackIcon || "/placeholder-bg.svg"}
              alt="Background"
              className="absolute w-auto h-60 top-0 left-0 right-0 bottom-0 mx-auto z-0"
              style={{ opacity: 0.5 }}
            />

            {/* Profile Image with Edit Overlay */}
            <div className="w-48 h-48 rounded-full mt-6 border-4 border-yellow-500 overflow-hidden relative flex items-center justify-center z-10 group">
              {/* Loading/Uploading overlay */}
              {(imageLoading || uploading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                  <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {profilePicture ? (
                <>
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    style={{
                      filter: "contrast(1.05) saturate(1.1) brightness(1.02)",
                      transform: "scale(1.01)" // Slight zoom for better fit
                    }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    referrerPolicy="no-referrer"
                  />                 

                  <div 
                    className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 cursor-pointer"
                    onClick={handleChoosePhoto}
                  >
                    <div className="text-white text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <span className="mt-1 block text-sm">Change Photo</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full h-full flex items-center justify-center bg-yellow-500 text-white font-bold text-6xl">
                    {getInitial()}
                  </div>
                  
                  {/* Hover add overlay */}
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 cursor-pointer"
                    onClick={handleChoosePhoto}
                  >
                    <div className="text-white text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span className="mt-1 block text-sm">Add Photo</span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Hidden file input */}
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Details */}
          <div>
            <h1 className="text-[#111933] font-medium text-2xl">Profile</h1>
          </div>
          <hr className="my-4 border-t border-gray-400" />
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-[#111933] font-semibold">Name</label>
              <input
                type="text"
                disabled
                name="name"
                value={profile.name}
                className="col-span-2 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111933] text-[#111933] bg-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-[#111933] font-semibold">College</label>
              <input
                type="text"
                disabled
                name="collegename"
                value={profile.collegename}
                className="col-span-2 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111933] text-[#111933] bg-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-[#111933] font-semibold">Department</label>
              <input
                type="text"
                disabled
                name="department"
                value={profile.department}
                className="col-span-2 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#111933] text-[#111933] bg-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-[#111933] font-semibold">Email</label>
              <input
                type="email"
                disabled
                name="email"
                value={profile.email}
                className="col-span-2 px-3 py-2 focus:outline-none focus:ring-1 text-[#111933] bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;