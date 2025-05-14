
/**
 * given a prereqMap: {course : prereqs}
 * returns minTerm: { code: earliestTermNumber }
 */
export function computeMinTerm(prereqMap) {
    const minTerm = {};
    // recursive helper funct that returns and caches minTerm
    const dfs = code => {
      // if minTerm is already computed for the course, return it
      if (minTerm[code] != null) return minTerm[code];
      // fetch course's direct prereqs
      const prs = prereqMap[code] || [];
      // base case: no prereqs -> can take in semester 1
      if (prs.length === 0) {
        return (minTerm[code] = 1);
      }
      // recursive case: compute earliest semester for each prereq
      const childTerms = prs.map(dfs);
      // course can only come after all its prereqs -> earliest = 1 + the latest prereq term
      return (minTerm[code] = 1 + Math.max(...childTerms));
    };
    // Start the recursive chain for every course in the map
    Object.keys(prereqMap).forEach(dfs);
    return minTerm;
  }
  
  /**
   * compute min term -> compute weighted score -> greedily pack courses into semester
   * @param {string[]} allCodes    // all inputted courses centralized and grouped
   * @param {object} prereqMap     // {course : prereqs}
   * @param {object} creditMap     // {code: # of credits}
   * @param {object} weights       // { priorityFocus, creditSpread, heatOfDraw } from the UI Sliders
   * @param {number} idealPerTerm  // User inputted: Ideal number of courses per semester
   */
  export function planSemesters(
    allCodes,
    prereqMap,
    creditMap,
    categoryMap,
    weights,
    idealPerTerm
  ) {
    console.log('planSemesters start:', {
        count: allCodes.length,
        idealPerTerm,
        weights,
        categoryMap,
      });

    const { priorityFocus, creditSpread, heatOfDraw } = weights;
  
    // credit stats
    const avgCredit    = idealPerTerm * 3; // avg course credit weight of a YorkU course = 3
    const maxCreditCap = avgCredit + 1;  // setting maxCredit cap to +1 to enforce 'Spread Heavy' credits based of user preference
    // if creditSpread is near 1, we ignore caps; near 5 we strictly enforce (from priority slider)
    const cap = averageShiftedCap(avgCredit, maxCreditCap, creditSpread);
    // compute earliest‐term map
    const minTerm = computeMinTerm(prereqMap);
  
    // score: category + heat (user preferences)
    function score(code) {
      const category = categoryMap[code] || 'electives';
      const base =
        category === 'mandatory' ? priorityFocus :
        category === 'electives'  ? 3 :
        6 - priorityFocus; 
  
      const alpha = code.charCodeAt(0);
      const heat  = heatOfDraw < 3 ?  alpha : -alpha;
  
      return base * 100 + heat * 0.01;
    }
  
    const remaining = new Set(allCodes);
    const plan      = [];
    let   term      = 1;
    // greedy fill algorithm
    while (remaining.size) {
         // safety guard to prevent runaway loops (typically only occurs if a course in not found within the database )
        if (term > allCodes.length * 2) {
            console.warn(`Term ${term} exceeds 2× course count (${allCodes.length}), aborting to avoid infinite loop.`);
            console.warn('Forcing remaining courses into final term:', Array.from(remaining));
            plan.push(Array.from(remaining));
            break;
        }
        // 1. find all eligible courses (course that contains no prereqs and minterm <= term)
        const candidates = Array.from(remaining).filter(code =>
        minTerm[code] <= term &&
         (prereqMap[code] || []).every(p => !remaining.has(p))
        );
        if (candidates.length === 0) {
            // no courses can be taken right now, skip to next term
            term++;
            continue;
        }
        // 2. sort by score
        candidates.sort((a, b) => score(b) - score(a));
  
        // 3. greedily pick up to idealPerTerm, with respect to credit spread (user inputted preference)
        const take        = [];
        let   termCredits = 0;
        for (let code of candidates) {
            // stop if we've filled the course count
            if (take.length >= idealPerTerm) break;
  
            const cr = creditMap[code] || 0;
  
            // only take if adding it stays under our cap
            if (termCredits + cr <= cap) {
                take.push(code);
                termCredits += cr;
            }
        }
  
        // 4. fallback to count‐only greedy if preference constraints are too strict
        if (take.length === 0 && candidates.length) {
            take.push(...candidates.slice(0, idealPerTerm));
        }
    
  
      // 5. commit this term’s courses
      plan.push(take);
      take.forEach(c => remaining.delete(c));
      term++;
    }
  
    return plan;
  }
  
  /** 
   * given avgCredit, maxCap, and a [1..5] slider, 
   * return a per‐term credit count cap that interpolates between ignore credit spread, max credit cap
   */
  function averageShiftedCap(avgCredit, maxCap, balance) {
    // when balance=1 => allow up to avgCredit * 2 
    // when balance=5 => enforce maxCap
    const minCap = avgCredit * 2;
    const pct    = (balance - 1) / 4; // normalized to [0..1]
    return minCap + (maxCap - minCap) * pct;
  }