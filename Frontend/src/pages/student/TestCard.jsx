import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Calendar, Clock, FileText } from "lucide-react";
import { FaArrowRightLong } from "react-icons/fa6";

const TestCard = ({
  test = {},
  assessment_type = "unknown",
  isCompleted = false,
  studentId = "",
  isPublished = true,
}) => {
  const navigate = useNavigate();
  const [showStartTooltip, setShowStartTooltip] = useState(false);
  const [showEndTooltip, setShowEndTooltip] = useState(false);

  const icon = useMemo(
    () => <FileText className="w-5 h-5 text-[#111933]" />,
    []
  );

  const getTestStatus = () => {
    const currentTime = new Date();
    const startTime = new Date(test?.starttime);
    const endTime = test?.endtime ? new Date(test?.endtime) : null;

    if (test.Overall_Status === "closed") {
      return { text: "Closed", className: "bg-purple-100 text-purple-800" };
    }

    if (isCompleted) {
      return { text: "Completed", className: "bg-red-100 text-red-800" };
    } else if (
      currentTime >= startTime &&
      (!endTime || currentTime <= endTime)
    ) {
      return { text: "Live", className: "bg-green-100 text-green-800" };
    } else if (currentTime < startTime) {
      return { text: "Upcoming", className: "bg-orange-100 text-orange-800" };
    }
    return { text: "Not Yet Started", className: "bg-gray-200 text-gray-700" };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
        .format(date)
        .replace(",", "");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  const handleCardClick = (e) => {
    e.preventDefault();
    const testStatus = getTestStatus();
    if (testStatus.text === "Live") {
      const testId = test?.contestId || test?.testId || "unknown";
      navigate(`/testinstructions/${testId}`, {
        state: { test, assessment_type },
      });
    } else if (
      testStatus.text === "Completed" ||
      testStatus.text === "Closed"
    ) {
      const testId = test?.contestId || test?.testId || "unknown";
      navigate(`/result/${testId}/${studentId}`);
    }
  };

  const testStatus = getTestStatus();
  const isEffectivelyCompleted =
    testStatus.text === "Completed" || testStatus.text === "Closed";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="w-full max-w-md relative group"
      disabled={!isPublished}
    >
      <div
        className={`p-4 border border-[#e5e7eb] rounded-2xl bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300 min-h-[200px] relative ${
          !isPublished ||
          (!isEffectivelyCompleted && testStatus.text !== "Live")
            ? "cursor-pointer"
            : "cursor-pointer"
        }`}
        onClick={
          isPublished && (testStatus.text === "Live" || isEffectivelyCompleted)
            ? handleCardClick
            : undefined
        }
      >
        {!isPublished && (
          <span className="absolute top-8 left-1/2 transform -translate-x-1/2 -mt-8 bg-gray-600 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Test results not published yet
          </span>
        )}
        <div className="flex justify-between items-center mt-4 mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-base font-semibold text-[#111827] truncate max-w-[90%]">
              {test?.name || "Unknown Test"}
            </h3>
          </div>
          <span
            className={`px-2 text-sm rounded-full font-semibold flex items-center gap-1 ${testStatus.className}`}
          >
            {testStatus.text === "Live" && (
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            )}
            {testStatus.text}
          </span>
        </div>

        <div className="h-2"></div>
        <p className="text-gray-600 text-sm mb-2">
          A mock test is a practice exam designed to simulate the real test
          experience.
        </p>

        <div className="h-2"></div>

        <div className="grid grid-cols-12 gap-2 items-center pb-1">
          <div className="col-span-5 lg:col-span-4 relative">
            <div
              className="flex items-center gap-1 sm:px-5 md:px-2 py-1.5 bg-[#15ff001c] text-gray-700 text-sm font-medium rounded-full whitespace-nowrap"
              onMouseEnter={() => setShowStartTooltip(true)}
              onMouseLeave={() => setShowStartTooltip(false)}
            >
              <Calendar className="sm:w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {formatDateTime(test?.starttime)}
              </span>
            </div>
            {showStartTooltip && (
              <div className="absolute z-10 top-full left-0 mt-1 bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                {formatDateTime(test?.starttime)}
              </div>
            )}
          </div>

          <div className="col-span-5 lg:col-span-4 relative">
            <div
              className="flex items-center gap-1 px-2 py-1.5 bg-transparent sm:bg-transparent lg:bg-[#ff03031c] text-gray-700 text-sm font-medium rounded-full whitespace-nowrap overflow-hidden"
              onMouseEnter={() => setShowEndTooltip(true)}
              onMouseLeave={() => setShowEndTooltip(false)}
            >
              {/* Content hidden on sm screens, visible on lg */}
              <div className="invisible sm:invisible lg:visible flex items-center gap-1">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {formatDateTime(test?.endtime)}
                </span>
              </div>
            </div>

            {showEndTooltip && (
              <div className="absolute z-10 top-full left-0 mt-1 bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
                {formatDateTime(test?.endtime)}
              </div>
            )}
          </div>

          <div className="col-span-2 lg:col-span-4 flex justify-end">
            {testStatus.text === "Live" ? (
              <button
                className="px-3 py-2 bg-[#111827] text-white rounded-lg hover:bg-amber-500 transition-colors flex items-center justify-center font-medium text-sm whitespace-nowrap"
                onClick={handleCardClick}
                disabled={testStatus.text !== "Live" || !isPublished}
              >
                Take Test
                <FaArrowRightLong className="w-4 h-4 ml-1.5" />
              </button>
            ) : isEffectivelyCompleted ? (
              <Link
                to={`/result/${
                  test?.contestId || test?.testId || "unknown"
                }/${studentId}`}
                className="text-white"
              >
                <button
                  className={`px-3 py-2 rounded-lg flex items-center justify-center font-medium text-sm whitespace-nowrap ${
                    isPublished
                      ? "bg-[#111827] hover:bg-amber-500 transition-colors"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleCardClick}
                  disabled={!isPublished}
                >
                  View Result
                  <FaArrowRightLong className="w-4 h-4 ml-1.5" />
                </button>
              </Link>
            ) : (
              <button
                className="px-3 py-2 bg-gray-500 text-white rounded-lg opacity-50 cursor-not-allowed flex items-center justify-center font-medium text-sm whitespace-nowrap"
                disabled
              >
                Yet to Start
                <FaArrowRightLong className="w-4 h-4 ml-1.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

TestCard.propTypes = {
  test: PropTypes.shape({
    name: PropTypes.string,
    contestId: PropTypes.string,
    testId: PropTypes.string,
    starttime: PropTypes.string,
    endtime: PropTypes.string,
    assessment_type: PropTypes.string,
    Overall_Status: PropTypes.string,
  }),
  assessment_type: PropTypes.string,
  isCompleted: PropTypes.bool,
  studentId: PropTypes.string,
  isPublished: PropTypes.bool,
};

export default React.memo(TestCard);
