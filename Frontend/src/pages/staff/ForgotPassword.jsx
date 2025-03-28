import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Loader from "../../layout/Loader";
import { FaEnvelope, FaLock, FaKey, FaArrowLeft } from "react-icons/fa";

const ResetPasswordSchema = Yup.object().shape({
  token: Yup.string()
    .required("Verification code is required")
    .matches(/^\d{6}$/, "Must be a 6-digit number"),
  new_password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[0-9]/, "Must contain at least one number")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/[^A-Za-z0-9]/, "Must contain at least one special character")
    .required("Password is required"),
  confirm_password: Yup.string()
    .oneOf([Yup.ref("new_password"), null], "Passwords must match")
    .required("Confirm password is required"),
});

const TokenVerificationSchema = Yup.object().shape({
  token: Yup.string()
    .required("Verification code is required")
    .matches(/^\d{6}$/, "Must be a 6-digit number"),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [tokenRequestedAt, setTokenRequestedAt] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    let timer;
    if (tokenRequestedAt) {
      timer = setInterval(() => {
        const now = new Date();
        const secondsElapsed = Math.floor((now - tokenRequestedAt) / 1000);
        const secondsRemaining = 300 - secondsElapsed; // 5 minutes = 300 seconds
        
        if (secondsRemaining <= 0) {
          setTimeLeft(0);
          clearInterval(timer);
          if (step === 2 && !isTokenVerified) {
            toast.error("Verification code expired. Please request a new one.");
          }
        } else {
          setTimeLeft(secondsRemaining);
        }
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tokenRequestedAt, step, isTokenVerified]);

  const formatTimeLeft = (seconds) => {
    if (seconds === null) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRequestToken = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
  
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/staff/forgot-password/`, { email });
      toast.success("Verification code sent to your email!");
      setTokenRequestedAt(new Date());
      setStep(2);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error === "Invalid email format") {
        toast.error("Invalid email address. Please enter a valid email.");
      } else {
        toast.error(error.response?.data?.error || "Error sending verification code");
      }
    } finally {
      setLoading(false);
    }
  };
  

  const handleVerifyToken = async (values, { setSubmitting }) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/staff/verify-token/`, {
        email,
        token: values.token,
      });
      toast.success("Verification successful! Enter your new password.");
      setIsTokenVerified(true);
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid or expired verification code");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (values, { setSubmitting }) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/staff/reset-password/`, {
        email,
        token: values.token,
        password: values.new_password,
      });
      toast.success("Password reset successful! You can now log in with your new password.");
      setTimeout(() => {
        navigate("/stafflogin");
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error resetting password");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 2 && !isTokenVerified) {
      setStep(1);
    } else if (isTokenVerified) {
      setIsTokenVerified(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-gray-50">
      {loading && <Loader message="Processing your request..." />}
      <ToastContainer position="top-center" autoClose={5000} />
      
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#111933] mb-1">Reset Password</h2>
          <p className="text-gray-600 text-sm">
            {step === 1 ? "Enter your email to receive a verification code" : 
             !isTokenVerified ? `Enter your verification code sent to ${email}` :
             "Create your new password"}
          </p>
        </div>
        
        {step > 1 && (
          <button 
            onClick={goBack}
            className="flex items-center text-[#111933] mb-4 hover:underline"
          >
            <FaArrowLeft className="mr-1" /> Back
          </button>
        )}
        
        {step === 1 ? (
          <div className="space-y-6">
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-semibold text-[#111933] mb-1">
                Email Address
              </label>
              <div className="flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-[#111933] focus-within:border-[#111933]">
                <span className="pl-4 text-gray-500">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-3 outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            <button
              onClick={handleRequestToken}
              className="w-full bg-[#111933] text-white py-3 rounded-lg hover:bg-[#12204b] transition-colors duration-300 font-semibold"
            >
              Verify Email ID
            </button>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Remember your password? <a href="/stafflogin" className="text-[#111933] font-semibold hover:underline">Log In</a>
              </p>
            </div>
          </div>
        ) : (
          <Formik
            initialValues={{ token: "", new_password: "", confirm_password: "" }}
            validationSchema={isTokenVerified ? ResetPasswordSchema : TokenVerificationSchema}
            onSubmit={isTokenVerified ? handleResetPassword : handleVerifyToken}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded">
                  <div className="flex">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Email: </span>{email}
                    </p>
                  </div>
                </div>

{!isTokenVerified && (
  <div>
    <div className="flex justify-between items-center">
      <label htmlFor="token" className="block text-sm font-semibold text-[#111933] mb-1">
        Verification Code
      </label>
      {timeLeft !== null && (
        <span className={`text-xs font-medium ${timeLeft > 60 ? 'text-green-600' : 'text-red-600'}`}>
          Expires in: {formatTimeLeft(timeLeft)}
        </span>
      )}
    </div>
    <div className="relative">
      <div className="flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-[#111933] focus-within:border-[#111933]">
        <span className="pl-4 text-gray-500">
          <FaKey />
        </span>
        <Field
          type="text"
          id="token"
          name="token"
          className="w-full px-3 py-3 outline-none"
          placeholder="Enter 6-digit verification code"
          maxLength={6}
        />
      </div>
      <ErrorMessage name="token" component="div" className="text-red-500 text-sm mt-1" />
    </div>
    <p className="text-xs text-gray-500 mt-2">
      Enter the 6-digit verification code sent to your email. The code is valid for 5 minutes.
    </p>
    
    <div className="flex items-center justify-between mt-2">
      <button 
        type="button" 
        onClick={handleRequestToken}
        disabled={loading || (timeLeft && timeLeft > 270)} // Disable for first 30 seconds
        className={`text-sm text-[#111933] hover:underline flex items-center ${loading || (timeLeft && timeLeft > 270) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {timeLeft && timeLeft > 270 ? `Resend available in ${300 - timeLeft}s` : 'Resend code'}
      </button>
    </div>
    
    <button
      type="submit"
      disabled={isSubmitting || timeLeft === 0}
      className={`mt-4 w-full py-3 rounded-lg font-semibold text-white
        ${timeLeft === 0 ? 
          'bg-gray-400 cursor-not-allowed' : 
          'bg-[#111933] hover:bg-[#12204b] transition-colors duration-300'}`}
    >
      {timeLeft === 0 ? 'Code Expired' : 'Verify Code'}
    </button>
    {timeLeft === 0 && (
      <button
        type="button"
        onClick={handleRequestToken}
        className="mt-3 w-full bg-white border border-[#111933] text-[#111933] py-3 rounded-lg hover:bg-gray-50"
      >
        Request New Code
      </button>
    )}
  </div>
)}

                {isTokenVerified && (
                  <>
                    <div>
                      <label htmlFor="new_password" className="block text-sm font-semibold text-[#111933] mb-1">
                        New Password
                      </label>
                      <div className="flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-[#111933] focus-within:border-[#111933]">
                        <span className="pl-4 text-gray-500">
                          <FaLock />
                        </span>
                        <Field
                          type="password"
                          id="new_password"
                          name="new_password"
                          className="w-full px-3 py-3 outline-none"
                          placeholder="Enter new password"
                        />
                      </div>
                      <ErrorMessage name="new_password" component="div" className="text-red-500 text-sm mt-1" />
                      <div className="mt-2 text-xs text-gray-600">
                        <p>Password must:</p>
                        <ul className="list-disc pl-5 space-y-1 mt-1">
                          <li>Be at least 8 characters long</li>
                          <li>Contain at least one uppercase letter</li>
                          <li>Contain at least one lowercase letter</li>
                          <li>Contain at least one number</li>
                          <li>Contain at least one special character</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="confirm_password" className="block text-sm font-semibold text-[#111933] mb-1">
                        Confirm Password
                      </label>
                      <div className="flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-[#111933] focus-within:border-[#111933]">
                        <span className="pl-4 text-gray-500">
                          <FaLock />
                        </span>
                        <Field
                          type="password"
                          id="confirm_password"
                          name="confirm_password"
                          className="w-full px-3 py-3 outline-none"
                          placeholder="Re-enter new password"
                        />
                      </div>
                      <ErrorMessage name="confirm_password" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-6 w-full bg-[#111933] text-white py-3 rounded-lg hover:bg-[#12204b] transition-colors duration-300 font-semibold"
                    >
                      Reset Password
                    </button>
                  </>
                )}
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;