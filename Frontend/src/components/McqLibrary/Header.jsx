import React from 'react';
import ImportQuestion from '../../assets/ImportQuestion.svg';
import AddQuestion from '../../assets/AddQuestion.svg';
import { FaSearch } from 'react-icons/fa';

// Reusable button component
const ActionButton = ({ onClick, text, icon, className = "" }) => (
  <button
    onClick={onClick}
    className={`
      inline-flex items-center px-4 py-2 w-144px font-medium
      bg-[#111933] text-[#ffffff] hover:bg-[#111933]
      transform transition-transform hover:scale-102 cursor-pointer
      rounded-lg ${className}
    `}
  >
    {text}
    <img src={icon} alt={text} className="w-4 h-4 ml-3" />
  </button>
);

// Search input component
const SearchInput = ({ value, onChange }) => (
  <div className="relative flex-grow max-w-xl ml-4">
    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      placeholder="Search..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-2 pl-10 border border-gray-300 focus:border-blue-500 rounded-lg"
      style={{ outline: 'none' }}
      onFocus={(e) => e.target.style.borderColor = '#111933'}
      onBlur={(e) => e.target.style.borderColor = 'gray'}
    />
  </div>
);

// Total Questions counter component
const TotalQuestions = ({ count }) => (
  <div className="flex flex-row justify-left w-64 h-30 rounded-lg pt-1.5">
    <div className="pl-5 text-normal font-semibold">Total Questions: </div>
    <div className="pl-2 text-normal font-semibold">{count}</div>
  </div>
);

const Header = ({ 
  searchQuery, 
  setSearchQuery, 
  setIsModalOpen, 
  setIsSingleQuestionModalOpen, 
  totalQuestions 
}) => {
  const actions = [
    {
      text: "Import Question",
      icon: ImportQuestion,
      onClick: () => setIsModalOpen(true)
    },
    {
      text: "Add Question",
      icon: AddQuestion,
      onClick: () => setIsSingleQuestionModalOpen(true),
      className: "mr-6"
    }
  ];

  return (
    <div className="flex flex-col md:flex-row justify-between items-center p-3 bg-white rounded-t-lg py-4">
      {/* <TotalQuestions count={totalQuestions} /> */}
      
      <div className="flex items-center gap-4 mt-2 ml-1 md:mt-0 flex-grow">
        <SearchInput 
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <div className='flex items-center gap-4 ml-16'>
        {actions.map((action, index) => (
          <ActionButton
            key={index}
            {...action}
          />
        ))}
        </div>
      </div>
    </div>
  );
};

export default Header;