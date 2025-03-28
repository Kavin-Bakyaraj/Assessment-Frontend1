import React from "react";

const   InputField = ({ label, value, onChange, args = {}, required }) => {
    return (
        <div className="w-full  mb-4">
            <label className="block text-[#111933] font-semibold mb-2">
                {label} <span className="text-rose-700">{required && "*"}</span>
            </label>
            <input
                {...args}
                type="text"
                required={required}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="text-sm appearance-none border rounded w-full py-3 px-5 text-[#111933] leading-tight focus:outline-none focus:shadow-outline"
            />
        </div>
    );
};

const SelectField = ({ label, value, onChange, options }) => {
    return (
        <div className="w-full  mb-4">
            <label className="block text-[#111933] font-semibold mb-2">{label}:</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="text-sm appearance-none border rounded w-full py-3 px-5 text-[#111933] leading-tight focus:outline-none focus:shadow-outline"
            >
                <option value="">Select Level</option>
                {options.map((option, idx) => (
                    <option key={idx} value={option}>{option}</option>
                ))}
            </select>
        </div>
    );
};

const TagInputField = ({
    label,
    tags,
    value,
    onChange,
    onKeyPress,
    onBlur,
    removeTag,
    validateInput,
    minLength = 8,
    maxLength = 30,
    placeholder = "Type and press Enter or comma to add tags",
  }) => {
    return (
      <div className="w-full  mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[#111933] text-lg font-semibold">{label}:</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-[#111933] px-2 py-1 rounded-full text-lg flex items-center">
                {tag}
                <button onClick={() => removeTag(index)} className="ml-2 text-[#111933] hover:text-blue-900">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (validateInput(e.target.value, maxLength, minLength)) {
              onChange(e.target.value);
            }
          }}
          onKeyPress={onKeyPress}
          onBlur={onBlur}
          placeholder={placeholder}
          className="text-sm appearance-none border rounded w-full py-3 px-5 text-[#111933] leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
    );
  };

export { InputField, SelectField, TagInputField };
