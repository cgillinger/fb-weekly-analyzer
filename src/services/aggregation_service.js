/**
 * Aggregation Service
 * 
 * Aggregerar veckodata på olika sätt:
 * - Summera engagements (korrekt)
 * - Beräkna genomsnitt för reach (korrekt)
 * - Aggregera veckor → månader, kvartal, år
 */

import { calculateAverageReach } from './reach_calculator.js';

/**
 * Aggregerar veckodata per sida
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @returns {Object} - Aggregerad data per sida: {pageId: aggregatedData}
 */
export function aggregateByPage(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return {};
  }
  
  const pageGroups = {};
  
  // Gruppera data per sida
  weeklyDataArray.forEach(data => {
    const pageId = data.page.pageId;
    
    if (!pageGroups[pageId]) {
      pageGroups[pageId] = {
        page: data.page,
        weeks: [],
        metrics: {
          totalEngagements: 0,
          averageReach: 0,
          weekCount: 0
        }
      };
    }
    
    pageGroups[pageId].weeks.push(data);
    pageGroups[pageId].metrics.totalEngagements += data.metrics.engagements;
    pageGroups[pageId].metrics.weekCount++;
  });
  
  // Beräkna genomsnittlig reach per sida
  for (const pageId in pageGroups) {
    const reachValues = pageGroups[pageId].weeks.map(w => w.metrics.reach);
    pageGroups[pageId].metrics.averageReach = calculateAverageReach(reachValues);
  }
  
  return pageGroups;
}

/**
 * Aggregerar veckodata per månad
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @returns {Object} - Aggregerad data per månad: {monthKey: aggregatedData}
 */
export function aggregateByMonth(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return {};
  }
  
  const monthGroups = {};
  
  // Gruppera data per månad
  weeklyDataArray.forEach(data => {
    const monthKey = `${data.period.year}_${String(data.period.getMonthNumber()).padStart(2, '0')}`;
    
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = {
        year: data.period.year,
        month: data.period.getMonthNumber(),
        monthName: data.period.getMonthName(),
        weeks: [],
        metrics: {
          totalEngagements: 0,
          averageReach: 0,
          weekCount: 0
        }
      };
    }
    
    monthGroups[monthKey].weeks.push(data);
    monthGroups[monthKey].metrics.totalEngagements += data.metrics.engagements;
    monthGroups[monthKey].metrics.weekCount++;
  });
  
  // Beräkna genomsnittlig reach per månad
  for (const monthKey in monthGroups) {
    const reachValues = monthGroups[monthKey].weeks.map(w => w.metrics.reach);
    monthGroups[monthKey].metrics.averageReach = calculateAverageReach(reachValues);
  }
  
  return monthGroups;
}

/**
 * Aggregerar veckodata per period (vecka)
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @returns {Object} - Aggregerad data per vecka: {weekKey: aggregatedData}
 */
export function aggregateByWeek(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return {};
  }
  
  const weekGroups = {};
  
  // Gruppera data per vecka (alla sidor för samma vecka)
  weeklyDataArray.forEach(data => {
    const weekKey = data.period.getPeriodKey(); // "2025_41"
    
    if (!weekGroups[weekKey]) {
      weekGroups[weekKey] = {
        period: data.period,
        pages: [],
        metrics: {
          totalEngagements: 0,
          averageReach: 0,
          pageCount: 0
        }
      };
    }
    
    weekGroups[weekKey].pages.push(data);
    weekGroups[weekKey].metrics.totalEngagements += data.metrics.engagements;
    weekGroups[weekKey].metrics.pageCount++;
  });
  
  // Beräkna genomsnittlig reach per vecka (över alla sidor)
  for (const weekKey in weekGroups) {
    const reachValues = weekGroups[weekKey].pages.map(p => p.metrics.reach);
    weekGroups[weekKey].metrics.averageReach = calculateAverageReach(reachValues);
  }
  
  return weekGroups;
}

/**
 * Summerar engagements korrekt över perioder
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @returns {number} - Total engagements
 */
export function sumEngagements(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return 0;
  }
  
  return weeklyDataArray.reduce((sum, data) => sum + data.metrics.engagements, 0);
}

/**
 * Beräknar total reach (GENOMSNITT, inte summa)
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @returns {number} - Genomsnittlig reach
 */
export function calculateTotalReach(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return 0;
  }
  
  const reachValues = weeklyDataArray.map(data => data.metrics.reach);
  return calculateAverageReach(reachValues);
}

/**
 * Skapar aggregerad sammanfattning för alla data
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @returns {Object} - Komplett sammanfattning
 */
export function createSummary(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return {
      totalWeeks: 0,
      totalPages: 0,
      metrics: {
        totalEngagements: 0,
        averageReach: 0
      }
    };
  }
  
  // Räkna unika sidor och veckor
  const uniquePages = new Set(weeklyDataArray.map(d => d.page.pageId));
  const uniqueWeeks = new Set(weeklyDataArray.map(d => d.period.getPeriodKey()));
  
  return {
    totalWeeks: uniqueWeeks.size,
    totalPages: uniquePages.size,
    totalDataPoints: weeklyDataArray.length,
    metrics: {
      totalEngagements: sumEngagements(weeklyDataArray),
      averageReach: calculateTotalReach(weeklyDataArray)
    }
  };
}

/**
 * Aggregerar data för en specifik sida över tid
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata för EN sida
 * @returns {Object} - Tidsseriedata för sidan
 */
export function aggregatePageTimeseries(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return null;
  }
  
  // Sortera efter startDate för korrekt ordning över årsskifte
  const sorted = [...weeklyDataArray].sort((a, b) => {
    return a.period.startDate.localeCompare(b.period.startDate);
  });
  
  const timeseries = sorted.map(data => ({
    period: {
      year: data.period.year,
      week: data.period.week,
      startDate: data.period.startDate,
      endDate: data.period.endDate,
      displayString: data.period.getDisplayString()
    },
    metrics: {
      reach: data.metrics.reach,
      engagements: data.metrics.engagements
    },
    status: data.status
  }));
  
  return {
    page: sorted[0].page,
    timeseries,
    summary: {
      weekCount: timeseries.length,
      totalEngagements: sumEngagements(sorted),
      averageReach: calculateTotalReach(sorted)
    }
  };
}

/**
 * Grupperar och aggregerar data för jämförelse mellan sidor
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @param {number} year - År att filtrera på
 * @param {number} week - Vecka att filtrera på
 * @returns {Array<Object>} - Sorterad lista med siddata för veckan
 */
export function aggregateForWeekComparison(weeklyDataArray, year, week) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return [];
  }
  
  // Filtrera data för specifik vecka
  const weekData = weeklyDataArray.filter(data => 
    data.period.year === year && data.period.week === week
  );
  
  // Skapa jämförelselista
  return weekData.map(data => ({
    page: data.page,
    metrics: {
      reach: data.metrics.reach,
      engagements: data.metrics.engagements
    },
    status: data.status
  }))
  .sort((a, b) => b.metrics.engagements - a.metrics.engagements); // Sortera efter engagements
}

/**
 * Beräknar procentuell fördelning av engagements mellan sidor
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata för EN vecka
 * @returns {Array<Object>} - Fördelning per sida med procent
 */
export function calculateEngagementDistribution(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return [];
  }
  
  const totalEngagements = sumEngagements(weeklyDataArray);
  
  if (totalEngagements === 0) {
    return weeklyDataArray.map(data => ({
      page: data.page,
      engagements: 0,
      percentage: 0
    }));
  }
  
  return weeklyDataArray.map(data => ({
    page: data.page,
    engagements: data.metrics.engagements,
    percentage: Math.round((data.metrics.engagements / totalEngagements) * 100 * 10) / 10
  }))
  .sort((a, b) => b.engagements - a.engagements);
}

/**
 * Aggregerar data till kvartalsvy
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @returns {Object} - Aggregerad data per kvartal: {quarterKey: aggregatedData}
 */
export function aggregateByQuarter(weeklyDataArray) {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return {};
  }
  
  const quarterGroups = {};
  
  weeklyDataArray.forEach(data => {
    const month = data.period.getMonthNumber();
    const quarter = Math.ceil(month / 3);
    const quarterKey = `${data.period.year}_Q${quarter}`;
    
    if (!quarterGroups[quarterKey]) {
      quarterGroups[quarterKey] = {
        year: data.period.year,
        quarter,
        weeks: [],
        metrics: {
          totalEngagements: 0,
          averageReach: 0,
          weekCount: 0
        }
      };
    }
    
    quarterGroups[quarterKey].weeks.push(data);
    quarterGroups[quarterKey].metrics.totalEngagements += data.metrics.engagements;
    quarterGroups[quarterKey].metrics.weekCount++;
  });
  
  // Beräkna genomsnittlig reach per kvartal
  for (const quarterKey in quarterGroups) {
    const reachValues = quarterGroups[quarterKey].weeks.map(w => w.metrics.reach);
    quarterGroups[quarterKey].metrics.averageReach = calculateAverageReach(reachValues);
  }
  
  return quarterGroups;
}

/**
 * Skapar pivot-tabell struktur (sidor som rader, veckor som kolumner)
 * @param {Array<WeeklyPageData>} weeklyDataArray - Array med veckodata
 * @param {string} metric - 'reach' eller 'engagements'
 * @returns {Object} - Pivot-tabell struktur
 */
export function createPivotTable(weeklyDataArray, metric = 'engagements') {
  if (!weeklyDataArray || weeklyDataArray.length === 0) {
    return { pages: [], weeks: [], data: {} };
  }
  
  // Få unika sidor och veckor
  const uniquePages = [...new Set(weeklyDataArray.map(d => d.page.pageId))];
  const uniqueWeeks = [...new Set(weeklyDataArray.map(d => d.period.getPeriodKey()))]
    .sort();
  
  // Skapa pivot-struktur
  const pivotData = {};
  
  weeklyDataArray.forEach(data => {
    const pageId = data.page.pageId;
    const weekKey = data.period.getPeriodKey();
    
    if (!pivotData[pageId]) {
      pivotData[pageId] = {
        page: data.page,
        weeks: {}
      };
    }
    
    pivotData[pageId].weeks[weekKey] = data.metrics[metric];
  });
  
  return {
    pages: uniquePages,
    weeks: uniqueWeeks,
    data: pivotData,
    metric
  };
}
