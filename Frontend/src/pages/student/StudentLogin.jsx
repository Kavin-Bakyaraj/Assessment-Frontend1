import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../layout/Loader';
import { Mail, Lock } from 'lucide-react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleLogin } from '@react-oauth/google';

//img imports
import snsLogo from '../../assets/SNS-DT Logo.png';
import loginScattered11 from "../../assets/LoginImg1.png";
import loginScattered22 from "../../assets/LoginImg2.png";
import loginScattered33 from "../../assets/LoginImg3.png";

const StudentLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const images = [loginScattered11, loginScattered22, loginScattered33];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setCurrentImageIndex((prevIndex) => 
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
        setTimeout(() => {
          setIsTransitioning(false);
        }, 1000);
      }
    }, 4000);

    return () => clearInterval(slideInterval);
  }, [isTransitioning, images.length]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

// Complete handleLogin function replacement
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setErrorMessage('');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/student/login/`,
      formData,
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );

    const { studentId, name, email, regno, dept, collegename, profileImage } = response.data;
    
    // Store all relevant data in localStorage as a backup
    localStorage.setItem('studentId', studentId);
    localStorage.setItem('studentName', name);
    localStorage.setItem('studentEmail', email);
    localStorage.setItem('studentRegno', regno);
    localStorage.setItem('studentDept', dept);
    localStorage.setItem('studentCollege', collegename);
    
    // Store profile image correctly using the same key name across the application
    if (profileImage) {
      localStorage.setItem('studentProfilePictureBase64', profileImage);
    }

    if (response.status === 200) {
      onLogin(studentId);
      navigate('/studentdashboard');
      toast.success('Login successful!');
    }
  } catch (error) {
    setErrorMessage(
      error.response?.data?.error || 'An error occurred during login.'
    );
    toast.error('Wrong username or password.');
  } finally {
    setLoading(false);
  }
};

// In your handleGoogleSuccess function
// Fix the handleGoogleSuccess function
const handleGoogleSuccess = async (credentialResponse) => {
  setLoading(true);
  try {
    console.log("Google credential received:", credentialResponse);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/student/google/login/`,
      { token: credentialResponse.credential },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );

    console.log("Server response:", response.data);

    if (response.status === 200) {
      // Store user information consistently
      localStorage.setItem('studentId', response.data.studentId);
      localStorage.setItem('studentName', response.data.name);
      localStorage.setItem('studentEmail', response.data.email);
      localStorage.setItem('studentRegno', response.data.regno);
      localStorage.setItem('studentDept', response.data.dept);
      localStorage.setItem('studentCollege', response.data.collegename);
      
      // Store profile image - using consistent key name
      if (response.data.profileImage) {
        localStorage.setItem('studentProfilePictureBase64', response.data.profileImage);
        console.log("Setting profile picture:", response.data.profileImage);
      } else {
        console.log("No profile picture provided in response");
        localStorage.removeItem('studentProfilePictureBase64');
      }

      // Handle successful login
      if (onLogin) {
        onLogin(response.data.studentId);
      }
      
      toast.success('Login successful!');
      
      // Navigate directly without timeout
      navigate('/studentdashboard');
    }
  } catch (error) {
    console.error("Google login error:", error);
    console.error("Error response:", error.response?.data);
    const errorMessage = error.response?.data?.error || 'Google login failed';
    setErrorMessage(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

const handleGoogleFailure = () => {
    toast.error('Google sign-in was unsuccessful');
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin(e);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {loading && <Loader message="Logging you in..." />}
      <ToastContainer />
      
      <div className="relative bg-white shadow-lg rounded-2xl flex max-w-6xl w-full">
        {/* Form Section */}
        <div className="flex flex-1 flex-col justify-center mt-10 p-20">
          <img
            src={snsLogo}
            className="w-[200px] absolute top-10 left-56"
            alt="SNS Institutions Logo"
          />

          <h1 className="text-3xl font-medium text-center mb-2 ml-5 mt-5 text-[#111933]">
            Student Assessment Portal
          </h1>
          <p className="text-md text-center ml-5 font-bold text-gray-500">
            Please enter your details
          </p>

          <form
            onSubmit={handleLogin}
            onKeyDown={handleKeyDown}
            className="mt-10"
          >
            <div className="relative mb-4">
              <label className="text-md font-bold text-[#111933] mb-1">Email address</label>
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
              </div>
            </div>


            <div className="relative mb-4">
              <label className="text-md  font-bold text-[#111933] mb-1">Password</label>
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

            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-[70%] mx-auto bg-[#111933] text-white  py-2 rounded-lg shadow hover:shadow-md transition-all mt-5 ml-16"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            
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
                />
              </div>
            </div>
          </form>
        </div>


        {/* Image Slideshow Section */}
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

export default StudentLogin;