/**
 * Reach Calculator
 * 
 * KRITISK MODUL: Hanterar reach som ALDRIG kan summeras över veckor
 * Reach = unika personer per vecka
 * 
 * Vecka 41 reach: 100,000 unika personer
 * Vecka 42 reach: 120,000 unika personer
 * TOTALT ≠ 220,000 (många personer kan finnas i båda veckorna)
 * 
 * Korrekt aggregering: GENOMSNITT, inte summa
 */

/**
 * KRITISK VARNING: Reach kan ALDRIG summeras
 * @returns {boolean} - Alltid false
 */
export function canSumReach() {
  return false;
}

/**
 * Beräknar korrekt genomsnittlig reach över flera veckor
 * @param {Array<number>} reachValues - Array med reach-värden per vecka
 * @returns {number} - Genomsnittlig reach (avrundat)
 */
export function calculateAverageReach(reachValues) {
  if (!reachValues || reachValues.length === 0) {
    return 0;
  }
  
  const total = reachValues.reduce((sum, value) => sum + value, 0);
  return Math.round(total / reachValues.length);
}

/**
 * Beräknar genomsnittlig reach från WeeklyPageData array
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @returns {number} - Genomsnittlig reach
 */
export function calculateAverageReachFromData(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return 0;
  }
  
  const reachValues = weeklyDataArray.map(data => data.metrics.reach);
  return calculateAverageReach(reachValues);
}

/**
 * Beräknar min/max reach (utan att summera)
 * @param {Array<number>} reachValues - Array med reach-värden
 * @returns {Object} - {min, max}
 */
export function findReachRange(reachValues) {
  if (!reachValues || reachValues.length === 0) {
    return { min: 0, max: 0 };
  }
  
  return {
    min: Math.min(...reachValues),
    max: Math.max(...reachValues)
  };
}

/**
 * Validerar att användaren inte försöker summera reach felaktigt
 * @param {string} operation - Operation som försöks utföras
 * @returns {Object} - {isValid, errorMessage}
 */
export function validateReachOperation(operation) {
  const invalidOperations = ['sum', 'total', 'add', 'summa', 'totalt'];
  
  const isInvalid = invalidOperations.some(op => 
    operation.toLowerCase().includes(op)
  );
  
  if (isInvalid) {
    return {
      isValid: false,
      errorMessage: 'VARNING: Reach kan ALDRIG summeras över veckor. Använd genomsnitt istället.'
    };
  }
  
  return {
    isValid: true,
    errorMessage: null
  };
}

/**
 * Formaterar reach-värde för visning med varning
 * @param {number} reach - Reach-värde
 * @param {boolean} isAggregated - Om värdet är aggregerat över flera veckor
 * @returns {Object} - {displayValue, warning}
 */
export function formatReachForDisplay(reach, isAggregated = false) {
  const displayValue = reach.toLocaleString('sv-SE');
  
  let warning = null;
  if (isAggregated) {
    warning = 'Detta är ett genomsnittsvärde. Reach kan inte summeras över veckor.';
  }
  
  return {
    displayValue,
    warning
  };
}

/**
 * Jämför reach mellan två veckor (korrekt sätt)
 * @param {number} week1Reach - Reach för vecka 1
 * @param {number} week2Reach - Reach för vecka 2
 * @returns {Object} - {difference, percentChange, interpretation}
 */
export function compareReachBetweenWeeks(week1Reach, week2Reach) {
  const difference = week2Reach - week1Reach;
  const percentChange = week1Reach > 0 
    ? Math.round((difference / week1Reach) * 100 * 10) / 10
    : 0;
  
  let interpretation = 'neutral';
  if (percentChange > 5) {
    interpretation = 'increase';
  } else if (percentChange < -5) {
    interpretation = 'decrease';
  }
  
  return {
    difference,
    percentChange,
    interpretation
  };
}

/**
 * Beräknar reach-trender utan att summera
 * @param {Array<Object>} weeklyData - Data per vecka: [{week, reach}]
 * @returns {Object} - Trend-analys
 */
export function analyzeReachTrend(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) {
    return null;
  }
  
  // Sortera efter vecka
  const sorted = [...weeklyData].sort((a, b) => a.week - b.week);
  
  const reachValues = sorted.map(d => d.reach);
  const average = calculateAverageReach(reachValues);
  const range = findReachRange(reachValues);
  
  // Beräkna trend (första vs sista veckan)
  const firstWeek = sorted[0].reach;
  const lastWeek = sorted[sorted.length - 1].reach;
  const trendComparison = compareReachBetweenWeeks(firstWeek, lastWeek);
  
  return {
    average,
    min: range.min,
    max: range.max,
    trend: trendComparison.interpretation,
    overallChange: trendComparison.percentChange,
    weekCount: sorted.length
  };
}

/**
 * Grupperar reach per månad (korrekt med genomsnitt)
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @returns {Object} - Grupperad per månad: {monthKey: averageReach}
 */
export function groupReachByMonth(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return {};
  }
  
  // Gruppera veckor per månad
  const monthlyGroups = {};
  
  weeklyDataArray.forEach(data => {
    const monthKey = `${data.period.year}_${String(data.period.getMonthNumber()).padStart(2, '0')}`;
    
    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = [];
    }
    
    monthlyGroups[monthKey].push(data.metrics.reach);
  });
  
  // Beräkna genomsnitt per månad (KORREKT sätt att aggregera reach)
  const monthlyAverages = {};
  
  for (const monthKey in monthlyGroups) {
    monthlyAverages[monthKey] = calculateAverageReach(monthlyGroups[monthKey]);
  }
  
  return monthlyAverages;
}

/**
 * Skapar varningsmeddelande om felaktig reach-hantering upptäcks
 * @param {number} suspectedSum - Misstänkt summa (för hög för att vara genomsnitt)
 * @param {number} weekCount - Antal veckor
 * @returns {string|null} - Varningsmeddelande eller null
 */
export function detectIncorrectReachSum(suspectedSum, weekCount) {
  if (weekCount <= 1) {
    return null; // Ingen aggregering har skett
  }
  
  // Heuristik: Om värdet är mycket högre än vad som är rimligt för genomsnitt
  // (Detta är en förenklad kontroll)
  const suspiciouslyHigh = suspectedSum > 10000000; // 10M reach är ovanligt högt för genomsnitt
  
  if (suspiciouslyHigh) {
    return `VARNING: Detta reach-värde (${suspectedSum.toLocaleString()}) verkar misstänkt högt. ` +
           `Har reach summerats felaktigt över ${weekCount} veckor istället för att beräkna genomsnitt?`;
  }
  
  return null;
}

/**
 * Exporterar reach-data med korrekt formatering och varningar
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @returns {Object} - Export-klar data med metadata
 */
export function exportReachData(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return null;
  }
  
  const reachValues = weeklyDataArray.map(data => ({
    period: data.period.getDisplayString(),
    reach: data.metrics.reach,
    isAggregated: false
  }));
  
  const average = calculateAverageReach(weeklyDataArray.map(d => d.metrics.reach));
  
  return {
    weeklyReach: reachValues,
    averageReach: average,
    metadata: {
      warning: 'Reach representerar unika personer per vecka och kan INTE summeras över perioder.',
      aggregationMethod: 'average',
      weekCount: weeklyDataArray.length
    }
  };
}
