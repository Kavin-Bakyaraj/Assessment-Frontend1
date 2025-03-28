import React from "react";

export default function Legend() {
  return (
    <div >
      <div className="flex items-center space-x-10 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FEF5DE] border border-[#FDC500]"></div>
          <span className="text-xs text-[#00296b]">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FEEAEA] border border-[#BC1C21]"></div>
          <span className="text-xs text-[#00296b]">Not Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#C4DBFF] border border-[#1D3150]"></div>
          <span className="text-xs text-[#00296b]">Review</span>
        </div>
      </div>
      <div className="flex items-center gap-[26px]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#E1F9F0] border border-[#34D399]"></div>
          <span className="text-xs text-[#00296b]">Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-[#ffe078]"></div>
          <span className="text-xs text-[#00296b]">Not Attempted</span>
        </div>
      </div>
    </div>
  );
}