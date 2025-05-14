// src/pages/Setup.jsx
import React, { useState, useEffect } from 'react';
import MandatoryCoursesInput from '../components/MandatoryCoursesInput/MandatoryCoursesInput';
import ElectiveSectionInput from '../components/ElectiveSectionInput/ElectiveSectionInput';
import ComplementarySectionInput from '../components/ComplementarySectionInput/ComplementarySectionInput';
import './Setup.css';

export default function Setup({ onGenerate, initialValues }) {

  const DEFAULT_CREDITS = 120;
  const DEFAULT_IDEAL = 5;

  const [totalCredits, setTotalCredits] = useState(DEFAULT_CREDITS);
  const [idealPerSem, setIdealPerSem] = useState(DEFAULT_IDEAL);
  const [mandatory, setMandatory] = useState([]);
  const [electives, setElectives] = useState([]);
  const [complementary, setComplementary] = useState([]);

  useEffect(() => {
    if (initialValues) {
      setTotalCredits(initialValues.totalCredits);
      setIdealPerSem(initialValues.idealPerSem);
      setMandatory(initialValues.mandatory);
      setElectives(initialValues.electives);
      setComplementary(initialValues.complementary);
    }
  }, [initialValues]);

   // Prefilling degree data following a York U Computer Engineering degree checklist
  const TEST_DATA = {
    totalCredits: 120,
    idealPerSem: 5,
    mandatory: ['CHEM 1100', 'EECS 1011', 'EECS 1021', 'EECS 1028', 'ENG 1101', 'ENG 1102', 'MATH 1013', 'MATH 1014', 'MATH 1025', 'PHYS 1800', 'PHYS 1801', 'MATH 1090', 'EECS 2101', 'EECS 2021', 'EECS 2030', 'EECS 2032',
      'EECS 2200', 'EECS 2210', 'ENG 2001', 'ENG 2003', 'MATH 2015', 'MATH 2930', 'PHYS 2020', 'ENG 3000', 'EECS 3101', 'EECS 3201', 'EECS 3213', 'EECS 3216', 'EECS 3221', 'EECS 3311', 'EECS 3451', 'ESSE 2210', 
      'ENG 4000', 'EECS 4201', 'EECS 4214', 'EECS 4312'],
    electives: ['CHEM 1001', 'CHEM 2011', 'EECS 3421', 'EECS 3214', 'EECS 4404', 'EECS 4421'],
    complementary: ['ECON 1000', 'ECON 1010']
  };
  
   // Prefill form with TEST_DATA
  const handleTest = () => {
    setTotalCredits(TEST_DATA.totalCredits);
    setIdealPerSem(TEST_DATA.idealPerSem);
    setMandatory(TEST_DATA.mandatory);
    setElectives(TEST_DATA.electives);
    setComplementary(TEST_DATA.complementary);
   };
  const handleClear = () => {
    setTotalCredits(DEFAULT_CREDITS);
    setIdealPerSem(DEFAULT_IDEAL);
    setMandatory([]);
    setElectives([]);
    setComplementary([]);
  };
  const handleSubmit = e => {
    e.preventDefault(); // prevent page reload
    const data = { totalCredits, idealPerSem, mandatory, electives, complementary };
    // call the prop from App
    onGenerate(data);
  };

  return (
    <div className="setup-container">
      <h1>Degree Planner</h1>
      <form onSubmit={handleSubmit} className="setup-form">
        {/* Row 1: Total Credits & Ideal/Sem */}
        <div className="row two-cols">
          <label>
            Total Credits
            <input className='row-one-inputfield'
              type="number"
              min="0"
              value={totalCredits}
              onChange={e => setTotalCredits(+e.target.value)}
            />
          </label>
          <label>
            Number of Courses Per Semester
            <input className='row-one-inputfield'
              type="number"
              min="1"
              value={idealPerSem}
              onChange={e => setIdealPerSem(+e.target.value)}
            />
          </label>
        </div>

        {/* Row 2: Mandatory Courses */}
        <div className="row mandatory">
          <MandatoryCoursesInput
            value={mandatory}
            onChange={setMandatory}
          />
        </div>

        {/* Row 3: Elective Section */}
        <div className="row elective">
          <ElectiveSectionInput
            value={electives}
            onChange={setElectives}
          />
        </div>
        {/* Row 4: Complementary section */}
        <div className="row elective">
          <ComplementarySectionInput
            value={complementary}
            onChange={setComplementary}
          />
        </div>
           {/* Buttons */}
           <div className="row button-row">
           <button type="submit" className="generate-btn">
            Generate Plan
           </button>
          <button
            type="button"
            className="test-btn"
            onClick={handleTest}
          >
             Prefill Test Data
          </button>
          <button
           type="button"
           className="clear-btn"
           onClick={handleClear}
          >
           Clear
         </button>
        </div>
      </form>
    </div>
  );
}
