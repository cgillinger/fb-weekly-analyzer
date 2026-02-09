/**
 * Weekly Analytics
 * 
 * Veckobaserad analys och trendberäkningar
 * Hanterar trend-beräkningar, week-over-week ändringar, statistik
 */

/**
 * Beräknar vecka-till-vecka förändring i procent
 * @param {number} currentValue - Nuvarande värde
 * @param {number} previousValue - Föregående värde
 * @returns {number} - Procentuell förändring (t.ex. 15.5 för +15.5%)
 */
export function calculateWeekOverWeekChange(currentValue, previousValue) {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }
  
  const change = ((currentValue - previousValue) / previousValue) * 100;
  return Math.round(change * 10) / 10; // Avrunda till 1 decimal
}

/**
 * Beräknar genomsnittlig trend över flera veckor
 * @param {Array<number>} values - Array med värden (sorterade i tidsordning)
 * @returns {Object} - {average, trend, changePercent}
 */
export function calculateAverageTrend(values) {
  if (!values || values.length === 0) {
    return { average: 0, trend: 'neutral', changePercent: 0 };
  }
  
  if (values.length === 1) {
    return { average: values[0], trend: 'neutral', changePercent: 0 };
  }
  
  // Beräkna genomsnitt
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Beräkna trend baserat på första och sista värdet
  const first = values[0];
  const last = values[values.length - 1];
  const changePercent = calculateWeekOverWeekChange(last, first);
  
  let trend = 'neutral';
  if (changePercent > 5) {
    trend = 'increasing';
  } else if (changePercent < -5) {
    trend = 'decreasing';
  }
  
  return {
    average: Math.round(average),
    trend,
    changePercent
  };
}

/**
 * Beräknar vecka-till-vecka trend för en sidas data
 * @param {Array<WeeklyPageData>} weeklyDataArray - Sorterad array med veckodata
 * @returns {Array<Object>} - Array med trend-objekt per vecka
 */
export function calculateWeekToWeekTrend(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return [];
  }
  
  // Sortera efter startDate för korrekt ordning över årsskifte
  const sorted = [...weeklyDataArray].sort((a, b) => {
    return a.period.startDate.localeCompare(b.period.startDate);
  });
  
  const trends = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = i > 0 ? sorted[i - 1] : null;
    
    const trend = {
      period: current.period,
      reach: current.metrics.reach,
      engagements: current.metrics.engagements,
      reachChange: previous ? calculateWeekOverWeekChange(
        current.metrics.reach,
        previous.metrics.reach
      ) : 0,
      engagementsChange: previous ? calculateWeekOverWeekChange(
        current.metrics.engagements,
        previous.metrics.engagements
      ) : 0
    };
    
    trends.push(trend);
  }
  
  return trends;
}

/**
 * Identifierar bästa och sämsta veckan för en metric
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @param {string} metric - 'reach' eller 'engagements'
 * @returns {Object} - {best, worst}
 */
export function findBestAndWorstWeek(weeklyDataArray, metric = 'reach') {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return { best: null, worst: null };
  }
  
  let best = weeklyDataArray[0];
  let worst = weeklyDataArray[0];
  
  weeklyDataArray.forEach(data => {
    const value = data.metrics[metric];
    
    if (value > best.metrics[metric]) {
      best = data;
    }
    
    if (value < worst.metrics[metric]) {
      worst = data;
    }
  });
  
  return { best, worst };
}

/**
 * Beräknar grundstatistik för en metric över flera veckor
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @param {string} metric - 'reach' eller 'engagements'
 * @returns {Object} - {min, max, average, median, total}
 */
export function calculateMetricStatistics(weeklyDataArray, metric = 'reach') {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return { min: 0, max: 0, average: 0, median: 0, total: 0 };
  }
  
  const values = weeklyDataArray.map(data => data.metrics[metric]);
  
  // Min och Max
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Total (endast meningsfullt för engagements)
  const total = values.reduce((sum, val) => sum + val, 0);
  
  // Genomsnitt
  const average = Math.round(total / values.length);
  
  // Median
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
  
  return { min, max, average, median, total };
}

/**
 * Jämför två perioder och beräknar skillnader
 * @param {Array<WeeklyPageData>} period1Data - Data för period 1
 * @param {Array<WeeklyPageData>} period2Data - Data för period 2
 * @returns {Object} - Jämförelseresultat
 */
export function comparePeriods(period1Data, period2Data) {
  const period1Stats = {
    reach: calculateMetricStatistics(period1Data, 'reach'),
    engagements: calculateMetricStatistics(period1Data, 'engagements')
  };
  
  const period2Stats = {
    reach: calculateMetricStatistics(period2Data, 'reach'),
    engagements: calculateMetricStatistics(period2Data, 'engagements')
  };
  
  return {
    period1: period1Stats,
    period2: period2Stats,
    reachChange: calculateWeekOverWeekChange(
      period2Stats.reach.average,
      period1Stats.reach.average
    ),
    engagementsChange: calculateWeekOverWeekChange(
      period2Stats.engagements.total,
      period1Stats.engagements.total
    )
  };
}

/**
 * Rankar sidor baserat på en metric för en specifik vecka
 * @param {Array<WeeklyPageData>} weeklyDataArray - Data för en vecka
 * @param {string} metric - 'reach' eller 'engagements'
 * @returns {Array<Object>} - Sorterad lista med ranking
 */
export function rankPagesByMetric(weeklyDataArray, metric = 'engagements') {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return [];
  }
  
  return weeklyDataArray
    .map((data, index) => ({
      rank: 0, // Fylls i nedan
      page: data.page,
      value: data.metrics[metric],
      status: data.status
    }))
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
}

/**
 * Identifierar sidor med konsekvent tillväxt
 * @param {Object} dataByPage - Grupperad data per sida: {pageId: [WeeklyPageData]}
 * @param {string} metric - 'reach' eller 'engagements'
 * @param {number} minWeeks - Minsta antal veckor med tillväxt
 * @returns {Array<Object>} - Sidor med konsekvent tillväxt
 */
export function findConsistentGrowth(dataByPage, metric = 'engagements', minWeeks = 2) {
  const consistentGrowthPages = [];
  
  for (const pageId in dataByPage) {
    const pageData = dataByPage[pageId];
    
    if (pageData.length < minWeeks + 1) {
      continue; // Behöver minst minWeeks + 1 datapunkter
    }
    
    // Sortera efter startDate för korrekt ordning över årsskifte
    const sorted = [...pageData].sort((a, b) => {
      return a.period.startDate.localeCompare(b.period.startDate);
    });
    
    // Räkna konsekutiva veckor med tillväxt
    let consecutiveGrowthWeeks = 0;
    let maxConsecutiveGrowth = 0;
    
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i].metrics[metric];
      const previous = sorted[i - 1].metrics[metric];
      
      if (current > previous) {
        consecutiveGrowthWeeks++;
        maxConsecutiveGrowth = Math.max(maxConsecutiveGrowth, consecutiveGrowthWeeks);
      } else {
        consecutiveGrowthWeeks = 0;
      }
    }
    
    if (maxConsecutiveGrowth >= minWeeks) {
      consistentGrowthPages.push({
        page: sorted[0].page,
        consecutiveWeeks: maxConsecutiveGrowth,
        totalWeeks: sorted.length
      });
    }
  }
  
  return consistentGrowthPages.sort((a, b) => b.consecutiveWeeks - a.consecutiveWeeks);
}

/**
 * Beräknar volatilitet (standardavvikelse) för en metric
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @param {string} metric - 'reach' eller 'engagements'
 * @returns {number} - Standardavvikelse
 */
export function calculateVolatility(weeklyDataArray, metric = 'reach') {
  if (!weeklyDataArray || weeklyDataArray.length < 2) {
    return 0;
  }
  
  const values = weeklyDataArray.map(data => data.metrics[metric]);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  const squaredDifferences = values.map(val => Math.pow(val - average, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  return Math.round(standardDeviation);
}

/**
 * Genererar sammanfattning för en sidas prestanda över flera veckor
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata för en sida
 * @returns {Object} - Sammanfattning med nyckelmetrics
 */
export function generatePageSummary(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return null;
  }
  
  const reachStats = calculateMetricStatistics(weeklyDataArray, 'reach');
  const engagementsStats = calculateMetricStatistics(weeklyDataArray, 'engagements');
  const reachBestWorst = findBestAndWorstWeek(weeklyDataArray, 'reach');
  const engagementsBestWorst = findBestAndWorstWeek(weeklyDataArray, 'engagements');
  const trends = calculateWeekToWeekTrend(weeklyDataArray);
  
  return {
    page: weeklyDataArray[0].page,
    totalWeeks: weeklyDataArray.length,
    reach: {
      ...reachStats,
      bestWeek: reachBestWorst.best?.period,
      worstWeek: reachBestWorst.worst?.period,
      volatility: calculateVolatility(weeklyDataArray, 'reach')
    },
    engagements: {
      ...engagementsStats,
      bestWeek: engagementsBestWorst.best?.period,
      worstWeek: engagementsBestWorst.worst?.period,
      volatility: calculateVolatility(weeklyDataArray, 'engagements')
    },
    trends
  };
}
