import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ProfileIcon from "../../assets/Dashboard icon.png";
import ProfileBackIcon from "../../assets/Iconbackground.png";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StudentProfile = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    department: "",
    collegename: "",
    regno: "",
  });
  
  // Create a custom axios instance for profile requests
  const axiosProfileInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
  });
  
  // Add request interceptor to log all outgoing requests
  axiosProfileInstance.interceptors.request.use(
    config => {
      console.log(`Request to: ${config.url}`, config);
      
      // Add JWT token from localStorage as a backup authentication method
      const token = localStorage.getItem('studentToken') || 
                    document.cookie.replace(/(?:(?:^|.*;\s*)jwt\s*\=\s*([^;]*).*$)|^.*$/, "$1");
                    
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    error => {
      console.error("Request error:", error);
      return Promise.reject(error);
    }
  );
  
  // Add response interceptor to debug responses
  axiosProfileInstance.interceptors.response.use(
    response => {
      console.log(`Response from: ${response.config.url}`, response);
      return response;
    },
    error => {
      console.error(`Error from: ${error.config?.url}`, error.response || error);
      return Promise.reject(error);
    }
  );
  
  const [profilePicture, setProfilePicture] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);
  
  // Debug function to check cookies
  const debugCookies = () => {
    console.log("All cookies:", document.cookie);
    const cookies = document.cookie.split(';').reduce((cookiesObj, cookie) => {
      const [name, value] = cookie.trim().split('=').map(c => decodeURIComponent(c));
      cookiesObj[name] = value;
      return cookiesObj;
    }, {});
    
    console.log("Parsed cookies:", cookies);
    console.log("JWT cookie present:", cookies.jwt ? "Yes" : "No");
    
    return cookies;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("Fetching student profile with credentials");
        
        // Try to get the stored token as backup
        const storedToken = localStorage.getItem('studentToken');
        const headers = { 'Content-Type': 'application/json' };
        
        // Add token to headers if available (as backup to cookies)
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }
        
        const response = await axiosProfileInstance.get(`/api/student/profile/`);
        
        console.log("Profile API response:", response.data);
        
        setProfile({
          name: response.data.name || "",
          email: response.data.email || "",
          department: response.data.dept || "",
          collegename: response.data.collegename || "",
          regno: response.data.regno || "",
        });
        
        // If profile has a base64 image, store it in localStorage
        if (response.data.profileImage && 
            response.data.profileImage.startsWith('data:image/')) {
          localStorage.setItem("studentProfilePictureBase64", response.data.profileImage);
          setProfilePicture(response.data.profileImage);
        } else if (response.data.profileImage) {
          // For backward compatibility
          localStorage.setItem("studentProfilePictureBase64", response.data.profileImage);
          setProfilePicture(response.data.profileImage);
        }
        
        setLoading(false);
        setImageLoading(false);
      } catch (err) {
        console.error("Failed to fetch student profile data:", err);
        console.error("Response status:", err.response?.status);
        console.error("Response data:", err.response?.data);
        
        // Check if it's specifically a 401 error
        if (err.response && err.response.status === 401) {
          console.error("Authentication failure - redirecting to login");
          setError("Your session has expired. Please login again.");
          
          // Clear storage and redirect after showing error
          setTimeout(() => {
            localStorage.removeItem('studentId');
            window.location.href = '/studentlogin';
          }, 2000);
        } else {
          setError("Failed to fetch student profile data.");
        }
        
        setLoading(false);
        setImageLoading(false);
      }
    };

    // Load profile picture from localStorage if available
    const loadProfilePicture = () => {
      try {
        // First check for base64 image in localStorage
        const storedBase64Image = localStorage.getItem("studentProfilePictureBase64");
        
        if (storedBase64Image && storedBase64Image.startsWith('data:image/')) {
          console.log("Using stored base64 profile picture");
          setProfilePicture(storedBase64Image);
          setImageLoading(false);
          return;
        }
        
        // Fallback to URL-based image if no base64
        const storedProfilePicture = localStorage.getItem("studentProfilePicture");
        
        if (storedProfilePicture && 
            storedProfilePicture !== "undefined" && 
            storedProfilePicture !== "null") {
          
          // Handle Google URLs specially
          if (storedProfilePicture.includes("googleusercontent.com")) {
            // Try to get the highest quality version
            let highResUrl = storedProfilePicture;
            
            // Replace s96-c (default size) with s0-c (highest resolution)
            if (storedProfilePicture.includes("=s")) {
              highResUrl = storedProfilePicture.replace(/=s\d+-c/, "=s400-c");
            }
            
            console.log("Using enhanced Google profile picture");
            setProfilePicture(highResUrl);
          }
          // Handle relative paths from server
          else if (storedProfilePicture.startsWith("/") && !storedProfilePicture.startsWith("http")) {
            // Convert relative path to full URL using BASE_URL
            const fullImageUrl = `${API_BASE_URL}${storedProfilePicture}`;
            console.log("Converting relative path to full URL:", fullImageUrl);
            setProfilePicture(fullImageUrl);
          }
          // Handle absolute URLs
          else if (storedProfilePicture.startsWith("http")) {
            setProfilePicture(storedProfilePicture);
          } 
          // Handle other formats
          else {
            setProfilePicture(storedProfilePicture);
          }
        }
      } catch (err) {
        console.error("Error loading profile picture:", err);
      }
    };

    // Debug cookies
    const cookies = debugCookies();
    console.log("JWT cookie at component load:", cookies.jwt);

    fetchProfile();
    loadProfilePicture();
  }, [API_BASE_URL]); // Added API_BASE_URL as dependency

  // Monitor network requests to detect staff API calls
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = function() {
      const url = arguments[0];
      console.log("Fetch request:", url);
      
      // Check if this is a staff-related API call
      if (typeof url === 'string' && url.includes('/api/staff/')) {
        console.error("❗ Detected staff API call in student profile:", url);
      }
      
      return originalFetch.apply(this, arguments);
    };
    
    const originalXHROpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function() {
      const method = arguments[0];
      const url = arguments[1];
      console.log(`XHR ${method} request:`, url);
      
      // Check if this is a staff-related API call
      if (typeof url === 'string' && url.includes('/api/staff/')) {
        console.error("❗ Detected staff API call in student profile:", url);
      }
      
      return originalXHROpen.apply(this, arguments);
    };
    
    return () => {
      // Restore original functions when component unmounts
      window.fetch = originalFetch;
      window.XMLHttpRequest.prototype.open = originalXHROpen;
    };
  }, []);

  const handleImageLoad = () => {
    console.log("Profile image loaded successfully");
    setImageLoading(false);
  };

  const handleImageError = (e) => {
    console.error("Failed to load profile picture:", e.target.src);
    setProfilePicture("");
    setImageLoading(false);
  };

  const getInitial = () => {
    return profile.name ? profile.name.charAt(0).toUpperCase() : 'S';
  };

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
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      toast.error('Please select an image file', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      toast.error('Image size should be less than 5MB', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
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
        `${API_BASE_URL}/api/student/update-profile-picture/`,
        { profileImageBase64: base64Data },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      
      if (response.status === 200) {
        // Get the base64 image from the response
        const base64Image = response.data.profileImage;
        
        // Store the base64 in localStorage using the STUDENT key (not staff)
        localStorage.setItem('studentProfilePictureBase64', base64Image);
        
        try {
          // Create and dispatch a storage event
          const storageEvent = new StorageEvent('storage', {
            key: 'studentProfilePictureBase64',
            newValue: base64Image,
            url: window.location.href
          });
          window.dispatchEvent(storageEvent);
          
          // As a fallback, also explicitly set a trigger variable
          localStorage.setItem('studentProfileUpdatedAt', Date.now().toString());
        } catch (err) {
          console.error("Failed to dispatch storage event:", err);
        }
        
        // Update state with the base64 image
        setProfilePicture(base64Image);
        setSuccessMessage("Profile picture updated successfully!");
        toast.success("Profile picture updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        
        console.log("Profile picture updated (base64)");
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      const errorMessage = err.response?.data?.error || "Failed to upload profile picture";
      setError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setUploading(false);
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
    <div className="w-full bg-[#f4f6ff86] p-9 max-h-screen ">
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
        style={{ zIndex: 9999 }} // Ensure high z-index
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
                      transform: "scale(1.01)"
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
              
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div>
            <h1 className="text-[#111933] font-medium text-2xl mt-4">Profile</h1>
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
              <label className="text-[#111933] font-semibold">Register Number</label>
              <input
                type="text"
                disabled
                name="regno"
                value={profile.regno}
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

export default StudentProfile;