import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Loader from '../../layout/Loader';
import { User, Mail, Lock, ArrowRight, Phone } from 'lucide-react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify'; // Import toast
import 'react-toastify/dist/ReactToastify.css'; // Import CSS

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  department: Yup.array()
    .min(1, 'Select at least one department')
    .required('Required'),  // Change to array type
  role: Yup.string().required('Required'),
  collegename: Yup.string().required('Required'),
  phoneno: Yup.string()
   .matches(/^[0-9]{10}$/, 'Invalid phone number')
   .required('Required'),
    
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required'),
});

// Define department options
const departmentOptions = [
  { value: 'AIDS', label: 'AI&DS' },
  { value: 'AIML', label: 'AI&ML' },
  { value: 'IT', label: 'IT' },
  { value: 'CSE', label: 'CSE' },
  { value: 'CST', label: 'CST' },
  { value: 'CSD', label: 'CSD' },
  { value: 'MECH', label: 'MECH' },
  { value: 'CIVIL', label: 'CIVIL' },
  { value: 'ECE', label: 'ECE' },
  { value: 'EEE', label: 'EEE' },
  { value: 'MECHATRONICS', label: 'MECHATRONICS' },
  { value: 'AERO', label: 'AERO' },
  { value: 'OTHERS', label: 'OTHERS' },
];

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setIsLoading(true);
  
    try {
      // Process department selection - if it's an array of objects, convert to array of strings
      const departmentValue = Array.isArray(values.department) 
        ? values.department.map ? values.department.map(dept => typeof dept === 'object' ? dept.value : dept) : values.department 
        : [values.department];
      
      const payload = {
        name: values.name,
        email: values.email,
        department: departmentValue.join(', '), // Join array for backend compatibility
        collegename: values.collegename,
        password: values.password,
        phoneno: values.phoneno,
        role: values.role,
      };
  
      const response = await axios.post(`${API_BASE_URL}/api/staff/signup/`, payload);
  
      if (response.status === 201) {
        // Show success toast
        toast.success("Signup successful! Redirecting to login...");
        
        // Navigate after a slight delay for toast to be visible
        setTimeout(() => {
          navigate('/stafflogin');
        }, 2000);
      }
    } catch (error) {
      // Handle different error types with toast notifications
      if (error.response) {
        const errorMessage = error.response.data.error;
        
        // Department already has HOD assigned
        if (errorMessage && errorMessage.includes("Department")) {
          toast.error(errorMessage);
        }
        // College already has Principal assigned
        else if (errorMessage && errorMessage.includes("College")) {
          toast.error(errorMessage);
        }
        // Email already exists
        else if (errorMessage && errorMessage.includes("Email already exists")) {
          toast.error("An account with this email already exists");
        }
        // Other API errors
        else {
          toast.error(errorMessage || "Registration failed. Please try again.");
        }
        
        setErrors({ submit: errorMessage || "Registration failed" });
      } else {
        // Network or unexpected errors
        toast.error("Connection error. Please check your internet and try again.");
        setErrors({ submit: "Connection error" });
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-16">
          <ToastContainer position="top-center" autoClose={5000} />
      <style>
        {`
          .error-message {
            color: #fdc500;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            font-weight: 500;
          }
        `}
      </style>

      {isLoading && <Loader message="Creating your account..." />}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-32 -left-32 h-[450px] w-[450px] animate-pulse-slow rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute top-0 right-0 h-[500px] w-[500px] animate-pulse-slow rounded-full bg-gradient-to-tr from-blue-100 to-blue-150 blur-3xl" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 mx-auto w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="w-full p-12">
          <motion.div variants={itemVariants} className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-800">SNS INSTITUTIONS</h1>
            <h4 className="text-lg font-medium text-gray-600 mt-4">Create Your Account</h4>
          </motion.div>

          <Formik
            initialValues={{
              name: '',
              email: '',
              department: [],
              collegename: '',
              role: '',
              phoneno: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, setFieldValue, values }) => (
              <Form className="space-y-8">
                {errors.submit && (
                  <div className="mb-6 text-red-600 text-center">
                    {errors.submit}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 h-5 w-5 text-gray-400" />
                    <Field
                      id="name"
                      name="name"
                      type="text"
                      className="block w-full rounded-xl border border-gray-200 bg-blue-50 py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <ErrorMessage name="name" component="div" className="error-message" />
                </div>

                <div>
                  <label htmlFor="collegename" className="mb-2 block text-sm font-medium text-gray-700">
                    College Name
                  </label>
                  <Field
                    as="select"
                    id="collegename"
                    name="collegename"
                    className="block w-full rounded-xl border border-gray-200 bg-blue-50 py-3 px-4 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select College</option>
                    <option value="SNSCE">SNSCE</option>
                    <option value="SNSCT">SNSCT</option>
                    <option value="SNS Nursing">SNS Nursing</option>
                    <option value="SNS ARTS">SNS ARTS</option>
                    <option value="SNS Spine">SNS Spine</option>
                    <option value="SNS Pharmacy">SNS Pharmacy</option>
                    <option value="SNS Physiotherapy">SNS Physiotherapy</option>
                    <option value="SNS Health Science">SNS Health Science</option>
                    <option value="SNS Academy">SNS Academy</option>
                  </Field>
                  <ErrorMessage name="collegename" component="div" className="error-message" />
                </div>

                <div>
                  <label htmlFor="department" className="mb-2 block text-sm font-medium text-gray-700">
                    Department(s)
                  </label>
                  <Select
                    id="department"
                    name="department"
                    isMulti
                    options={departmentOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    value={departmentOptions.filter(option => values.department.includes(option.value))}
                    onChange={(selectedOptions) => {
                      const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
                      setFieldValue('department', selectedValues);
                    }}
                  />
                  <ErrorMessage name="department" component="div" className="error-message" />
                </div>

                <div>
                  <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <Field
                    as="select"
                    id="role"
                    name="role"
                    className="block w-full rounded-xl border border-gray-200 bg-blue-50 py-3 px-4 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select Role</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Principal">Prinicipal</option>
                    <option value="HOD">Head Of the Department</option>
                    <option value="Staff">Staff</option>
                  </Field>
                  <ErrorMessage name="role" component="div" className="error-message" />
                </div>

                <div>
                <label htmlFor="phoneno" className="mb-2 block text-sm font-medium text-gray-700">
                  
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 h-5 w-5 text-gray-400" />
                  <Field
                    id="phoneno"
                    name="phoneno"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    onKeyDown={(e) => {
                      if (e.key === 'e' || e.key==='E' ||e.key==='+'|| e.key==='-') {
                        e.preventDefault();
                      }
                    }}
                    className="block w-full rounded-xl border border-gray-200 bg-blue-50 py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter your phone number"
                  />
                </div>
                <ErrorMessage name="phoneno" component="div" className="error-message" />
              </div>




                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 h-5 w-5 text-gray-400" />
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      className="block w-full rounded-xl border border-gray-200 bg-blue-50 py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <ErrorMessage name="email" component="div" className="error-message" />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="block w-full rounded-xl border border-gray-200 bg-blue-50 py-3 pl-12 pr-12 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="div" className="error-message" />
                </div>


                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-5 w-5 text-gray-400" />
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="block w-full rounded-xl border border-gray-200 bg-blue-50 py-3 pl-12 pr-12 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Confirm your password"
                    />
                  </div>
                  <ErrorMessage name="confirmPassword" component="div" className="error-message" />
                </div>

                <motion.div variants={itemVariants} className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 text-white bg-blue-600 rounded-xl text-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Create Account
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                </motion.div>

                <motion.p
                  variants={itemVariants}
                  className="mt-6 text-center text-xs text-gray-500"
                >
                  Already have an account?{' '}
                  <Link
                    to="/stafflogin"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign in here
                  </Link>
                </motion.p>
              </Form>
            )}
          </Formik>
        </div>
      </motion.div>
    </div>
  );
}