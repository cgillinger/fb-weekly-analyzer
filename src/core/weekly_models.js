/**
 * Weekly Models
 * 
 * Datastrukturer för veckobaserad Facebook-data
 * Hanterar 10 kolumner: page_id, page_name, year, week, start_date, end_date, 
 * reach, engagements, status, comment
 */

/**
 * Represents a Facebook page
 */
export class Page {
  constructor(pageId, pageName) {
    this.pageId = pageId;
    this.pageName = pageName;
  }

  /**
   * Create Page from CSV row
   * @param {Object} csvRow - Parsed CSV row
   * @returns {Page}
   */
  static fromCSVRow(csvRow) {
    const pageId = csvRow.page_id || csvRow['page_id'];
    const pageName = csvRow.page_name || csvRow['page_name'] || 'Okänd sida';
    
    return new Page(pageId, pageName);
  }
}

/**
 * Represents a week period with dates
 */
export class WeekPeriod {
  constructor(year, week, startDate, endDate) {
    this.year = parseInt(year);
    this.week = parseInt(week);
    this.startDate = startDate; // YYYY-MM-DD format
    this.endDate = endDate;     // YYYY-MM-DD format
  }

  /**
   * Create WeekPeriod from CSV row
   * @param {Object} csvRow - Parsed CSV row
   * @returns {WeekPeriod}
   */
  static fromCSVRow(csvRow) {
    const year = csvRow.year;
    const week = csvRow.week;
    const startDate = csvRow.start_date || csvRow['start_date'];
    const endDate = csvRow.end_date || csvRow['end_date'];
    
    return new WeekPeriod(year, week, startDate, endDate);
  }

  /**
   * Get formatted period string
   * @returns {string} - E.g. "Vecka 41 (2025-10-06 → 2025-10-12)"
   */
  getDisplayString() {
    return `Vecka ${this.week} (${this.startDate} → ${this.endDate})`;
  }

  /**
   * Get short display string
   * @returns {string} - E.g. "V41 2025"
   */
  getShortString() {
    return `V${this.week} ${this.year}`;
  }

  /**
   * Get period key for storage/comparison
   * @returns {string} - E.g. "2025_41"
   */
  getPeriodKey() {
    return `${this.year}_${this.week}`;
  }

  /**
   * Get month name from start_date
   * @returns {string} - E.g. "Oktober"
   */
  getMonthName() {
    const months = [
      'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
    ];
    
    const date = new Date(this.startDate);
    return months[date.getMonth()];
  }

  /**
   * Get month number (1-12) from start_date
   * @returns {number}
   */
  getMonthNumber() {
    const date = new Date(this.startDate);
    return date.getMonth() + 1; // JavaScript months are 0-indexed
  }
}

/**
 * Represents weekly metrics for a page
 */
export class WeeklyMetrics {
  constructor(reach, engagements) {
    this.reach = parseInt(reach) || 0;           // KAN EJ summeras över veckor
    this.engagements = parseInt(engagements) || 0; // KAN summeras över veckor
  }

  /**
   * Create WeeklyMetrics from CSV row
   * @param {Object} csvRow - Parsed CSV row
   * @returns {WeeklyMetrics}
   */
  static fromCSVRow(csvRow) {
    const reach = csvRow.reach;
    const engagements = csvRow.engagements;
    
    return new WeeklyMetrics(reach, engagements);
  }

  /**
   * Check if reach can be summed (ALWAYS FALSE for reach)
   * @returns {boolean}
   */
  canSumReach() {
    return false; // KRITISKT: Reach är unika personer per vecka
  }

  /**
   * Check if engagements can be summed (ALWAYS TRUE)
   * @returns {boolean}
   */
  canSumEngagements() {
    return true;
  }
}

/**
 * Represents complete weekly data for a page
 */
export class WeeklyPageData {
  constructor(page, period, metrics, status, comment) {
    this.page = page;         // Page object
    this.period = period;     // WeekPeriod object
    this.metrics = metrics;   // WeeklyMetrics object
    this.status = status;     // String: "OK", "NO_ACTIVITY", etc.
    this.comment = comment;   // String or null
  }

  /**
   * Create WeeklyPageData from CSV row
   * @param {Object} csvRow - Parsed CSV row
   * @returns {WeeklyPageData}
   */
  static fromCSVRow(csvRow) {
    const page = Page.fromCSVRow(csvRow);
    const period = WeekPeriod.fromCSVRow(csvRow);
    const metrics = WeeklyMetrics.fromCSVRow(csvRow);
    const status = csvRow.status || 'UNKNOWN';
    const comment = csvRow.comment || null;
    
    return new WeeklyPageData(page, period, metrics, status, comment);
  }

  /**
   * Get unique identifier for this data point
   * @returns {string} - E.g. "2025_41_12345678"
   */
  getUniqueId() {
    return `${this.period.getPeriodKey()}_${this.page.pageId}`;
  }

  /**
   * Check if page has activity this week
   * @returns {boolean}
   */
  hasActivity() {
    return this.status === 'OK' && (this.metrics.reach > 0 || this.metrics.engagements > 0);
  }
}

/**
 * Represents a collection of weekly data (multiple weeks/pages)
 */
export class WeeklyDataset {
  constructor(weeklyDataArray = []) {
    this.data = weeklyDataArray; // Array of WeeklyPageData
  }

  /**
   * Add weekly data
   * @param {WeeklyPageData} weeklyData
   */
  addData(weeklyData) {
    this.data.push(weeklyData);
  }

  /**
   * Get all unique pages in dataset
   * @returns {Array<Page>}
   */
  getUniquePages() {
    const pagesMap = new Map();
    
    this.data.forEach(item => {
      if (!pagesMap.has(item.page.pageId)) {
        pagesMap.set(item.page.pageId, item.page);
      }
    });
    
    return Array.from(pagesMap.values());
  }

  /**
   * Get all unique periods in dataset
   * @returns {Array<WeekPeriod>}
   */
  getUniquePeriods() {
    const periodsMap = new Map();
    
    this.data.forEach(item => {
      const key = item.period.getPeriodKey();
      if (!periodsMap.has(key)) {
        periodsMap.set(key, item.period);
      }
    });
    
    // Sort by year and week
    return Array.from(periodsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.week - b.week;
    });
  }

  /**
   * Get data for specific page
   * @param {string} pageId
   * @returns {Array<WeeklyPageData>}
   */
  getDataForPage(pageId) {
    return this.data.filter(item => item.page.pageId === pageId);
  }

  /**
   * Get data for specific period
   * @param {number} year
   * @param {number} week
   * @returns {Array<WeeklyPageData>}
   */
  getDataForPeriod(year, week) {
    return this.data.filter(item => 
      item.period.year === year && item.period.week === week
    );
  }

  /**
   * Get total number of data points
   * @returns {number}
   */
  size() {
    return this.data.length;
  }

  /**
   * Check if dataset is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.data.length === 0;
  }
}

/**
 * Utility functions for weekly data
 */

/**
 * Group weekly data by month
 * @param {Array<WeeklyPageData>} weeklyDataArray
 * @returns {Object} - Grouped by "YYYY_MM" keys
 */
export function groupByMonth(weeklyDataArray) {
  const grouped = {};
  
  weeklyDataArray.forEach(item => {
    const monthKey = `${item.period.year}_${String(item.period.getMonthNumber()).padStart(2, '0')}`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    
    grouped[monthKey].push(item);
  });
  
  return grouped;
}

/**
 * Calculate average reach for multiple weeks (correct way to aggregate reach)
 * @param {Array<WeeklyPageData>} weeklyDataArray
 * @returns {number}
 */
export function calculateAverageReach(weeklyDataArray) {
  if (weeklyDataArray.length === 0) return 0;
  
  const totalReach = weeklyDataArray.reduce((sum, item) => sum + item.metrics.reach, 0);
  return Math.round(totalReach / weeklyDataArray.length);
}

/**
 * Calculate total engagements for multiple weeks (correct aggregation)
 * @param {Array<WeeklyPageData>} weeklyDataArray
 * @returns {number}
 */
export function calculateTotalEngagements(weeklyDataArray) {
  return weeklyDataArray.reduce((sum, item) => sum + item.metrics.engagements, 0);
}
