/**
 * Period Extractor
 * 
 * Extraherar year/week/datum från filnamn och CSV-data
 * Hanterar format: week_41.csv, week_42.csv etc.
 */

/**
 * Extraherar veckonummer från filnamn
 * @param {string} filename - Filnamn (t.ex. "week_41.csv")
 * @returns {number|null} - Veckonummer eller null om ogiltig
 */
export function extractWeekFromFilename(filename) {
  // Matcha format: week_XX.csv eller week_XX (utan .csv)
  const match = filename.match(/week[_-]?(\d{1,2})(?:\.csv)?$/i);
  
  if (match) {
    const week = parseInt(match[1], 10);
    
    // Validera veckonummer (1-53)
    if (week >= 1 && week <= 53) {
      return week;
    }
  }
  
  return null;
}

/**
 * Extraherar period från fil-objekt
 * @param {File} file - Fil-objekt från uppladdning
 * @returns {Object|null} - {week, filename} eller null
 */
export function extractPeriodFromFile(file) {
  if (!file || !file.name) {
    console.warn('extractPeriodFromFile: Ingen fil eller filnamn');
    return null;
  }
  
  const week = extractWeekFromFilename(file.name);
  
  if (week === null) {
    console.warn(`extractPeriodFromFile: Kunde inte extrahera vecka från ${file.name}`);
    return null;
  }
  
  return {
    week,
    filename: file.name
  };
}

/**
 * Extraherar komplett period från CSV-rad (inkluderar year, dates)
 * @param {Object} csvRow - Parsad CSV-rad
 * @returns {Object|null} - {year, week, startDate, endDate} eller null
 */
export function extractPeriodFromCSVRow(csvRow) {
  if (!csvRow) {
    return null;
  }
  
  const year = csvRow.year;
  const week = csvRow.week;
  const startDate = csvRow.start_date || csvRow['start_date'];
  const endDate = csvRow.end_date || csvRow['end_date'];
  
  // Validera att alla fält finns
  if (!year || !week || !startDate || !endDate) {
    console.warn('extractPeriodFromCSVRow: Saknar perioddata i CSV-rad', csvRow);
    return null;
  }
  
  // Validera veckonummer
  const weekNum = parseInt(week, 10);
  if (weekNum < 1 || weekNum > 53) {
    console.warn(`extractPeriodFromCSVRow: Ogiltigt veckonummer ${weekNum}`);
    return null;
  }
  
  // Validera årtal
  const yearNum = parseInt(year, 10);
  if (yearNum < 2000 || yearNum > 2100) {
    console.warn(`extractPeriodFromCSVRow: Ogiltigt årtal ${yearNum}`);
    return null;
  }
  
  return {
    year: yearNum,
    week: weekNum,
    startDate,
    endDate
  };
}

/**
 * Skapar standardformat filnamn från veckonummer
 * @param {number} week - Veckonummer (1-53)
 * @returns {string} - T.ex. "week_41.csv"
 */
export function createStandardFilename(week) {
  return `week_${week}.csv`;
}

/**
 * Validerar om veckonummer är giltigt
 * @param {number} week - Veckonummer
 * @returns {boolean}
 */
export function isValidWeek(week) {
  return Number.isInteger(week) && week >= 1 && week <= 53;
}

/**
 * Validerar om årtal är giltigt
 * @param {number} year - Årtal
 * @returns {boolean}
 */
export function isValidYear(year) {
  return Number.isInteger(year) && year >= 2000 && year <= 2100;
}

/**
 * Validerar om period är giltig
 * @param {Object} period - {year, week}
 * @returns {boolean}
 */
export function isValidPeriod(period) {
  return period && isValidYear(period.year) && isValidWeek(period.week);
}

/**
 * Extraherar perioder från flera filer
 * @param {FileList|Array<File>} files - Lista med filer
 * @returns {Array<Object>} - Lista med period-objekt
 */
export function extractPeriodsFromFiles(files) {
  if (!files || files.length === 0) {
    console.warn('extractPeriodsFromFiles: Inga filer att behandla');
    return [];
  }
  
  const periods = [];
  const filesArray = Array.from(files);
  
  for (const file of filesArray) {
    const period = extractPeriodFromFile(file);
    if (period) {
      periods.push(period);
    }
  }
  
  // Sortera efter veckonummer
  return periods.sort((a, b) => a.week - b.week);
}

/**
 * Grupperar perioder efter år
 * @param {Array<Object>} periods - Lista med period-objekt
 * @returns {Object} - Grupperade perioder: {year: [periods]}
 */
export function groupPeriodsByYear(periods) {
  const grouped = {};
  
  for (const period of periods) {
    if (!grouped[period.year]) {
      grouped[period.year] = [];
    }
    grouped[period.year].push(period);
  }
  
  // Sortera veckor inom varje år
  for (const year in grouped) {
    grouped[year].sort((a, b) => a.week - b.week);
  }
  
  return grouped;
}

/**
 * Grupperar perioder efter månad (baserat på startDate)
 * @param {Array<Object>} periods - Lista med period-objekt (med startDate)
 * @returns {Object} - Grupperade perioder: {"YYYY_MM": [periods]}
 */
export function groupPeriodsByMonth(periods) {
  const grouped = {};
  
  for (const period of periods) {
    if (!period.startDate) continue;
    
    const date = new Date(period.startDate);
    const monthKey = `${period.year}_${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(period);
  }
  
  return grouped;
}

/**
 * Hittar saknade veckor i en sekvens
 * @param {Array<Object>} periods - Lista med period-objekt
 * @returns {Array<number>} - Lista med saknade veckonummer
 */
export function findMissingWeeks(periods) {
  if (periods.length === 0) return [];
  
  const sortedPeriods = [...periods].sort((a, b) => a.week - b.week);
  const first = sortedPeriods[0];
  const last = sortedPeriods[sortedPeriods.length - 1];
  const missing = [];
  
  // Skapa set av befintliga veckor
  const existingWeeks = new Set(periods.map(p => p.week));
  
  // Hitta saknade veckor mellan första och sista
  for (let week = first.week; week <= last.week; week++) {
    if (!existingWeeks.has(week)) {
      missing.push(week);
    }
  }
  
  return missing;
}

/**
 * Validerar att en lista med perioder inte har dubletter
 * @param {Array<Object>} periods - Lista med period-objekt
 * @returns {Object} - {isValid, duplicates}
 */
export function validatePeriodSequence(periods) {
  const result = {
    isValid: true,
    duplicates: []
  };
  
  if (periods.length === 0) {
    return result;
  }
  
  const seenPeriods = new Set();
  
  for (const period of periods) {
    const periodKey = `${period.year}_${period.week}`;
    
    if (seenPeriods.has(periodKey)) {
      result.duplicates.push(period);
      result.isValid = false;
    } else {
      seenPeriods.add(periodKey);
    }
  }
  
  return result;
}

/**
 * Formaterar period för visning
 * @param {Object} period - Period objekt {year, week, startDate, endDate}
 * @returns {string} - T.ex. "Vecka 41 (2025-10-06 → 2025-10-12)"
 */
export function formatPeriodForDisplay(period) {
  if (!period) {
    return 'Ogiltig period';
  }
  
  if (period.startDate && period.endDate) {
    return `Vecka ${period.week} (${period.startDate} → ${period.endDate})`;
  }
  
  if (period.year) {
    return `Vecka ${period.week}, ${period.year}`;
  }
  
  return `Vecka ${period.week}`;
}

/**
 * Formaterar kort period-sträng
 * @param {Object} period - Period objekt
 * @returns {string} - T.ex. "V41 2025"
 */
export function formatPeriodShort(period) {
  if (!period) {
    return 'Ogiltig period';
  }
  
  if (period.year) {
    return `V${period.week} ${period.year}`;
  }
  
  return `V${period.week}`;
}
