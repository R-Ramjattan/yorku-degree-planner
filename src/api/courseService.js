// in-memory cache for department data
const cache = {};

/**
 * fetches and caches a department's JSON file (lowercased filename).
 * skips missing files by returning an empty array.
 * 
 * input : {string} deptCode e.g. "EECS"
 * output : returns Promise<Array<CourseRaw>> (array of course objects)
 */
export async function loadDepartment(deptCode) {
  const key = deptCode.toUpperCase();
  if (!cache[key]) {
    const filename = `${deptCode.toLowerCase()}.json`;
    const url = `/data/${filename}`;
    cache[key] = fetch(url)
      .then(res => {
        if (!res.ok) {
          console.warn(`Department file not found: ${url} (${res.status})`);
          return [];
        }
        return res.json();
      })
      .then(data => {
        // normalize to courses array
        if (data && Array.isArray(data.courses)) {
          return data.courses;
        }
        return [];
      })
      .catch(err => {
        console.warn(`Error loading ${filename}:`, err);
        return [];
      });
  }
  return cache[key];
}

/**
 * given a course code eg."EECS 1021", return a normalized course object or null.
 */
export async function getCourseData(courseCode) {
  const [dept, num] = courseCode.split(' ');
  const list = await loadDepartment(dept);
  if (!list.length) return null;

  const found = list.find(
    c => c.dept.toUpperCase() === dept.toUpperCase() && c.code === num
  );
  if (!found) return null;

  // normalize prereqs string into array
  const prereqs = found.prereqs
    ? found.prereqs
        .split(/,|\bor\b/i)
        .map(s => s.trim().toUpperCase())
        .filter(s => s)
        .map(parts => {
          const p = parts.split(/\s+/);
          return p.length === 2 ? `${p[0]} ${p[1]}` : parts;
        })
    : [];

  return {
    code: `${dept.toUpperCase()} ${found.code}`,
    title: found.name,
    credits: found.credit,
    prereqs,
    description: found.desc
  };
}

/**
 * bulk fetch many courses in parallel, skipping missing entries.
 * @param {string[]} codes
 * @returns Promise<Array<NormalizedCourse|null>>
 */
export function getManyCourses(codes) {
  return Promise.all(codes.map(getCourseData));
}
