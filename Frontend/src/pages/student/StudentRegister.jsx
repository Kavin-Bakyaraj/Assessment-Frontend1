import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUpload, FaDownload, FaExclamationTriangle } from 'react-icons/fa';

const StudentRegister = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    collegename: '',
    dept: '',
    regno: '',
    year: '',
    phone: '', // Added phone field
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState('');
  const [uploadResults, setUploadResults] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const dataToSubmit = {
        ...formData,
        regno: String(formData.regno)
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/student/signup/`, dataToSubmit);

      if (response.status === 201) {
        setSuccess('Registration successful! Please log in.');
        setTimeout(() => {
          navigate('/StudentLogin');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response && error.response.data) {
        // Display the exact error message from the backend
        setError(error.response.data.error || 'Registration failed. Please try again.');
        
        // Highlight the problematic field
        if (error.response.data.error && error.response.data.error.includes("Email already exists")) {
          document.getElementById('email').classList.add('border-red-500');
        } else if (error.response.data.error && error.response.data.error.includes("Registration number already exists")) {
          document.getElementById('regno').classList.add('border-red-500');
        } else if (error.response.data.error && error.response.data.error.includes("Phone number")) {
          document.getElementById('phone').classList.add('border-red-500');
        }
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  // Update the handleFileChange function to properly display error details
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset states
    setFileUploadError('');
    setUploadResults(null);
    setError('');
    setSuccess('');
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      setFileUploadError(`File type not supported: ${fileExtension}. Please upload a CSV or Excel file.`);
      return;
    }
    
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/student/bulk-signup/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadResults(response.data);
      
      if (response.data.success_count > 0) {
        setSuccess(`Successfully registered ${response.data.success_count} students.`);
      }
      
      if (response.data.error_count > 0) {
        // Don't set a generic error message here - let the errors array show the specific issues
        // We'll just show the count summary
        setFileUploadError(`${response.data.error_count} students failed to register.`);
      }
      
    } catch (error) {
      console.error('File upload error:', error);
      
      // IMPORTANT: For status 400 responses, the backend is still returning structured data
      // but it's in error.response.data instead of response.data
      if (error.response && error.response.status === 400) {
        // Handle structured error response with errors array
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          // We have a structured error response with specific errors
          setUploadResults(error.response.data);
          setFileUploadError(`Failed to register ${error.response.data.error_count} students.`);
        } 
        // Handle single error message
        else if (error.response.data.error) {
          setFileUploadError(error.response.data.error);
        } 
        else {
          setFileUploadError('Error in file upload. Please check your file format.');
        }
      } 
      // Handle other error types
      else if (error.response && error.response.data && error.response.data.error) {
        setFileUploadError(error.response.data.error);
      } 
      else if (error.message) {
        setFileUploadError(`Upload error: ${error.message}`);
      } 
      else {
        setFileUploadError('Something went wrong during file upload.');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    // Updated template to include the phone number field
    const csvData = `name,email,password,collegename,dept,regno,year,phone
John Doe,john.doe@example.com,password123,SNSCT,CSE,12345678,I,9876543210
Jane Smith,jane.smith@example.com,password456,SNSCT,IT,87654321,II,8765432109`;

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = 'student_registration_template.csv';
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">Student Register</h1>
        
        {/* Alert Messages */}
        {error && (
          <div className="mb-4 text-red-600 text-center p-3 bg-red-50 rounded-md border border-red-200 flex items-center justify-center">
            <FaExclamationTriangle className="mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-4 text-green-600 text-center p-3 bg-green-50 rounded-md border border-green-200">
            {success}
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex mb-6">
          <button 
            onClick={() => document.getElementById('singleRegister').scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 py-2 border-b-2 border-yellow-500 text-yellow-600 font-medium"
          >
            Single Registration
          </button>
          <button 
            onClick={() => document.getElementById('bulkUpload').scrollIntoView({ behavior: 'smooth' })}
            className="flex-1 py-2 border-b-2 border-gray-200 text-gray-600 font-medium hover:text-yellow-600 hover:border-yellow-400"
          >
            Bulk Upload
          </button>
        </div>
        
        {/* Single Registration Form */}
        <div id="singleRegister">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex flex-col">
              <label htmlFor="name" className="mb-1 text-sm font-medium text-gray-600">
                Name:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="collegename" className="mb-1 text-sm font-medium text-gray-600">
                College:
              </label>
              <input
                type="text"
                id="collegename"
                name="collegename"
                value={formData.collegename}
                onChange={handleChange}
                required
                className="px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="dept" className="mb-1 text-sm font-medium text-gray-600">
                Department:
              </label>
              <input
                type="text"
                id="dept"
                name="dept"
                value={formData.dept}
                onChange={handleChange}
                required
                className="px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="regno" className="mb-1 text-sm font-medium text-gray-600">
                Register No:
              </label>
              <input
                type="text"
                id="regno"
                name="regno"
                value={formData.regno}
                onChange={handleChange}
                required
                className="px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
                onClick={() => document.getElementById('regno').classList.remove('border-red-500')}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="year" className="mb-1 text-sm font-medium text-gray-600">
                Year:
              </label>
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                className="px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">Select Year</option>
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="email" className="mb-1 text-sm font-medium text-gray-600">
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
                onClick={() => document.getElementById('email').classList.remove('border-red-500')}
              />
            </div>
            {/* Add the phone field to the form */}
            <div className="flex flex-col">
              <label htmlFor="phone" className="mb-1 text-sm font-medium text-gray-600">
                Phone Number:
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit phone number"
                pattern="[0-9]{10}"
                title="Phone number should be 10 digits"
                className="px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
                onClick={() => document.getElementById('phone').classList.remove('border-red-500')}
              />
              <span className="text-xs text-gray-500 mt-1">Format: 10 digits with no spaces or dashes</span>
            </div>
            <div className="flex flex-col">
              <label htmlFor="password" className="mb-1 text-sm font-medium text-gray-600">
                Password:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="px-3 py-2 border rounded-md shadow-sm border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 text-white bg-yellow-600 hover:bg-yellow-700 rounded-md text-lg font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              Register
            </button>
          </form>
        </div>
        
        {/* Bulk Upload Section */}
        <div id="bulkUpload" className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Student Registration</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV or Excel file with student details.
            <button 
              onClick={downloadTemplate}
              className="ml-2 text-yellow-600 hover:text-yellow-700 inline-flex items-center"
            >
              <FaDownload className="mr-1" /> Download Template
            </button>
          </p>
          
          {fileUploadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              <div className="flex items-center mb-1">
                <FaExclamationTriangle className="mr-2" /> 
                <strong>Error:</strong>
              </div>
              <div>{fileUploadError}</div>
            </div>
          )}
          
          <div className="flex flex-col items-center justify-center bg-gray-50 py-5 rounded-lg border-2 border-dashed border-gray-300 mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls"
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              <div className="flex flex-col items-center justify-center">
                <FaUpload className="text-3xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload file</p>
                <p className="text-xs text-gray-400">(CSV or Excel)</p>
              </div>
            </label>
            {isUploading && (
              <div className="mt-3 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-600 mr-2"></div>
                <span className="text-sm text-yellow-600">Uploading... Please wait.</span>
              </div>
            )}
          </div>
          
          {/* Upload Results with error details prominently displayed */}
          {uploadResults && uploadResults.errors && uploadResults.errors.length > 0 && (
            <div className="mt-4 mb-4">
              <h3 className="font-semibold text-red-600 mb-2 flex items-center">
                <FaExclamationTriangle className="mr-1" /> Issues Found:
              </h3>
              
              <div className="max-h-60 overflow-y-auto border border-red-200 rounded-md">
                {uploadResults.errors.map((error, index) => (
                  <div 
                    key={index} 
                    className={`p-3 border-b border-red-100 ${index % 2 === 0 ? 'bg-red-50' : 'bg-white'}`}
                  >
                    <div className="font-medium text-gray-700">Row {error.row}</div>
                    <div className="text-red-600">{error.error}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Summary stats */}
          {uploadResults && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-md border ${uploadResults.success_count > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-sm text-gray-500">Successful:</div>
                <div className={`text-xl font-bold ${uploadResults.success_count > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {uploadResults.success_count}
                </div>
              </div>
              <div className={`p-3 rounded-md border ${uploadResults.error_count > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-sm text-gray-500">Errors:</div>
                <div className={`text-xl font-bold ${uploadResults.error_count > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {uploadResults.error_count}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-sm text-gray-600 text-center">
          Already Registered? <Link to="/StudentLogin" className="text-yellow-600 hover:text-yellow-700">Login..</Link>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;