import React, { useState, useEffect, useMemo } from 'react';
import './Planner.css';
import { getManyCourses } from '../api/courseService';
import { buildDependencyMaps, getDependencySets } from '../algorithms/dependency';
import { planSemesters } from '../algorithms/schedule';
// import setup for Drag N Drop kit
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function Planner({ plan, onEdit }) {
  const { idealPerSem = 5, mandatory = [], electives = [], complementary = [], totalCredits = 120 } = plan || {};
  const allCourseCodes = [...mandatory, ...electives, ...complementary].map(c => c.trim().toUpperCase());

  // data states
  const [courseDataMap, setCourseDataMap] = useState({});
  const [prereqMap, setPrereqMap] = useState({});
  const [dependentsMap, setDependentsMap] = useState({});
  const [semesters, setSemesters] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseData, setSelectedCourseData] = useState(null);
  const [creditMap, setCreditMap] = useState({});

  // slider Weights (for user degree structure preferences)
  const [weights, setWeights] = useState({
    priorityFocus: 3,
    creditSpread: 3,
    heatOfDraw: 3,
  });
  const handleWeightChange = (key, value) => setWeights(prev => ({ ...prev, [key]: Number(value) }));

  // toggling the dependency view tree on a course
  const [depsRoot, setDepsRoot] = useState(null);
  const toggleDepsView = code => {
    const norm = code.trim().toUpperCase();
    setDepsRoot(prev => (prev === norm ? null : norm));
  };

  // load courses, build maps, generate and show degree plan
  useEffect(() => {
    let mounted = true;
    getManyCourses(allCourseCodes).then(courses => {
      if (!mounted) return;
      const dataMap = {};
      courses.forEach(c => {
        if (!c) return;
        const code = c.code.trim().toUpperCase();
        dataMap[code] = { ...c, code };
      });
      // course information map build and set
      setCourseDataMap(dataMap);
      // sifting out courses not found within the database and notify user
      const unknown = allCourseCodes.filter(code => !dataMap[code]);
      if (unknown.length) window.alert(`⚠️ No data for: ${unknown.join(', ')}`);

      // build dependency map for each course
      const list = Object.values(dataMap);
      // up stream + down stream transitive sets for each course (prereq relation to courses)
      const { prereqMap, dependentsMap } = buildDependencyMaps(list);
      setPrereqMap(prereqMap);
      setDependentsMap(dependentsMap);

      // create a {code : credit} map for each inputted course
      const cMap = {};
      list.forEach(c => (cMap[c.code] = c.credits));
      setCreditMap(cMap);

      // categorically separating courses to build degree plan (associated with priority slider)
      const categoryMap = {};
      mandatory.forEach(c => (categoryMap[c] = 'mandatory'));
      electives.forEach(c => (categoryMap[c] = 'electives'));
      complementary.forEach(c => (categoryMap[c] = 'complementary'));

      const sems = planSemesters(allCourseCodes, prereqMap, cMap, categoryMap, weights, idealPerSem);
      setSemesters(sems);
    });
    return () => { mounted = false; };
  }, [plan, weights, idealPerSem]);

  // show selected course information in info panel
  useEffect(() => {
    setSelectedCourseData(selectedCourse ? courseDataMap[selectedCourse] : null);
  }, [selectedCourse, courseDataMap]);

  // compute courses dependency set
  const { upstream, downstream } = useMemo(
    () => getDependencySets(depsRoot, prereqMap, dependentsMap),
    [depsRoot, prereqMap, dependentsMap]
  );

  // sum all credits in the plan
  const summedCredits = useMemo(
    () => allCourseCodes.reduce((sum, code) => sum + (creditMap[code] || 0), 0),
    [allCourseCodes, creditMap]
  );

  // Drag n Drop setup
  // set up sensors so only the .drag-handle initiates drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        handle: '.drag-handle'
      }
    })
  );
  // handling manual drag and drop for course blocks
  const onDragEnd = ({ active, over }) => {
    if (!over) return;
    const [srcTerm, srcCode] = active.id.split('-');
    const [dstTerm] = over.id.split('-');
    const s = Number(srcTerm), d = Number(dstTerm);

    setSemesters(curr => {
      const next = curr.map(arr => [...arr]);
      // remove
      next[s].splice(next[s].indexOf(srcCode), 1);
      // insert
      next[d].splice(over.data.current.sortable.index, 0, srcCode);
      return next;
    });
  };
  // determine if prerequisite conflict is made due to user's Drag n drop
  function isInvalid(code, termIdx) {
    return (prereqMap[code] || []).some(p =>
      semesters.slice(termIdx).some(term => term.includes(p))
    );
  }
  // indexing course blocks + handle UI effects for course blocks
  function SortableCourse({ code, termIdx, idx }) {
    const invalid = isInvalid(code, termIdx);
    const isHighlight = depsRoot && (code === depsRoot || upstream.has(code) || downstream.has(code));
    const isDim = depsRoot && !isHighlight;
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: `${termIdx}-${code}` });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
      <li
        ref={setNodeRef}
        style={style}
        className={
          `course-item${invalid ? ' invalid' : ''}` +
          `${isHighlight ? ' highlight' : ''}` +
          `${isDim ? ' dim' : ''}`
        }
      >
        <button className="drag-handle" {...attributes} {...listeners} title="Drag">☰</button>
        <span onClick={() => setSelectedCourse(code)}>{code}</span>
        <button className="deps-btn" onClick={() => toggleDepsView(code)} title="Toggle dependencies">🔗</button>
      </li>
    );
  }

return (
    <div className="planner-wrapper">
      <div className="planner-container">
        <header className="planner-header">
          <button className="edit-btn" onClick={onEdit}>← Edit Inputs</button>
          <h1>Total Credits: {summedCredits}/{totalCredits}</h1>
          <h1>Semester-by-Semester Plan</h1>
        </header>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="semesters-grid">
            {semesters.map((courses, termIdx) => (
              <SortableContext key={termIdx} items={courses.map(c => `${termIdx}-${c}`)} strategy={verticalListSortingStrategy}>
                <div className="semester-column">
                  <h2>Semester {termIdx + 1}</h2>
                  <ul>
                    {courses.map((code, idx) => (
                      <SortableCourse key={code} code={code} termIdx={termIdx} idx={idx} />
                    ))}
                  </ul>
                </div>
              </SortableContext>
            ))}
          </div>
        </DndContext>
      </div>

      <aside className="info-panel">
        <div className="info-content">
          <h2>Course Info</h2>
          {selectedCourseData ? (
            <div>
              <h3>
                {selectedCourseData.code} – {selectedCourseData.title}
              </h3>
              <p>
                <strong>Credits:</strong> {selectedCourseData.credits}
              </p>
              <p>
                <strong>Prerequisites:</strong>{' '}
                {selectedCourseData.prereqs.length
                  ? selectedCourseData.prereqs.join(', ')
                  : 'None'}
              </p>
              <p>{selectedCourseData.description}</p>
            </div>
          ) : (
            <p>Select a course to see details.</p>
          )}
        </div>
        <div className="slider-panel">
          <h3>Priority Playground</h3>
          {/* Slider 1: Priority Focus */}
          <div className="slider-row">
            <label>Priority Focus: {weights.priorityFocus}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={weights.priorityFocus}
              onChange={e => handleWeightChange('priorityFocus', e.target.value)}
            />
            <div className="slider-labels">
              <span>Complementary</span>
              <span>Elective</span>
              <span>Mandatory</span>
            </div>
          </div>
          {/* Slider 2: Credit Balance */}
          <div className="slider-row">
            <label>Credit Spread: {weights.creditSpread}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={weights.creditSpread}
              onChange={e => handleWeightChange('creditSpread', e.target.value)}
            />
            <div className="slider-labels">
              <span>Ignore</span>
              <span>Even</span>
              <span>Spread Heavy</span>
            </div>
          </div>
          {/* Slider 3: Heat of the Draw */}
          <div className="slider-row">
            <label>Heat of the Draw: {weights.heatOfDraw}</label>
            <input
              type="range"
              min="1" max="5"
              value={weights.heatOfDraw}
              onChange={e => handleWeightChange('heatOfDraw', e.target.value)}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
