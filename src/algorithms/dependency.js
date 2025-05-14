
/**
 * given raw course objects, build two maps:
 *  - prereqMap: {course : list of prereq courses}
 *  - dependentsMap: {prereqCourse : list of courses} | (finds all courses that are dependent on a given course)
 */
export function buildDependencyMaps(courses) {
  const prereqMap = {};
  const dependentsMap = {};

  // helper to normalize entries to "DEPT ####"
  const normalize = entry => {
    const pr = entry.trim().toUpperCase();
    const m = pr.match(/^([A-Z]+)\s*(\d+)$/);
    if (m) return `${m[1]} ${m[2]}`;
    return pr;
  };

  courses.forEach(c => {
    const code = c.code;
    // split raw prereq string (space separated codes)
    const rawList = Array.isArray(c.prereqs) ? c.prereqs : [c.prereqs || ''];
    const normalized = rawList
      .flatMap(item => item.split(/\s+/))
      .map(normalize)
      .filter(p => p);

    prereqMap[code] = normalized;

    normalized.forEach(p => {
      if (!dependentsMap[p]) dependentsMap[p] = [];
      dependentsMap[p].push(code);
    });
  });

  // console.log('prereqMap:', prereqMap);
  // console.log('dependentsMap:', dependentsMap);
  return { prereqMap, dependentsMap };
}
  
/**
 * given a root courseCode and the two maps, return the full
 * transitive sets of upstream prereqs and downstream dependents. (topo tree)
 */
export function getDependencySets(root, prereqMap, dependentsMap) {
  const upstream = new Set();
  const downstream = new Set();

  if (root) {
    // BFS for upstream prerequisites
    const queueUp = [root];
    while (queueUp.length > 0) {
      const current = queueUp.shift();
      const prereqs = prereqMap[current] || [];
      prereqs.forEach(p => {
        if (!upstream.has(p)) {
          upstream.add(p);
          queueUp.push(p);
        }
      });
    }

    // BFS for downstream dependents
    const queueDown = [root];
    while (queueDown.length > 0) {
      const current = queueDown.shift();
      const deps = dependentsMap[current] || [];
      deps.forEach(d => {
        if (!downstream.has(d)) {
          downstream.add(d);
          queueDown.push(d);
        }
      });
    }
  }
  
    // console.log(
    //   'Computed sets for', root,
    //   'upstream:', Array.from(upstream),
    //   'downstream:', Array.from(downstream)
    // );
  
    return { upstream, downstream };
  }
  