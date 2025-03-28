// Fixed version of SectionBasedSidebar.jsx with proper syntax

import React, { useEffect, useState } from "react";
import QuestionNumbers from "./QuestionNumbers";
import Legend from "./Legend";
import Swal from 'sweetalert2';

export default function SectionBasedSidebar({
  sections,
  currentSectionIndex,
  currentQuestionIndex,
  selectedAnswers,
  reviewStatus,
  onQuestionClick,
  contestId,
  timingType = "Section", // Default to Section if not provided
  totalDuration,
  onSectionSubmit // New prop for section submission
}) {
  // Initialize section times, handling special case for overall timing
  const [sectionTimes, setSectionTimes] = useState(() => {
    const storedTimes = sessionStorage.getItem(`sectionTimes_${contestId}`);

    if (storedTimes) {
      return JSON.parse(storedTimes);
    }

    // If timing type is Overall and we have sections with zero duration,
    // distribute the total time evenly among sections
    if (timingType === "Overall" && totalDuration > 0) {
      const sectionCount = sections.length;
      const timePerSection = Math.floor(totalDuration / sectionCount);

      return sections.map((_, index) => ({
        remainingTime: timePerSection,
        isActive: index === currentSectionIndex,
        isFinished: false,
        isSubmitted: false
      }));
    }

    // Otherwise, use the section's own duration (Section-based timing)
    return sections.map((section, index) => ({
      remainingTime:
        (parseInt(section.duration?.hours) || 0) * 3600 +
        (parseInt(section.duration?.minutes) || 0) * 60,
      isActive: index === currentSectionIndex,
      isFinished: false,
      isSubmitted: false
    }));
  });

  // Get submitted sections from session storage
  const [submittedSections, setSubmittedSections] = useState(() => {
    const storedSubmitted = sessionStorage.getItem(`submittedSections_${contestId}`);
    return storedSubmitted ? JSON.parse(storedSubmitted) : Array(sections.length).fill(false);
  });

  const [visitedQuestions, setVisitedQuestions] = useState(() => {
    const storedVisited = sessionStorage.getItem(`visitedQuestions_${contestId}`);
    return storedVisited
      ? JSON.parse(storedVisited)
      : sections.map(section => Array(section.questions.length).fill(false));
  });

  // Update the initialization of openSections state
  const [openSections, setOpenSections] = useState(() => {
    // Check if there's a stored open section from a section submission
    const storedOpenSection = sessionStorage.getItem(`openSection_${contestId}`);
    if (storedOpenSection !== null) {
      return new Set([parseInt(storedOpenSection, 10)]);
    }
    // Otherwise default to current section
    return new Set([currentSectionIndex]);
  });

  // Find the first unsubmitted section - this is the active one
  // Define this at component level to be used by multiple functions
  const activeUnsubmittedSectionIndex = submittedSections.findIndex(
    isSubmitted => !isSubmitted
  );

  

  // Save submitted sections to session storage
  useEffect(() => {
    sessionStorage.setItem(`submittedSections_${contestId}`, JSON.stringify(submittedSections));
  }, [submittedSections, contestId]);

  // Update timer useEffect
  useEffect(() => {
    let intervalId;

    // Only run timer if in section-based timing mode
    if (timingType === "Section" || timingType === undefined) {
      // Only proceed if we have an active section to run timer for
      if (activeUnsubmittedSectionIndex !== -1) {
        console.log(`Timer running for section ${activeUnsubmittedSectionIndex}, viewing section ${currentSectionIndex}`);
        
        // Check if we should be syncing with main component or running our own timer
        const mainTimerActive = sessionStorage.getItem(`mainTimerActive_${contestId}`);
        
        if (mainTimerActive === "true") {
          // If main component is managing time, just sync with session storage
          const syncInterval = setInterval(() => {
            const storedSectionTimes = sessionStorage.getItem(`sectionRemainingTimes_${contestId}`);
            if (storedSectionTimes) {
              try {
                const sectionTimesArray = JSON.parse(storedSectionTimes);
                setSectionTimes(prevTimes => 
                  prevTimes.map((time, index) => ({
                    ...time,
                    remainingTime: sectionTimesArray[index] || 0,
                    isFinished: (sectionTimesArray[index] || 0) === 0
                  }))
                );
              } catch (error) {
                console.error("Error parsing section times:", error);
              }
            }
          }, 500);
          
          return () => clearInterval(syncInterval);
        } else {
          // We're responsible for running the timer - continue even when viewing submitted sections
          const updateTimer = () => {
            setSectionTimes((prevTimes) =>
              prevTimes.map((time, index) => {
                // Always decrement time for the active unsubmitted section
                // regardless of which section is currently being viewed
                if (index === activeUnsubmittedSectionIndex && time.remainingTime > 0) {
                  const newRemainingTime = time.remainingTime - 1;
                  
                  // Save to session storage for other components to sync with
                  const updatedTimes = [...prevTimes];
                  updatedTimes[index] = {
                    ...time,
                    remainingTime: newRemainingTime,
                    isFinished: newRemainingTime === 0
                  };
                  sessionStorage.setItem(`sectionRemainingTimes_${contestId}`, JSON.stringify(
                    updatedTimes.map(t => t.remainingTime)
                  ));
                  
                  // If time just reached zero, auto-submit the section
                  if (newRemainingTime === 0) {
                    // Use setTimeout to avoid state update conflicts
                    setTimeout(() => {
                      // 1. Dispatch event to notify the section time ended (for notification only)
                      window.dispatchEvent(new CustomEvent('sectionTimeEnded', { 
                        detail: { sectionIndex: activeUnsubmittedSectionIndex }
                      }));
                      
                    }, 50);
                  }
                  
                  return {
                    ...time,
                    remainingTime: newRemainingTime,
                    isFinished: newRemainingTime === 0
                  };
                }
                return time;
              })
            );
          };

          // Always run the timer, regardless of current section being viewed
          intervalId = setInterval(updateTimer, 1000);
        }
      }
    } else if (timingType === "Overall") {
      // For overall timing, we don't need to run separate section timers
      // Just sync with the main component's timer for display
      const syncInterval = setInterval(() => {
        const storedTotalTime = sessionStorage.getItem(`totalTimeLeft_${contestId}`);
        const storedSectionTimes = sessionStorage.getItem(`sectionRemainingTimes_${contestId}`);
        
        if (storedSectionTimes) {
          try {
            const sectionTimesArray = JSON.parse(storedSectionTimes);
            
            setSectionTimes(prevTimes => 
              prevTimes.map((time, index) => ({
                ...time,
                // For overall timing, we show the total time in each section
                remainingTime: parseInt(storedTotalTime) || 0,
                isFinished: (parseInt(storedTotalTime) || 0) === 0 || submittedSections[index]
              }))
            );
          } catch (error) {
            console.error("Error parsing overall time:", error);
          }
        }
      }, 1000);
      
      return () => clearInterval(syncInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timingType, submittedSections, sections, contestId, sectionTimes, currentSectionIndex, activeUnsubmittedSectionIndex]);

  // Update active section in sectionTimes
  useEffect(() => {
    setSectionTimes((prevTimes) =>
      prevTimes.map((time, index) => ({
        ...time,
        isActive: index === currentSectionIndex,
      }))
    );
  }, [currentSectionIndex]);

  const findNextSectionWithTime = () => {
    for (let i = currentSectionIndex + 1; i < sections.length; i++) {
      if (sectionTimes[i]?.remainingTime > 0) {
        return i;
      }
    }
    // If no sections ahead have time, check previous sections
    for (let i = 0; i < currentSectionIndex; i++) {
      if (sectionTimes[i]?.remainingTime > 0) {
        return i;
      }
    }
    return null;
  };

  useEffect(() => {
    if (sectionTimes[currentSectionIndex]?.remainingTime === 0) {
      const nextSectionIndex = findNextSectionWithTime();
      if (nextSectionIndex !== null) {
        onQuestionClick(nextSectionIndex, 0);
      }
    }
  }, [sectionTimes, currentSectionIndex, onQuestionClick]);

  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null) return "00:00:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSection = (sectionIndex) => {
    setOpenSections(prev => {
      const newOpenSections = new Set(prev);

      if (!newOpenSections.has(sectionIndex)) {
        newOpenSections.add(sectionIndex);

        if (sectionIndex !== currentSectionIndex || submittedSections[sectionIndex]) {
          setTimeout(() => {
            onQuestionClick(sectionIndex, 0);
          }, 0);
        }
      } else {
        newOpenSections.delete(sectionIndex);
      }

      sessionStorage.setItem(`openSection_${contestId}`, sectionIndex.toString());

      return newOpenSections;
    });
  };

  const canAccessSection = (sectionIndex) => {
    // Always allow access to submitted sections
    if (submittedSections[sectionIndex]) {
      return true;
    }
    
    // Only allow access to the active unsubmitted section
    return sectionIndex === activeUnsubmittedSectionIndex;
  };

  

  const handleSectionClick = (sectionIndex) => {
    // Check if we can access this section
    if (!canAccessSection(sectionIndex)) {
      // Show a message explaining why user can't access this section
      Swal.fire({
        icon: 'info',
        title: 'Section Not Available Yet',
        text: 'You must complete the current active section before accessing this section.',
        confirmButtonColor: '#111933',
      });
      return;
    }
  
    // If section is accessible, proceed with navigation
    onQuestionClick(sectionIndex, 0); // Navigate to first question of the section
    toggleSection(sectionIndex); // Open the section in sidebar
  };

  useEffect(() => {
    sessionStorage.setItem(`visitedQuestions_${contestId}`, JSON.stringify(visitedQuestions));
  }, [visitedQuestions, contestId]);

  useEffect(() => {
    setVisitedQuestions(prev => {
      const newVisited = [...prev];
      if (newVisited[currentSectionIndex] && !newVisited[currentSectionIndex][currentQuestionIndex]) {
        newVisited[currentSectionIndex] = [...newVisited[currentSectionIndex]];
        newVisited[currentSectionIndex][currentQuestionIndex] = true;
      }
      return newVisited;
    });
  }, [currentSectionIndex, currentQuestionIndex]);

  const getQuestionStatus = (sectionIndex, questionIndex) => {
    if (submittedSections[sectionIndex]) return "submitted";
    if (sectionTimes[sectionIndex]?.isFinished) return "finished";
    if (reviewStatus[sectionIndex]?.[questionIndex]) return "review";
    if (sectionIndex === currentSectionIndex && questionIndex === currentQuestionIndex) return "current";
    if (selectedAnswers[sectionIndex]?.[questionIndex] !== undefined &&
        selectedAnswers[sectionIndex]?.[questionIndex] !== null) return "answered";
    if (visitedQuestions[sectionIndex]?.[questionIndex]) return "notAttempted";
    return "notAnswered";
  };

  // Update the handleSubmitSection function to ensure immediate UI updates
// Update the handleSubmitSection function
const handleSubmitSection = (sectionIndex) => {
  console.log("Submitting section", sectionIndex); // Debug log
  
  // 1. First update local state IMMEDIATELY for immediate UI feedback
  setSubmittedSections(prev => {
    const updated = [...prev];
    // FIX: Use sectionIndex parameter, not activeUnsubmittedSectionIndex
    updated[sectionIndex] = true;
    
    // Update session storage
    sessionStorage.setItem(`submittedSections_${contestId}`, JSON.stringify(updated));
    
    return updated;
  });
  
  // 3. Update section times to mark this section as submitted
  setSectionTimes(prevSectionTimes => {
    const updated = [...prevSectionTimes];
    // FIX: Use sectionIndex parameter, not activeUnsubmittedSectionIndex
    if (updated[sectionIndex]) {
      updated[sectionIndex] = {
        ...updated[sectionIndex],
        isSubmitted: true
      };
      
      // Update session storage
      sessionStorage.setItem(`sectionTimes_${contestId}`, JSON.stringify(updated));
    }
    return updated;
  });
  
  // 4. Dispatch event AFTER state updates
  const event = new CustomEvent('sectionSubmitted', {
    detail: {
      submittedSectionIndex: sectionIndex,
      nextSectionIndex: sectionIndex < sections.length - 1 ? sectionIndex + 1 : null
    }
  });
  window.dispatchEvent(event);
  
  // 5. Call parent component's submission handler
  if (onSectionSubmit) {
    // FIX: Use sectionIndex parameter, not activeUnsubmittedSectionIndex
    onSectionSubmit(sectionIndex);
  }
  
  // 6. Navigate to next section
  if (sectionIndex < sections.length - 1) {
    onQuestionClick(sectionIndex + 1, 0);
  }
};

  // Update the section submitted event listener to force an immediate UI update
// Update the section submitted event listener to force an immediate UI update
useEffect(() => {
  const handleSectionSubmitted = (event) => {
    const { nextSectionIndex, submittedSectionIndex } = event.detail;
    console.log("Received section submitted event:", { nextSectionIndex, submittedSectionIndex });
    
    if (submittedSectionIndex !== undefined) {
      // Immediately update the UI without waiting for the next render cycle
      setSubmittedSections(prev => {
        const updated = [...prev];
        // FIX: Use submittedSectionIndex from event details, not activeUnsubmittedSectionIndex
        updated[submittedSectionIndex] = true;
        
        // Update session storage
        sessionStorage.setItem(`submittedSections_${contestId}`, JSON.stringify(updated));
        
        return updated;
      });
      
      // Also update the section times to reflect submission
      setSectionTimes(prev => {
        const updated = [...prev];
        if (updated[submittedSectionIndex]) {
          updated[submittedSectionIndex] = {
            ...updated[submittedSectionIndex],
            isSubmitted: true
          };
        }
        return updated;
      });
    }
    
    if (nextSectionIndex !== undefined && nextSectionIndex !== null) {
      // Open the next section immediately
      setOpenSections(new Set([nextSectionIndex]));
      sessionStorage.setItem(`openSection_${contestId}`, nextSectionIndex.toString());
    }
  };
  
  window.addEventListener('sectionSubmitted', handleSectionSubmitted);
  
  return () => {
    window.removeEventListener('sectionSubmitted', handleSectionSubmitted);
  };
}, [contestId]); // Only depend on contestId to avoid unnecessary re-registering
// Update the shouldShowTimer function in SectionBasedSidebar.jsx

// Update the shouldShowTimer function in SectionBasedSidebar.jsx to hide timers in overall mode

const shouldShowTimer = (sectionIndex) => {
  // For overall timing, don't show any section timers
  if (timingType === "Overall") {
    return false; // Never show timers in overall mode
  }
  
  // For section timing, show timer for each section
  return true;
};

  return (
    <div className="w-full py-1 space-y-6 ">
      <div className="px-4 mt-5 ">
      <Legend />
      </div>
      
      {sections.map((section, sectionIndex) => {
        const isSubmitted = submittedSections[sectionIndex] || false;
        
        const isDisabled = !isSubmitted && sectionIndex !== activeUnsubmittedSectionIndex;
        const showTimer = shouldShowTimer(sectionIndex);
        const sectionTime = sectionTimes[sectionIndex];
        const remainingTime = sectionTime?.remainingTime || 0;
        const isFinished = sectionTime?.isFinished || remainingTime === 0;
        const formattedTime = formatTime(remainingTime);
        const sectionStatusClass = isSubmitted 
        ? 'bg-gray-50 ' 
        : isDisabled 
          ? 'opacity-50 cursor-not-allowed'
          : '';

        return (
          <>
          <hr className="text-gray-400" />
          <div key={sectionIndex} className={`px-4 border-gray-200 pb-4 ${sectionStatusClass}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <button
                  className={`flex items-center text-[#111933] font-medium ${
                    isSubmitted ? 'cursor-pointer' :
                    isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:underline'
                  }`}
                  onClick={() => handleSectionClick(sectionIndex)}
                  disabled={isDisabled}
                >
                  <span>{section.sectionName}</span>
                  {isSubmitted && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Submitted
                    </span>
                  )}
                  {sectionIndex === activeUnsubmittedSectionIndex && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Only toggle if the section is accessible
                    if (canAccessSection(sectionIndex)) {
                      toggleSection(sectionIndex);
                    }
                  }}
                  className={`ml-2 focus:outline-none ${isDisabled ? 'opacity-50' : ''}`}
                  disabled={isDisabled}
                >
                  <svg
                    className={`w-4 h-4 ${openSections.has(sectionIndex) ? "transform rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>
              </div>
      
              {showTimer && (
                <span className={`text-gray-600 ${remainingTime === 0 ? 'text-red-500' : 
                  sectionIndex === activeUnsubmittedSectionIndex ? 'font-bold text-blue-600' : ''}`}>
                  {formattedTime}
                  {isSubmitted && (
                    <svg className="w-4 h-4 ml-1 inline-block text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              )}
            </div>
      
            {openSections.has(sectionIndex) && canAccessSection(sectionIndex) && (
              <QuestionNumbers
                questionNumbers={section.questions.map((_, i) => i + 1)}
                questionStatuses={section.questions.map((_, i) => getQuestionStatus(sectionIndex, i))}
                onQuestionClick={(index) => onQuestionClick(sectionIndex, index)}
                isDisabled={isDisabled}
              />
            )}
          </div>
          </>
        );
      })}
    </div>
  );
}