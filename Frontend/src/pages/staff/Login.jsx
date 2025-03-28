import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import Cookies from "js-cookie";
import { Mail } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleLogin } from '@react-oauth/google';
import loginScattered from "../../assets/LoginImg1.png";
import loginScattered2 from "../../assets/LoginImg2.png";
import loginScattered3 from "../../assets/LoginImg3.png";
import DTimg from "../../assets/SNS-DT Logo.png";

const StaffLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const images = [loginScattered, loginScattered2, loginScattered3];
  const [isAccountLocked, setIsAccountLocked] = useState(false);
const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
const [lockoutTimer, setLockoutTimer] = useState(null);

  const formatLockoutTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
  };
  
  

  // Updated Image slideshow effect with pause
  useEffect(() => {
    const slideInterval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        
        // Move to next image
        setCurrentImageIndex((prevIndex) => {
          if (prevIndex === images.length - 1) {
            return 0;
          }
          return prevIndex + 1;
        });

        // Reset transition flag after animation completes
        setTimeout(() => {
          setIsTransitioning(false);
        }, 1000); // Match this with transition duration
      }
    }, 4000); // Total time for each slide (including transition)

    return () => clearInterval(slideInterval);
  }, [isTransitioning, images.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/staff/login/`,
        { email: formData.email, password: formData.password },
        { withCredentials: true } // Include credentials if needed
      );
  
      console.log("Server Response:", response.data); // Debugging
  
      // Ensure tokens exist in response
      if (!response.data.tokens || !response.data.tokens.jwt) {
        toast.error("Invalid email or password");
        return;
      }
  
      // Extract required values
      const jwt = response.data.tokens.jwt;
      const username = response.data.name;
      const profileImage = response.data.profileImage;
  
      // Store token in cookies
      Cookies.set("staffToken", jwt, { expires: 7 });
      Cookies.set("username", username, { expires: 7 });
  
      // Store token in localStorage (for additional security)
      localStorage.setItem("staffToken", jwt);
  
      console.log("Stored Token (Cookie):", Cookies.get("staffToken"));
      console.log("Stored Token (LocalStorage):", localStorage.getItem("staffToken"));
  
      // Store profile image (base64 or URL)
      if (profileImage) {
        if (profileImage.startsWith("data:image/")) {
          localStorage.setItem("staffProfilePictureBase64", profileImage);
          console.log("Stored base64 profile picture");
        } else {
          localStorage.setItem("staffProfilePicture", profileImage);
          console.log("Stored profile picture URL");
        }
      }
  
      // Show success toast & navigate after ensuring storage
      toast.success("Login successful!");
      setTimeout(() => navigate("/staffdashboard"), 500);
  
    } catch (error) {
      // Handle account lockout (status code 429)
      if (error.response?.status === 429) {
        const lockoutTime = error.response.data.lockout_time || 300;
        setIsAccountLocked(true);
        setLockoutTimeRemaining(lockoutTime);
        
        const errorMsg = `Account temporarily locked. Try again in ${formatLockoutTime(lockoutTime)}`;
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMessage = error.response?.data?.error || "Invalid email or password";
        setErrorMessage(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle lockout timer
  useEffect(() => {
    if (isAccountLocked && lockoutTimeRemaining > 0) {
      const timer = setInterval(() => {
        setLockoutTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsAccountLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setLockoutTimer(timer);
      return () => clearInterval(timer);
    }
  }, [isAccountLocked, lockoutTimeRemaining]);
  
// Update the handleGoogleSuccess function

// Update the handleGoogleSuccess function in Login.jsx to properly store the profile picture

const handleGoogleSuccess = async (credentialResponse) => {
  setLoading(true);
  try {
    console.log("Google credential received:", credentialResponse);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/staff/google/login/`,
      { token: credentialResponse.credential },
      { withCredentials: true }
    );

    console.log("Server response:", response.data);

    if (response.status === 200) {
      // Store the staff token
      Cookies.set("staffToken", response.data.tokens.access_token, {
        expires: 7,
      });
      Cookies.set("username", response.data.name, { expires: 7 });
      
      // Enhanced profile picture storage - properly handle base64 images
      if (response.data.profileImage) {
        try {
          // If it's a base64 image, store it directly
          if (response.data.profileImage.startsWith('data:image/')) {
            localStorage.setItem('staffProfilePictureBase64', response.data.profileImage);
            console.log("Stored base64 profile picture after login");
          } 
          // Otherwise handle it as URL
          else {
            console.log("Raw profile picture URL:", response.data.profileImage);
            
            // Get the highest quality image from Google 
            let highResUrl = response.data.profileImage;
            
            if (highResUrl && highResUrl.includes('googleusercontent.com')) {
              // Replace s96-c (default size) with s400-c (higher resolution)
              highResUrl = highResUrl.replace(/=s\d+-c/, "=s400-c");
            }
            
            console.log("Setting high-res staff profile picture:", highResUrl);
            localStorage.setItem('staffProfilePicture', highResUrl);
          }
        } catch (imgError) {
          console.error("Error processing staff profile picture:", imgError);
        }
      }

      toast.success("Google login successful!");
      
      // Use setTimeout to ensure the toast is visible before navigation
      setTimeout(() => {
        navigate("/staffdashboard");
      }, 1000);
    }
  } catch (error) {
    console.error("Google login error:", error);
    console.error("Error response:", error.response?.data);
    
    // Handle account lockout for Google login
    if (error.response?.status === 429) {
      const lockoutTime = error.response.data.lockout_time || 300;
      setIsAccountLocked(true);
      setLockoutTimeRemaining(lockoutTime);
      
      const errorMsg = `Account temporarily locked. Try again in ${formatLockoutTime(lockoutTime)}`;
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } else if (error.response?.status === 404) {
      toast.error("No staff account found with this Google email.");
    } else {
      const errorMsg = error.response?.data?.error || "Google login failed";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  } finally {
    setLoading(false);
  }
};

  const handleGoogleFailure = () => {
    toast.error("Google sign-in was unsuccessful");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin(e);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <ToastContainer />

      <div className="relative bg-white shadow-lg rounded-2xl flex max-w-6xl w-full">
        <form
          onKeyDown={handleKeyDown}
          className="flex flex-1 flex-col justify-center mt-10 p-20"
        >
          <img
            src={DTimg}
            className="w-[200px] absolute top-10 left-56"
            alt="SNS Institutions Logo"
          />

          <h1 className="text-3xl font-medium text-center mb-2 ml-5 mt-5 text-[#111933]">
            Staff Assessment Portal
          </h1>
          <p className="text-md ml-4 font-bold text-center text-gray-500 ">
            Please enter your details
          </p>

          <div className="relative mb-4 mt-10">
            <label className="text-md font-Urbanist font-bold text-[#111933] mb-1">Email address</label>
            <div className="flex items-center border rounded-lg p-2 shadow-sm">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="flex-1 focus:outline-none text-m placeholder-gray-400"
                placeholder="test@example.com"
                required
              />
              <Mail className="w-5 h-5 text-white fill-slate-400" />
            </div>
          </div>

          <div className="relative mb-4">
            <label className="text-md font-Urbanist font-bold text-[#111933] mb-1">Password</label>
            <div className="flex items-center border rounded-lg p-2 shadow-sm">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="flex-1 focus:outline-none text-m placeholder-gray-400"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <FaEye className="h-5 w-5" />
                ) : (
                  <FaEyeSlash className="h-5 w-5" />
                )}
              </button>

            </div>
            {isAccountLocked && (
                <div className="mb-4 border border-red-300 bg-red-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Account Temporarily Locked</h3>
                      <div className="mt-1 text-sm text-red-700">
                        <p>Too many failed login attempts.</p>
                        <p className="font-semibold">
                          Unlocks in: {formatLockoutTime(lockoutTimeRemaining)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            <div className="text-right mt-2">
              <Link
                to="/forgotpassword"
                className="text-sm text-blue-600 underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isAccountLocked}
            onClick={handleLogin}
            className={`w-[70%] mx-auto ${
              isAccountLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#111933]'
            } text-white font-Urbanist py-2 rounded-lg shadow hover:shadow-md transition-all mt-5`}
          >
            {loading ? "Logging in..." : isAccountLocked ? "Account Locked" : "Login"}
          </button>
          
          {/* Google Sign-In Button */}
          <div className="mt-4 text-center">
            <p className="text-gray-500 mb-2">OR</p>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                useOneTap
                theme="outline"
                shape="rectangular"
                text="signin_with"
                size="large"
                disabled={isAccountLocked}
                context="signin"
              />
            </div>
          </div>
        </form>

        {/* Updated Image Slideshow */}
        <div className="flex flex-1 justify-center items-center flex-col py-20 mr-20 overflow-hidden">
          <div className="relative w-full h-full">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Slide ${index + 1}`}
                className="absolute w-full h-full object-cover transition-all duration-1000 ease-in-out"
                style={{
                  opacity: currentImageIndex === index ? 1 : 0,
                  transform: `scale(${currentImageIndex === index ? 1 : 0.95})`,
                  zIndex: currentImageIndex === index ? 1 : 0
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;