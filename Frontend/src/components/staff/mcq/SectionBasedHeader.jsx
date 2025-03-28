import React, { useState, useEffect, useRef } from "react";
import clock from "../../../assets/Clock.svg";

export default function SectionBasedHeader({ 
  contestId, 
  totalDuration, 
  sectionRemainingTime, 
  timingType = "Section",
  isFinished = false // Add a prop to control timer stopping
}) {
  const [displayTime, setDisplayTime] = useState(0);
  const [testName, setTestName] = useState("MCQ ASSESSMENT");
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  
  useEffect(() => {
    // Get test name from localStorage
    try {
      const currentTest = localStorage.getItem('currentTest');
      if (currentTest) {
        const parsedTest = JSON.parse(currentTest);
        if (parsedTest && parsedTest.name) {
          setTestName(parsedTest.name);
        }
      }
    } catch (error) {
      console.error("Error fetching test name from localStorage:", error);
      // Keep default test name if there's an error
    }
    
    // Initialize the start time reference if not set
    if (!startTimeRef.current) {
      // Try to get the timer start time from session storage
      const savedStartTime = sessionStorage.getItem(`timerStartTime_${contestId}`);
      if (savedStartTime) {
        startTimeRef.current = parseInt(savedStartTime, 10);
      } else {
        // Set the current time as start time if none exists
        startTimeRef.current = Date.now();
        // Save to session storage for persistence across refreshes
        sessionStorage.setItem(`timerStartTime_${contestId}`, startTimeRef.current.toString());
      }
      
      // Initialize the total duration in session storage if not set
      const storedTotalDuration = sessionStorage.getItem(`totalDuration_${contestId}`);
      if (!storedTotalDuration && totalDuration) {
        sessionStorage.setItem(`totalDuration_${contestId}`, totalDuration.toString());
      }
    }
    
    // Initial update for timer
    updateDisplayTime();
    
    // Clean up any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Only set up the interval if the test is not finished
    if (!isFinished) {
      // Set up interval for continuous updates - run every second
      intervalRef.current = setInterval(updateDisplayTime, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [contestId, totalDuration, isFinished]);
  
  // Update display time function - uses elapsed time approach instead of countdown
  const updateDisplayTime = () => {
    // Get the stored total duration
    const storedTotalDuration = parseInt(sessionStorage.getItem(`totalDuration_${contestId}`) || totalDuration || 0, 10);
    
    if (storedTotalDuration <= 0) {
      setDisplayTime(0);
      return;
    }
    
    // Calculate elapsed time in seconds
    const elapsedMs = Date.now() - startTimeRef.current;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    
    // Calculate remaining time
    const remainingSeconds = Math.max(0, storedTotalDuration - elapsedSeconds);
    
    // Save current remaining time to session storage for persistence
    sessionStorage.setItem(`totalTimeLeft_${contestId}`, JSON.stringify(remainingSeconds));
    
    // Update the display time
    setDisplayTime(remainingSeconds);
    
    // If time's up, stop the timer
    if (remainingSeconds <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
  
  // Format time to HH:MM:SS
  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return "00:00:00";
    }
    
    const hours = Math.floor(Math.max(0, seconds) / 3600);
    const minutes = Math.floor((Math.max(0, seconds) % 3600) / 60);
    const secs = Math.max(0, seconds) % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center w-full py-3 px-3 sm:px-4 md:px-6 lg:px-10 xl:px-14 gap-3 sm:gap-0 mb-3 mt-6">
      <div className="flex justify-center items-center gap-2 w-full sm:w-auto text-center sm:text-left">
        <h1 className="text-[#00296b]  sm:text-lg md:text-3xl font-normal ">
          {testName}
        </h1>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap">
          {timingType === "Overall" ? "Overall Timer" : "Section Timer"}
        </span>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
        <img src={clock} alt="clock" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
        <div className="flex flex-col items-center sm:items-start">
          <div className="text-[#00296b] text-sm sm:text-base md:text-lg font-normal">
            {formatTime(displayTime)}
          </div>
          <div className="text-[#00296b] text-xs md:text-sm">
            Total Time Left
          </div>
        </div>
      </div>
    </div>
  );
}