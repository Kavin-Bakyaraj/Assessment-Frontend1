import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ChevronRight } from "lucide-react";
import bg from '../../../assets/bgpattern.svg';

// --- AssessmentOverviewForm Component ---
const AssessmentOverviewForm = ({ formData, handleChange, errors }) => {
  const today = new Date();
  const minDate = today.toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  const minDateTime = today.toISOString().slice(0, 16); // Get today's date and time in YYYY-MM-DDTHH:MM format

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-2 text-[#111933]">Assessment Overview</h3>
      <p className="text-sm">This section captures essential information about the test. Ensure clarity and completeness.</p>
      <hr className="my-4" />
      <div className="flex w-full gap-10 justify-stretch">
        <div className="flex flex-col w-1/2 space-y-5">
          {/* Assessment Name */}
          <div className="space-y-2">
            <label className="text-md font-semibold text-[#111933] mb-2 flex items-center">
              Assessment Name *
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                maxLength="30"
                value={formData.assessmentOverview.name}
                onChange={(e) => handleChange(e, "assessmentOverview")}
                className={`block w-full h-12 py-2 px-4 bg-white border rounded-[10px] ${errors.name ? "border-red-500" : ""
                  }`}
                placeholder="Enter the assessment name"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                {formData.assessmentOverview.name.length}/30
              </span>
            </div>
            {errors.name && <p className="text-red-500">{errors.name}</p>}
          </div>

          {/* Registration Dates */}
          <div className="space-y-2">
            <label className="text-md font-semibold text-[#111933]">Registration Start *</label>
            <input
              type="datetime-local"
              name="registrationStart"
              value={formData.assessmentOverview.registrationStart || ""}
              className="w-full h-12 px-4 border rounded-lg bg-gray-100 cursor-not-allowed"
              disabled
              min={minDateTime} // Set the minimum date and time to today
            />
          </div>

          <div className="space-y-2">
            <label className="text-md font-semibold text-[#111933]">Registration End *</label>
            <input
              type="datetime-local"
              name="registrationEnd"
              value={formData.assessmentOverview.registrationEnd || ""}
              onChange={(e) => handleChange(e, "assessmentOverview")}
              className="w-full h-12 px-4 border rounded-lg"
              min={minDateTime} // Set the minimum date and time to today
            />
          </div>
        </div>
        <div className="flex flex-col w-1/2 justify-between">
          {/* Description */}
          <div className="space-y-2">
            <label className="text-md font-semibold text-[#111933] mb-2 flex items-center">Description *</label>
            <div className="relative">
              <textarea
                name="description"
                value={formData.assessmentOverview.description}

                // For description field - limit each word to 25 characters
                onChange={(e) => {
                  let inputText = e.target.value;

                  // Split into words
                  const words = inputText.split(/\s+/).filter(Boolean);

                  // Process the words: limit length of each word and the total number of words
                  let processedWords = [];
                  for (let i = 0; i < Math.min(words.length, 30); i++) {
                    // Add each word, trimmed to 25 characters if needed
                    let word = words[i];
                    if (word.length > 25) {
                      word = word.substring(0, 25);
                    }
                    processedWords.push(word);
                  }

                  // Rejoin with spaces
                  const processedText = processedWords.join(" ");

                  // If the last character in the original input was a space, preserve it
                  // This allows typing the next word
                  if (inputText.endsWith(" ") && processedWords.length < 30) {
                    handleChange({ target: { name: "description", value: processedText + " " } }, "assessmentOverview");
                  } else {
                    handleChange({ target: { name: "description", value: processedText } }, "assessmentOverview");
                  }
                }}
                rows={4}
                className={`block w-full p-4  rounded-[10px] border resize-none ${errors.description ? "border-red-500" : ""
                  }`}
                placeholder="Provide a brief overview of the assessment (max 30 words)"
              />
              <span className="absolute right-2 bottom-2 text-gray-500 text-sm">
                {formData.assessmentOverview.description.split(/\s+/).filter(Boolean).length}/30 words
              </span>
            </div>
            {errors.description && <p className="text-red-500">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-md font-semibold text-[#111933]">Guidelines</label>
            <div className="relative">
              <textarea
                name="guidelines"
                value={formData.assessmentOverview.guidelines || ""}
                onChange={(e) => {
                  let inputText = e.target.value;

                  // Match words and preserve spaces
                  const words = inputText.match(/\S+|\s+/g) || [];

                  // Process words: limit length of each word and total number of words
                  let processedWords = [];
                  let wordCount = 0;

                  for (let word of words) {
                    if (!/\s/.test(word)) { // If it's a word
                      if (word.length > 25) word = word.substring(0, 25); // Trim long words
                      wordCount++;
                      if (wordCount > 150) break; // Stop at 150 words
                    }
                    processedWords.push(word);
                  }

                  const processedText = processedWords.join("");

                  // If the last character in the original input was a space, preserve it
                  // This allows typing spaces even after reaching the word limit
                  if (inputText.endsWith(" ") && wordCount >= 150) {
                    handleChange({ target: { name: "guidelines", value: processedText + " " } }, "assessmentOverview");
                  } else {
                    handleChange({ target: { name: "guidelines", value: processedText } }, "assessmentOverview");
                  }
                }}
                className="w-full h-24 px-4 border rounded-lg resize-none"
              />
              <span className="absolute right-2 bottom-2 text-gray-500 text-sm">
                {formData.assessmentOverview.guidelines.split(/\S+/).filter(Boolean).length}/150 words
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const TestConfigurationForm = ({ formData, setFormData, handleChange, errors, handleInputChange }) => (
  <div>
    <h3 className="text-xl font-semibold mb-2 text-[#111933]">Test Configuration</h3>
    <p className="text-sm">This section captures essential information about the test. Ensure clarity and completeness.</p>
    <hr className="my-4" />

    {/* Conditionally render fields based on sectionDetails */}
    {formData.assessmentOverview.sectionDetails === "No" && (
      <div className="grid grid-cols-3 gap-8 mb-4">
        {/* Number of Questions */}
        <div className="space-y-2">
          <label className="text-md font-semibold text-[#111933]">Number of Questions *</label>
          <input
            type="text"
            name="questions"
            value={formData.testConfiguration.questions || ""}
            className="w-full h-12 px-4 border rounded-lg bg-gray-100 cursor-not-allowed"
            disabled
          />
          {errors.questions && <p className="text-red-500">{errors.questions}</p>}
        </div>

        {/* Total Marks */}
        <div className="space-y-2">
          <label className="text-md font-semibold text-[#111933]">Total Marks *</label>
          <input
            type="text"
            name="totalMarks"
            value={formData.testConfiguration.totalMarks || ""}
            className="w-full h-12 px-4 border rounded-lg bg-gray-100 cursor-not-allowed"
            disabled
          />
          {errors.totalMarks && <p className="text-red-500">{errors.totalMarks}</p>}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-md font-semibold text-[#111933] flex-1">Duration *</label>
          <div className="w-full flex items-center space-x-2">
            {/* Hours Input */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="hours"
              value={formData.testConfiguration.duration.hours || ""}
              onChange={(e) => {
                let onlyNums = e.target.value.replace(/[^0-9]/g, "");
                if (onlyNums.length > 2) onlyNums = onlyNums.slice(0, 2); // Limit to 2 digits

                handleChange(
                  {
                    target: {
                      name: "duration",
                      value: {
                        hours: onlyNums,
                        minutes: formData.testConfiguration.duration.minutes,
                      },
                    },
                  },
                  "testConfiguration"
                );
              }}
              className={`w-1/2 h-12 px-4 border rounded-lg text-sm text-center ${errors.duration ? "border-red-500" : ""
                }`}
              placeholder="HH"
            />
            <span>:</span>

            {/* Minutes Input */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="minutes"
              value={formData.testConfiguration.duration.minutes || ""}
              onChange={(e) => {
                let onlyNums = e.target.value.replace(/[^0-9]/g, "");
                if (onlyNums.length > 2) onlyNums = onlyNums.slice(0, 2); // Limit to 2 digits
                if (Number.parseInt(onlyNums) > 59) onlyNums = "59"; // Max 59 minutes

                handleChange(
                  {
                    target: {
                      name: "duration",
                      value: {
                        hours: formData.testConfiguration.duration.hours,
                        minutes: onlyNums,
                      },
                    },
                  },
                  "testConfiguration"
                );
              }}
              className={`w-1/2 h-12 px-4 border rounded-lg text-sm text-center ${errors.duration ? "border-red-500" : ""
                }`}
              placeholder="MM"
            />
          </div>
        </div>

      </div>
    )}

    <div className="grid grid-cols-3 gap-8 mb-4">
      {/* Pass Percentage - Always Shown */}
      <div className="space-y-2">
        <label className="text-md font-semibold text-[#111933]">Pass Percentage *</label>
        <input
          type="text"
          name="passPercentage"
          value={formData.testConfiguration.passPercentage || ""}
          onChange={(e) => handleChange(e, "testConfiguration")}
          className="w-full h-12 px-4 border rounded-lg"
        />
        {errors.passPercentage && <p className="text-red-500">{errors.passPercentage}</p>}
      </div>

      {/* Result Visibility - Always Shown */}
      <div className="space-y-2">
        <label className="text-md font-semibold text-[#111933]">Result Visibility *</label>
        <select
          name="resultVisibility"
          value={formData.testConfiguration.resultVisibility || ""}
          onChange={(e) => handleChange(e, "testConfiguration")}
          className="w-full h-12 px-4 border rounded-lg"
        >
          <option value="">Select</option>
          <option value="Immediate release">Immediate release</option>
          <option value="Host Control">Host Control</option>
        </select>
        {errors.resultVisibility && <p className="text-red-500">{errors.resultVisibility}</p>}
      </div>
      {/* shuffle questions */}
      <div className="space-y-2">
        <label className="text-md font-semibold text-[#111933] flex-1">Shuffle Options *</label>
        <select
          name="shuffleType"
          value={formData.testConfiguration.shuffleType || ""}
          onChange={(e) => handleChange(e, "testConfiguration")}
          className="w-full h-12 px-4 border rounded-lg text-sm"
        >
          <option value="">Select</option>
          <option value="questions">Questions</option>
          <option value="options">Options</option>
          <option value="both">Both</option>
        </select>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-[#111933] mb-2">Proctoring Enablement</h3>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Full Screen Mode", name: "fullScreenMode" },
          { label: "Face Detection", name: "faceDetection" },
          { label: "Noise Detection", name: "noiseDetection" },
          { label: "Device Restriction", name: "deviceRestriction" },
        ].map((item) => (
          <div key={item.name} className="flex flex-col space-y-5">
            <div className="flex items-center justify-between p-2 border rounded-[10px]">
              <span className="text-sm font-medium text-[#111933]">{item.label}</span>
              <label
                className="relative inline-flex items-center cursor-pointer"
                style={{
                  cursor: item.name === "faceDetection" || item.name === "noiseDetection" ? "not-allowed" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  name={item.name}
                  checked={formData.testConfiguration[item.name] || false}
                  onChange={(e) => handleInputChange(e, "testConfiguration")}
                  className="sr-only peer"
                  disabled={item.name === "faceDetection" || item.name === "noiseDetection"}
                />
                <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${formData.testConfiguration[item.name] ? 'bg-[#111933]' : 'bg-gray-200'
                  }`}></div>
              </label>
            </div>
            <div className="h-10">
              {formData.testConfiguration[item.name] && item.name !== "deviceRestriction" ? (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name={`${item.name}Count`}
                  value={formData.testConfiguration[`${item.name}Count`] || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9]/g, "");
                    if (value !== "") {
                      const numValue = parseInt(value, 10);
                      if (numValue < 1) value = "1";
                      if (numValue > 200) value = "200";
                    }
                    setFormData(prev => ({
                      ...prev,
                      testConfiguration: {
                        ...prev.testConfiguration,
                        [`${item.name}Count`]: value
                      }
                    }));
                    sessionStorage.setItem("mcqAssessmentFormData", JSON.stringify({
                      ...formData,
                      testConfiguration: {
                        ...formData.testConfiguration,
                        [`${item.name}Count`]: value
                      }
                    }));
                  }}
                  className={`w-full p-2 border rounded-[10px] text-sm ${errors[`${item.name}Count`] ? "border-red-500" : ""}`}
                  placeholder={`Number of restrictions *`}
                  required
                />
              ) : (
                <div className="w-full p-2 border rounded-[10px] text-sm opacity-0">Placeholder</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const EditTest = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const [formData, setFormData] = useState({
    assessmentOverview: {
      name: "",
      description: "",
      registrationStart: "",
      registrationEnd: "",
      guidelines: "",
      sectionDetails: "No",
      timingType: "", // Ensure timingType is initialized
    },
    testConfiguration: {
      totalMarks: "",
      questions: "",
      duration: { hours: "", minutes: "" },
      passPercentage: "",
      resultVisibility: "",
      fullScreenMode: false,
      faceDetection: false,
      deviceRestriction: false,
      noiseDetection: false,
      shuffleQuestions: false,
      shuffleOptions: false,
      shuffleType: "", // Initialize with default value
      fullScreenModeCount: 0, // Initialize with default value
      faceDetectionCount: 0, // Initialize with default value
      noiseDetectionCount: 0, // Initialize with default value
    },
  });

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/contests/${contestId}/`);
        const data = response.data;

        // Ensure timingType is included in the fetched data
        if (!data.assessmentOverview.hasOwnProperty('timingType')) {
          data.assessmentOverview.timingType = "";
        }

        // Derive shuffleType from shuffleQuestions and shuffleOptions
        if (data.testConfiguration.shuffleQuestions && data.testConfiguration.shuffleOptions) {
          data.testConfiguration.shuffleType = "both";
        } else if (data.testConfiguration.shuffleQuestions) {
          data.testConfiguration.shuffleType = "questions";
        } else if (data.testConfiguration.shuffleOptions) {
          data.testConfiguration.shuffleType = "options";
        } else {
          data.testConfiguration.shuffleType = "";
        }

        setFormData(data); // Populate form with fetched data
      } catch (error) {
        toast.error("Failed to fetch test details.");
        console.error("Error fetching test details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetails();
  }, [contestId]);

  const handleChange = (e, section) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;

    if (name === "passPercentage") {
      newValue = Math.min(Number(value), 100); // Restrict value to 100
    }

    setFormData((prev) => {
      const updatedSection = {
        ...prev[section],
        [name]: name === "duration" ? { ...prev[section].duration, ...newValue } : newValue,
      };

      // Handle shuffleType logic
      if (name === "shuffleType") {
        updatedSection.shuffleQuestions = value === "questions" || value === "both";
        updatedSection.shuffleOptions = value === "options" || value === "both";
      }

      return { ...prev, [section]: updatedSection };
    });

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleInputChange = (e, step) => {
    const { name, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [step]: {
        ...prevData[step],
        [name]: type === "checkbox" ? checked : e.target.value,
      },
    }));
  };

  const validateForm = (step) => {
    const newErrors = {};

    if (step === 1) {
      const { name, description, registrationStart, registrationEnd, guidelines } = formData.assessmentOverview;
      if (!name) newErrors.name = "Assessment name is required.";
      if (!description) newErrors.description = "Description is required.";
      if (!registrationStart) newErrors.registrationStart = "Start date is required.";
      if (!registrationEnd) newErrors.registrationEnd = "End date is required.";
      if (!guidelines) newErrors.guidelines = "Guidelines are required.";
    } else if (step === 2) {
      const { passPercentage, resultVisibility } = formData.testConfiguration;
      if (!passPercentage) newErrors.passPercentage = "Pass percentage is required.";
      if (!resultVisibility) newErrors.resultVisibility = "Result visibility is required.";

      // Add validation for section-specific fields
      if (formData.assessmentOverview.sectionDetails === "No") {
        const { totalMarks, questions, duration } = formData.testConfiguration;
        if (!totalMarks) newErrors.totalMarks = "Total marks are required.";
        if (!questions) newErrors.questions = "Number of questions is required.";
        if (!duration.hours && !duration.minutes) newErrors.duration = "Duration is required.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    const currentTime = new Date();
    const registrationEndTime = new Date(formData.assessmentOverview.registrationEnd);

    if (registrationEndTime < currentTime) {
      toast.warning("Registration end time should be greater than the current time.");
      setErrors((prevErrors) => ({
        ...prevErrors,
        registrationEnd: "Registration end time should be greater than the current time.",
      }));
      return;
    }

    if (validateForm(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.warning("Please fill all required fields in this step.");
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(currentStep)) {
      toast.warning("Please fill all required fields.");
      return;
    }

    // Create a copy of formData to manipulate
    let payload = { ...formData };

    // If sectionDetails is "No", remove timingType from the payload
    if (payload.assessmentOverview.sectionDetails === "No") {
      delete payload.assessmentOverview.timingType;
    }

    console.log("Payload being sent:", payload); // Log the payload for debugging

    try {
      // Send the PUT request to update the test
      const response = await axios.put(
        `${API_BASE_URL}/api/mcq/update-assessment/${contestId}/`,
        payload,
        { withCredentials: true } // Ensure authentication cookies are sent
      );

      if (response.status === 200) {
        toast.success("Test updated successfully! Redirecting...", {
          autoClose: 2000, // Keep message for 2 seconds before redirection
        });

        // Redirect after 2 seconds to allow the message to be seen
        setTimeout(() => {
          navigate(`/viewtest/${contestId}`);
        }, 2000);
      } else if (response.data.message === "No changes were applied") {
        toast.info("No changes were made.");
      }
    } catch (error) {
      console.error("Error updating test:", error); // Log the error
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate('/staff-login'); // Redirect to login page
      } else {
        toast.error(error.response?.data?.message || "Failed to update test.");
      }
    }
  };


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-hidden py-36 pt-28"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}>
      <div className="w-full px-24  h-full">
        <div className="h-14 py-4">
          <div className="flex items-center gap-2 text-[#111933] text-sm ml-2">
            <span className="opacity-60" >Home</span>
            <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
            <span className="opacity-60">Edit Test</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-white rounded-lg p-7 lg:px-20 overflow-auto">
            <h2 className="text-2xl font-bold mb-4 text-[#111933]">Edit Test</h2>
            <form onSubmit={handleSubmit}>
              {currentStep === 1 && (
                <AssessmentOverviewForm formData={formData} handleChange={handleChange} errors={errors} />
              )}

              {currentStep === 2 && (
                <TestConfigurationForm formData={formData} setFormData={setFormData} handleChange={handleChange} errors={errors} handleInputChange={handleInputChange} />
              )}

              <div className={`mt-6 flex ${currentStep < 2 ? 'justify-end' : 'justify-between'}`}>
                {currentStep > 1 && (
                  <button type="button" onClick={prevStep} className="bg-[#111933] text-white px-4 py-2 rounded-lg">
                    Previous
                  </button>
                )}

                {currentStep < 2 && (
                  <button type="button" onClick={nextStep} className="bg-[#111933] text-white px-4 py-2 rounded-lg">
                    Next
                  </button>
                )}

                {currentStep === 2 && (
                  <button type="submit" className="bg-[#111933] text-white px-4 py-2 rounded-lg"
                    onClick={handleSubmit}>
                    Update Test
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default EditTest;
