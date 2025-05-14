// src/App.jsx
import React, { useState } from 'react';
import Setup from './pages/Setup';
import Planner from './pages/Planner';

export default function App() {
  const DEFAULT = { 
    totalCredits: 120, 
    idealPerSem: 5, 
    mandatory: [], 
    electives: [], 
    complementary: [] 
  };

  // Holds the previous form values
  const [formValues, setFormValues] = useState(DEFAULT);

  // Holds the semester plan (with semesters array)
  const [planData, setPlanData] = useState(null);

  // If editting then show Setup page with initialValues
  const [isEditing, setIsEditing] = useState(true);

  const handleGenerate = values => {
    // values: { totalCredits, idealPerSem, mandatory, electives, complementary }
    setFormValues(values);
    setPlanData(values);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // If editing (or haven't generated yet), show Setup page
  if (isEditing) {
    return (
      <Setup
        onGenerate={handleGenerate}
        initialValues={formValues}
      />
    );
  }

  // Otherwise show the Planner page
  return (
    <Planner
      plan={planData}
      onEdit={handleEdit}
    />
  );
}
