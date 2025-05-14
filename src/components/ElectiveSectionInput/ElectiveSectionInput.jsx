import React, { useState } from 'react';
import './ElectiveSectionInput.css';

const COURSE_REGEX = /^[A-Z]{2,4}\s\d{4}$/;

export default function ElectiveSectionInput({ value = [], onChange }) {
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

  const remove = code => {
    onChange(value.filter(c => c !== code));
  };

  return (
    <div className="elective-container">
      <label className="label-with-icon">
        Elective Courses
        <span className="info-icon" tabIndex="0">
          ℹ️
          <span className="tooltip">
            Enter codes like “CHEM 1001”<br/>
            (2–4 letters, space, 4 digits)
          </span>
        </span>
      </label>
      <input
        className="tag-input__field"
        type="text"
        placeholder="e.g. CHEM 1001"
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
              onClick={() => remove(code)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
