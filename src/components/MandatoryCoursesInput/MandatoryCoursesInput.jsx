import React, { useState } from 'react';
import './MandatoryCoursesInput.css';

const COURSE_REGEX = /^[A-Z]{2,4}\s\d{4}$/;

export default function MandatoryCoursesInput({ value = [], onChange }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  // preserve and constraint input format
  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = input.trim().toUpperCase();
      if (!COURSE_REGEX.test(code)) {
        setError('Format must be “DEPT ####”');
      } else if (value.includes(code)) {
        setError('Already added');
      } else {
        onChange([...value, code]);
        setError('');
      }
      setInput('');
    }
  };

  return (
    <div className="mandatory-container">
      <label className="label-with-icon">
        Mandatory Courses
        <span className="info-icon" tabIndex="0">
          ℹ️
          <span className="tooltip">
            Enter codes like “EECS 1021”<br/>
            (2–4 letters, space, 4 digits)
          </span>
        </span>
      </label>
      <input
        className="tag-input__field"
        type="text"
        placeholder="e.g. EECS 1021"
        value={input}
        onChange={e => {
          setInput(e.target.value);
          setError('');
        }}
        onKeyDown={handleKeyDown}
      />
      {error && <div className="input-error">{error}</div>}
        <div className="tag-input__bubbles">
          {value.map(code => (
            <span key={code} className="tag">
              {code}
              <button
                type="button"
                className="remove-btn"
                onClick={() => onChange(value.filter(c => c !== code))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
    </div>
  );
}
