import React, { useState, useEffect } from "react";
import clock from "../../../assets/Clock.svg";

export default function Header({ duration }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [testName, setTestName] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duration]);

  useEffect(() => {
    const testData = JSON.parse(localStorage.getItem("currentTest"));
    if (testData) {
      setTestName(testData.name);
    }
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex justify-between items-center my-4 px-4 md:px-14">
      <div className="flex justify-center items-center gap-2">
        <h1 className="text-[#00296b] text-lg md:text-xl font-normal">{testName}</h1>
      </div>
      <div className="flex items-center gap-2 mr-14 md:mr-0">
        <img src={clock} alt="clock" className="w-6 h-6 md:w-8 md:h-8"></img>
        <div>
          <div className="text-[#00296b] text-base md:text-lg font-normal">
            {formatTime(timeLeft)}
          </div>
          <div className="text-[#00296b] text-xs md:text-sm ">Time Left</div>
        </div>
      </div>
    </div>
  );
}
