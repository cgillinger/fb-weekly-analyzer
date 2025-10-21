/**
 * Period Validator
 * 
 * Validerar filformat week_XX.csv och CSV-innehåll
 * Säkerställer korrekt struktur med 10 kolumner
 */

import { extractWeekFromFilename, isValidWeek, isValidYear } from '../core/period_extractor.js';
import { EXPECTED_COLUMNS } from '../core/csv_processor.js';

// Validerings-konstanter
const VALIDATION_CONFIG = {
  REQUIRED_FILE_EXTENSION: '.csv',
  REQUIRED_COLUMNS_COUNT: 10,
  MIN_ROWS: 1,
  MAX_ROWS: 200, // Rimlig gräns för antal Facebook-sidor
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB max filstorlek
  ACCEPTED_FILENAME_PATTERNS: [
    /^week[_-]?\d{1,2}\.csv$/i,  // week_41.csv, week-41.csv, week41.csv
  ]
};

// Felkategorier
const ERROR_TYPES = {
  FILENAME: 'filename_error',
  FILE_FORMAT: 'file_format_error',
  CSV_STRUCTURE: 'csv_structure_error',
  DATA_CONTENT: 'data_content_error',
  PERIOD_CONFLICT: 'period_conflict_error'
};

/**
 * Validerar en enskild fil komplett
 * @param {File} file - Fil att validera
 * @param {Array<Object>} existingPeriods - Befintliga perioder för dublettskontroll
 * @returns {Promise<Object>} - Valideringsresultat
 */
export async function validateFile(file, existingPeriods = []) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    },
    period: null
  };

  try {
    // 1. Grundläggande filvalidering
    const basicValidation = validateBasicFileProperties(file);
    if (!basicValidation.isValid) {
      result.isValid = false;
      result.errors.push(...basicValidation.errors);
      result.warnings.push(...basicValidation.warnings);
      return result;
    }

    // 2. Filnamnsvalidering och period-extrahering
    const filenameValidation = validateFilenameAndExtractPeriod(file);
    if (!filenameValidation.isValid) {
      result.isValid = false;
      result.errors.push(...filenameValidation.errors);
      return result;
    }
    
    result.period = filenameValidation.period;

    // 3. Dublettskontroll mot befintliga perioder
    const duplicateCheck = checkForPeriodDuplicate(filenameValidation.period, existingPeriods);
    if (!duplicateCheck.isValid) {
      result.warnings.push(...duplicateCheck.warnings);
    }

    return result;

  } catch (error) {
    result.isValid = false;
    result.errors.push({
      type: ERROR_TYPES.FILE_FORMAT,
      message: `Oväntat fel vid validering: ${error.message}`,
      severity: 'error'
    });
    return result;
  }
}

/**
 * Validerar grundläggande filegenskaper
 * @param {File} file - Fil att validera
 * @returns {Object} - Valideringsresultat
 */
function validateBasicFileProperties(file) {
  const errors = [];
  const warnings = [];

  // Kontrollera att fil existerar
  if (!file) {
    errors.push({
      type: ERROR_TYPES.FILE_FORMAT,
      message: 'Ingen fil angiven',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Kontrollera filstorlek
  if (file.size === 0) {
    errors.push({
      type: ERROR_TYPES.FILE_FORMAT,
      message: 'Filen är tom (0 bytes)',
      severity: 'error'
    });
  }

  if (file.size > VALIDATION_CONFIG.MAX_FILE_SIZE) {
    warnings.push({
      type: ERROR_TYPES.FILE_FORMAT,
      message: `Stor fil: ${(file.size / 1024 / 1024).toFixed(2)} MB (max rekommenderat: 5 MB)`,
      severity: 'warning'
    });
  }

  // Kontrollera filtyp
  if (file.type && !file.type.includes('csv') && !file.type.includes('text')) {
    warnings.push({
      type: ERROR_TYPES.FILE_FORMAT,
      message: `Ovanlig filtyp: ${file.type} (förväntat: text/csv)`,
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validerar filnamn och extraherar period
 * @param {File} file - Fil att validera
 * @returns {Object} - Valideringsresultat
 */
function validateFilenameAndExtractPeriod(file) {
  const errors = [];

  // Kontrollera filändelse
  if (!file.name.toLowerCase().endsWith(VALIDATION_CONFIG.REQUIRED_FILE_EXTENSION)) {
    errors.push({
      type: ERROR_TYPES.FILENAME,
      message: `Fel filändelse: ${file.name} (förväntat: .csv)`,
      severity: 'error'
    });
  }

  // Kontrollera filnamnsmönster
  const matchesPattern = VALIDATION_CONFIG.ACCEPTED_FILENAME_PATTERNS.some(pattern =>
    pattern.test(file.name)
  );

  if (!matchesPattern) {
    errors.push({
      type: ERROR_TYPES.FILENAME,
      message: `Ogiltigt filnamnsformat: ${file.name} (förväntat: week_XX.csv)`,
      severity: 'error'
    });
  }

  // Extrahera veckonummer
  const week = extractWeekFromFilename(file.name);

  if (week === null) {
    errors.push({
      type: ERROR_TYPES.FILENAME,
      message: `Kunde inte extrahera veckonummer från ${file.name} (förväntat format: week_41.csv)`,
      severity: 'error'
    });
    
    return { isValid: false, errors, period: null };
  }

  // Validera veckonummer
  if (!isValidWeek(week)) {
    errors.push({
      type: ERROR_TYPES.FILENAME,
      message: `Ogiltigt veckonummer: ${week} (måste vara 1-53)`,
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    period: { week, filename: file.name }
  };
}

/**
 * Kontrollerar om period redan finns i befintliga perioder
 * @param {Object} period - Period att kontrollera
 * @param {Array<Object>} existingPeriods - Befintliga perioder
 * @returns {Object} - Valideringsresultat
 */
function checkForPeriodDuplicate(period, existingPeriods) {
  const warnings = [];

  if (!period || !existingPeriods || existingPeriods.length === 0) {
    return { isValid: true, warnings };
  }

  const duplicate = existingPeriods.find(p => p.week === period.week);

  if (duplicate) {
    warnings.push({
      type: ERROR_TYPES.PERIOD_CONFLICT,
      message: `Vecka ${period.week} finns redan uppladdad`,
      severity: 'warning',
      conflictingPeriod: duplicate
    });
  }

  return { isValid: true, warnings };
}

/**
 * Validerar CSV-struktur (används efter parsning)
 * @param {Array<string>} columns - CSV-kolumner
 * @param {number} rowCount - Antal rader
 * @returns {Object} - Valideringsresultat
 */
export function validateCSVStructure(columns, rowCount) {
  const errors = [];
  const warnings = [];

  // Kontrollera antal kolumner
  if (columns.length !== VALIDATION_CONFIG.REQUIRED_COLUMNS_COUNT) {
    errors.push({
      type: ERROR_TYPES.CSV_STRUCTURE,
      message: `Fel antal kolumner: ${columns.length} (förväntat: ${VALIDATION_CONFIG.REQUIRED_COLUMNS_COUNT})`,
      severity: 'error'
    });
  }

  // Kontrollera kolumnnamn
  const normalizedActual = columns.map(col => col.trim().toLowerCase());
  const normalizedExpected = EXPECTED_COLUMNS.map(col => col.trim().toLowerCase());

  const missingColumns = normalizedExpected.filter(exp => !normalizedActual.includes(exp));
  const extraColumns = normalizedActual.filter(act => !normalizedExpected.includes(act));

  if (missingColumns.length > 0) {
    errors.push({
      type: ERROR_TYPES.CSV_STRUCTURE,
      message: `Saknade kolumner: ${missingColumns.join(', ')}`,
      severity: 'error'
    });
  }

  if (extraColumns.length > 0) {
    warnings.push({
      type: ERROR_TYPES.CSV_STRUCTURE,
      message: `Extra kolumner ignoreras: ${extraColumns.join(', ')}`,
      severity: 'warning'
    });
  }

  // Kontrollera antal rader
  if (rowCount < VALIDATION_CONFIG.MIN_ROWS) {
    errors.push({
      type: ERROR_TYPES.CSV_STRUCTURE,
      message: `För få rader: ${rowCount} (minimum: ${VALIDATION_CONFIG.MIN_ROWS})`,
      severity: 'error'
    });
  }

  if (rowCount > VALIDATION_CONFIG.MAX_ROWS) {
    warnings.push({
      type: ERROR_TYPES.CSV_STRUCTURE,
      message: `Många rader: ${rowCount} (över ${VALIDATION_CONFIG.MAX_ROWS} kan påverka prestanda)`,
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validerar datumformat (YYYY-MM-DD)
 * @param {string} dateString - Datumsträng att validera
 * @returns {boolean}
 */
export function validateDateFormat(dateString) {
  if (!dateString) return false;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validerar att startDate kommer före endDate
 * @param {string} startDate - Startdatum
 * @param {string} endDate - Slutdatum
 * @returns {boolean}
 */
export function validateDateRange(startDate, endDate) {
  if (!validateDateFormat(startDate) || !validateDateFormat(endDate)) {
    return false;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  return start <= end;
}

/**
 * Validerar flera filer samtidigt
 * @param {FileList|Array<File>} files - Lista med filer
 * @returns {Promise<Object>} - Sammanfattat valideringsresultat
 */
export async function validateMultipleFiles(files) {
  const filesArray = Array.from(files);
  const results = await Promise.all(
    filesArray.map(file => validateFile(file, []))
  );

  const summary = {
    totalFiles: filesArray.length,
    validFiles: results.filter(r => r.isValid).length,
    invalidFiles: results.filter(r => !r.isValid).length,
    allErrors: results.flatMap(r => r.errors),
    allWarnings: results.flatMap(r => r.warnings),
    results
  };

  return summary;
}

/**
 * Skapar användarv vänligt felmeddelande
 * @param {Array<Object>} errors - Lista med fel-objekt
 * @returns {string} - Formaterat felmeddelande
 */
export function formatErrorMessage(errors) {
  if (!errors || errors.length === 0) {
    return '';
  }

  return errors.map(error => `• ${error.message}`).join('\n');
}

/**
 * Skapar användarvänligt varningsmeddelande
 * @param {Array<Object>} warnings - Lista med varnings-objekt
 * @returns {string} - Formaterat varningsmeddelande
 */
export function formatWarningMessage(warnings) {
  if (!warnings || warnings.length === 0) {
    return '';
  }

  return warnings.map(warning => `⚠ ${warning.message}`).join('\n');
}
