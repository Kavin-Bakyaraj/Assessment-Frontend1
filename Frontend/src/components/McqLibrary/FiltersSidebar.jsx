import React, { useState } from 'react';
import { FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const FiltersSidebar = ({ filters, toggleFilter, clearFilters, availableTags, availableBlooms, wFull }) => {
  const [isLevelOpen, setIsLevelOpen] = useState(true);
  const [isTagOpen, setIsTagOpen] = useState(true);
  const [isBloomOpen, setIsBloomOpen] = useState(true);

  const styles = {
    customBlue: {
      backgroundColor: 'rgba(0, 41, 107, 0.030)',
      color: '#111933',
      borderRadius: '0.375rem',
      padding: '0.5rem',
    },
    checkboxStyle: {
      backgroundColor: 'rgba(0, 41, 107, 0.2)',
      borderColor: '#111933',
      color: '#111933',
    },
    textStyle: {
      color: '#111933',
    },
    iconStyle: {
      color: '#111933',
    },
    hideScrollbar: {
      scrollbarWidth: 'none', /* Firefox */
      msOverflowStyle: 'none', /* IE and Edge */
      '&::-webkit-scrollbar': {
        display: 'none', /* Chrome, Safari and Opera */
      },
    }
  };

  const toCamelCase = (str) => str.replace(/(^|\s)\S/g, (t) => t.toUpperCase());

  return (
    <div className={`${wFull ? "w-full" : "w-64"} flex-shrink-0 flex `}>
      <div className="bg-white border rounded-lg p-5 flex-1 sticky top-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={styles.textStyle}>
            <FaFilter style={{ color: '#111933' }} />
            Filters
          </h3>
          {(filters.level.length > 0 || filters.tags.length > 0 || filters.blooms?.length > 0) && (
            <button onClick={clearFilters} className="text-sm font-semibold opacity-50" style={styles.textStyle}>
              Clear All
            </button>
          )}
        </div>
        <div className="space-y-8">
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center justify-between cursor-pointer" style={styles.textStyle} onClick={() => setIsLevelOpen(!isLevelOpen)}>
              Difficulty Level
              {isLevelOpen ? <FaChevronUp style={styles.iconStyle} /> : <FaChevronDown style={styles.iconStyle} />}
            </h4>
            <div className={`space-y-2 transition-max-height duration-300 ease-in-out overflow-hidden ${isLevelOpen ? 'max-h-96' : 'max-h-0'}`}>
              {isLevelOpen && (
                <div className="space-y-2 text-sm">
                  {['easy', 'medium', 'hard'].map(level => (
                    <label key={level} className="flex items-center text-sm bg-gray-200 p-2 rounded-md" >
                      <input type="checkbox" checked={filters.level.includes(level)} onChange={() => toggleFilter('level', level)} style={styles.checkboxStyle} />
                      <span className="ml-2  capitalize text-sm" style={styles.textStyle}>{level}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center justify-between cursor-pointer" style={styles.textStyle} onClick={() => setIsTagOpen(!isTagOpen)}>
              Tag
              {isTagOpen ? <FaChevronUp style={styles.iconStyle} /> : <FaChevronDown style={styles.iconStyle} />}
            </h4>
            <div className={`space-y-2 max-h-60 overflow-y-auto transition-max-height duration-300 ease-in-out ${isTagOpen ? '' : 'hidden'}`} 
                style={styles.hideScrollbar}>
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {isTagOpen && (
                <div className="space-y-2">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center text-sm bg-gray-200 p-2 rounded-md" >
                      <input type="checkbox" checked={filters.tags.includes(tag)} onChange={() => toggleFilter('tags', tag)} style={styles.checkboxStyle} />
                      <span className="ml-2 text-sm" style={styles.textStyle}>{toCamelCase(tag)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center justify-between cursor-pointer" style={styles.textStyle} onClick={() => setIsBloomOpen(!isBloomOpen)}>
              Blooms
              {isBloomOpen ? <FaChevronUp style={styles.iconStyle} /> : <FaChevronDown style={styles.iconStyle} />}
            </h4>
            <div className={`space-y-2 ${isBloomOpen ? '' : 'hidden'}`}>
              {isBloomOpen && (
                <div className="space-y-2">
                  {[...availableBlooms].sort().map(bloom =>(
                    <label key={bloom} className="flex items-center text-sm bg-gray-200 p-2 rounded-md">
                      <input type="checkbox" checked={filters.blooms?.includes(bloom)} onChange={() => toggleFilter('blooms', bloom)} style={styles.checkboxStyle} />
                      <span className="ml-2 text-sm" style={styles.textStyle}>{bloom}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersSidebar;
