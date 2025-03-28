import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Clock,
  ChevronRight,
  FileText,
  Code,
} from "lucide-react";
import { Card, CardHeader, CardFooter, CardBody } from "@nextui-org/react";
import { Skeleton } from "@mui/material";
import { formatInTimeZone } from "date-fns-tz";

const TestCard = ({
  title,
  type,
  date,
  time,
  stats,
  registrationStart,
  endDate,
  contestId,
  status,
  isLoading,
}) => {
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState("");

  const calculateStatus = () => {
    const istNow = new Date();
    const utcTimestamp = formatInTimeZone(
      istNow,
      "Asia/Kolkata",
      "yyyy-MM-dd'T'HH:mm:ss'Z'"
    );

    const currentUTC = new Date(utcTimestamp).getTime();
    const startUTC = new Date(registrationStart).getTime();
    const endUTC = new Date(endDate).getTime();

    if (status === "Closed") {
      return "Closed";
    } else {
      if (currentUTC < startUTC) {
        return "Upcoming";
      } else if (currentUTC >= startUTC && currentUTC <= endUTC) {
        return "Live";
      } else {
        return "Completed";
      }
    }
  };

  useEffect(() => {
    if (!registrationStart || !endDate) {
      console.log("Missing dates for:", title);
      return;
    }

    const updateStatus = () => {
      const newStatus = calculateStatus();
      setCurrentStatus(newStatus);
    };

    updateStatus();

    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, [registrationStart, endDate, title]);

  const handleViewTest = () => {
    navigate(`/viewtest/${contestId}`);
  };

  const statusStyles = {
    Closed: "bg-[#f8d7da] text-[#842029]",
    Live: "bg-[#d1fae5] text-[#0f5132]", // Even lighter green (very light, pastel-like green)
    Upcoming: "bg-[#ffdcac] text-[#7c4a00]", // Light orange (unchanged)
    Completed: "bg-[#f8d7da] text-[#842029]", // Light red (unchanged)
  };

  const getIcon = (type) => {
    switch (type) {
      case "Coding":
        return <Code className="w-4 h-4 text-[#111933]" />;
      case "MCQ":
        return <FileText className="w-4 h-4 text-[#111933]" />;
      default:
        return <FileText className="w-4 h-4 text-[#111933]" />;
    }
  };

  const formatTimeUTC = (dateString) => {
    return formatInTimeZone(new Date(dateString), "UTC", "hh:mm a");
  };

  const formatDateUTC = (dateString) => {
    return formatInTimeZone(
      new Date(dateString),
      "UTC",
      "dd-MMM-hh:mm a"
    ).toUpperCase();
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="w-full max-w-md sm:max-w-lg md:max-w-xl"
    >
      <Card className="py-2 shadow-lg bg-gradient-to-br from-blue-50 to-white rounded-xl hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex justify-between items-center gap-2 flex-wrap">
          <div className="flex gap-2 items-center">
            <div className="p-1 rounded-full">
              {isLoading ? (
                <Skeleton variant="circular" width={24} height={24} />
              ) : (
                getIcon(type)
              )}
            </div>
            <div className="text-[#111933]">
              {isLoading ? (
                <Skeleton variant="text" width={100} height={24} />
              ) : (
                <h3 className="text-base sm:text-lg font-bold">{title}</h3>
              )}
            </div>
          </div>
          {isLoading ? (
            <Skeleton variant="text" width={80} height={24} className="mr-4" />
          ) : (
            <span
              className={`px-2 py-1 rounded-full mr-1 text-xs sm:text-sm font-semibold ${
                statusStyles[currentStatus || "Upcoming"]
              }`}
            >
              {currentStatus || "Upcoming"}
            </span>
          )}
        </CardHeader>

        <CardBody className="grid grid-cols-3 gap-2 w-full px-2">
          {isLoading ? (
            <>
              <Skeleton variant="text" width={80} height={24} className="ml-8" />
              <Skeleton variant="text" width={80} height={24} className="ml-8" />
              <Skeleton variant="text" width={80} height={24} className="ml-8" />
            </>
          ) : (
            Object.entries(stats).map(([key, value]) => (
              <div key={key} className="text-center">
                <p className="text-gray-600 text-xs sm:text-sm inline-block">
                  {key}
                </p>
                <h4 className="text-sm sm:text-lg font-medium inline-block ml-1">
                  {value}
                </h4>
              </div>
            ))
          )}
        </CardBody>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex flex-row md:gap-4 mt-2">
            <div className="flex bg-[#15ff001c] py-0.5 px-1.5 sm:py-0.5 sm:px-1.5 border rounded-full items-center gap-2">
              

              {isLoading ? (
                <Skeleton variant="text" width={80} height={20} />
              ) : (
                <span className="text-xs sm:text-[12px] whitespace-nowrap">
                  {formatDateUTC(registrationStart)}
                </span>
              )}
            </div>

            <div className="flex bg-[#ff03031c] py-0.5 px-1 sm:py-0.5 sm:px-1.5 border rounded-full items-center gap-2">
              

              {isLoading ? (
                <Skeleton variant="text"  width={80} height={20} />
              ) : (
                <span className="text-xs sm:text-[12px] whitespace-nowrap">
                  {formatDateUTC(endDate)}
                </span>
              )}
            </div>
            {/* <div className="flex bg-white py-0.5 px-1.5 sm:py-0.5 sm:px-2 border rounded-full items-center gap-1">
              {isLoading ? <Skeleton variant="text" width={40} height={20} /> : <Users className="w-2 h-2 sm:w-2.5 sm:h-2.5" />}
              {isLoading ? <Skeleton variant="text" width={60} height={20} /> : <span className="text-xs sm:text-sm">{type}</span>}
            </div> */}
          </div>
          <div className="mt-2 mr-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewTest}
              className="px-3 py-2 bg-[#111933] text-white rounded-lg hover:bg-[#111933de] transition-colors flex items-center justify-center gap-1 text-[14px]"
            >
              {isLoading ? (
                <Skeleton variant="text" width={60} height={20} />
              ) : (
                "View Test"
              )}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default TestCard;
