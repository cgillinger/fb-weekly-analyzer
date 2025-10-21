/**
 * CSV Processor
 * 
 * Bearbetar vecko-CSV-filer med 10 kolumner
 * Kolumner: page_id, page_name, year, week, start_date, end_date, 
 *           reach, engagements, status, comment
 */

import Papa from 'papaparse';
import { WeeklyPageData, WeeklyDataset } from './weekly_models.js';
import { extractPeriodFromCSVRow } from './period_extractor.js';

// Förväntade kolumnnamn (exakt som i CSV)
export const EXPECTED_COLUMNS = [
  'page_id',
  'page_name',
  'year',
  'week',
  'start_date',
  'end_date',
  'reach',
  'engagements',
  'status',
  'comment'
];

/**
 * Parsar CSV-fil till WeeklyDataset
 * @param {string} csvContent - CSV-innehåll som string
 * @param {string} filename - Filnamn för felmeddelanden
 * @returns {Promise<Object>} - {success, dataset, errors}
 */
export async function parseWeeklyCSV(csvContent, filename = 'unknown.csv') {
  return new Promise((resolve) => {
    const errors = [];
    const warnings = [];
    
    Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        // Validera CSV-struktur
        const structureValidation = validateCSVStructure(results, filename);
        
        if (!structureValidation.isValid) {
          resolve({
            success: false,
            dataset: null,
            errors: structureValidation.errors,
            warnings: structureValidation.warnings
          });
          return;
        }
        
        // Konvertera CSV-rader till WeeklyPageData
        const dataset = new WeeklyDataset();
        let validRows = 0;
        let invalidRows = 0;
        
        results.data.forEach((row, index) => {
          try {
            // Validera att raden har nödvändiga fält
            if (!row.page_id || !row.page_name || !row.year || !row.week) {
              warnings.push(`Rad ${index + 2}: Saknar obligatoriska fält`);
              invalidRows++;
              return;
            }
            
            // Skapa WeeklyPageData från rad
            const weeklyData = WeeklyPageData.fromCSVRow(row);
            dataset.addData(weeklyData);
            validRows++;
            
          } catch (error) {
            errors.push(`Rad ${index + 2}: ${error.message}`);
            invalidRows++;
          }
        });
        
        // Kontrollera om vi fick någon giltig data
        if (validRows === 0) {
          errors.push('Ingen giltig data hittades i CSV-filen');
          resolve({
            success: false,
            dataset: null,
            errors,
            warnings
          });
          return;
        }
        
        // Lägg till info om invalida rader som varning
        if (invalidRows > 0) {
          warnings.push(`${invalidRows} rader kunde inte parsas korrekt`);
        }
        
        resolve({
          success: true,
          dataset,
          errors,
          warnings,
          stats: {
            totalRows: results.data.length,
            validRows,
            invalidRows,
            uniquePages: dataset.getUniquePages().length,
            uniquePeriods: dataset.getUniquePeriods().length
          }
        });
      },
      error: (error) => {
        resolve({
          success: false,
          dataset: null,
          errors: [`CSV-parsningsfel: ${error.message}`],
          warnings: []
        });
      }
    });
  });
}

/**
 * Validerar CSV-struktur (kolumner, antal rader, etc.)
 * @param {Object} parseResult - Papa Parse resultat
 * @param {string} filename - Filnamn för felmeddelanden
 * @returns {Object} - {isValid, errors, warnings}
 */
function validateCSVStructure(parseResult, filename) {
  const errors = [];
  const warnings = [];
  
  // Kontrollera att parsing lyckades
  if (!parseResult.meta || !parseResult.meta.fields) {
    errors.push('Kunde inte läsa CSV-kolumner');
    return { isValid: false, errors, warnings };
  }
  
  // Kontrollera antal kolumner
  const actualColumns = parseResult.meta.fields;
  if (actualColumns.length !== EXPECTED_COLUMNS.length) {
    errors.push(
      `Fel antal kolumner: ${actualColumns.length} (förväntat: ${EXPECTED_COLUMNS.length})`
    );
  }
  
  // Kontrollera kolumnnamn
  const normalizedActual = actualColumns.map(col => col.trim().toLowerCase());
  const normalizedExpected = EXPECTED_COLUMNS.map(col => col.trim().toLowerCase());
  
  const missingColumns = [];
  const extraColumns = [];
  
  // Hitta saknade obligatoriska kolumner
  normalizedExpected.forEach(expected => {
    if (!normalizedActual.includes(expected)) {
      missingColumns.push(expected);
    }
  });
  
  // Hitta extra kolumner
  normalizedActual.forEach(actual => {
    if (!normalizedExpected.includes(actual)) {
      extraColumns.push(actual);
    }
  });
  
  if (missingColumns.length > 0) {
    errors.push(`Saknade kolumner: ${missingColumns.join(', ')}`);
  }
  
  if (extraColumns.length > 0) {
    warnings.push(`Extra kolumner ignoreras: ${extraColumns.join(', ')}`);
  }
  
  // Kontrollera antal rader
  const rowCount = parseResult.data?.length || 0;
  if (rowCount < 1) {
    errors.push('För få rader: minst 1 rad krävs');
  }
  
  if (rowCount > 200) {
    warnings.push(`Många rader: ${rowCount} (över 200 kan påverka prestanda)`);
  }
  
  // Kontrollera Papa Parse-fel
  if (parseResult.errors && parseResult.errors.length > 0) {
    const criticalErrors = parseResult.errors.filter(e => e.type === 'Quotes' || e.type === 'FieldMismatch');
    
    if (criticalErrors.length > 0) {
      errors.push(`CSV-strukturfel: ${criticalErrors.length} kritiska problem`);
    } else {
      warnings.push(`CSV-varningar: ${parseResult.errors.length} mindre problem`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Läser fil och returnerar innehåll som string
 * @param {File} file - Fil-objekt
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error(`Kunde inte läsa fil: ${file.name}`));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Bearbetar en uppladdad fil komplett
 * @param {File} file - Fil-objekt
 * @returns {Promise<Object>} - {success, dataset, filename, errors, warnings}
 */
export async function processUploadedFile(file) {
  try {
    // Läs filinnehåll
    const csvContent = await readFileAsText(file);
    
    // Parsa CSV
    const result = await parseWeeklyCSV(csvContent, file.name);
    
    return {
      ...result,
      filename: file.name
    };
    
  } catch (error) {
    return {
      success: false,
      dataset: null,
      filename: file.name,
      errors: [error.message],
      warnings: []
    };
  }
}

/**
 * Bearbetar flera filer parallellt
 * @param {FileList|Array<File>} files - Lista med filer
 * @returns {Promise<Array<Object>>} - Array med resultat per fil
 */
export async function processMultipleFiles(files) {
  const filesArray = Array.from(files);
  const promises = filesArray.map(file => processUploadedFile(file));
  
  return Promise.all(promises);
}

/**
 * Skapar test-CSV-data (för utveckling/testning)
 * @param {number} pageCount - Antal sidor
 * @param {number} week - Veckonummer
 * @param {number} year - År
 * @returns {string} - CSV-innehåll som string
 */
export function generateTestCSV(pageCount = 5, week = 41, year = 2025) {
  const headers = EXPECTED_COLUMNS;
  const rows = [headers.join(',')];
  
  const startDate = '2025-10-06';
  const endDate = '2025-10-12';
  
  for (let i = 1; i <= pageCount; i++) {
    const row = [
      `page_id_${i}`,                      // page_id
      `Test Sida ${i}`,                    // page_name
      year,                                // year
      week,                                // week
      startDate,                           // start_date
      endDate,                             // end_date
      Math.floor(Math.random() * 100000),  // reach
      Math.floor(Math.random() * 10000),   // engagements
      'OK',                                // status
      ''                                   // comment
    ];
    
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}

/**
 * Exporterar WeeklyDataset till CSV-string
 * @param {WeeklyDataset} dataset - Dataset att exportera
 * @returns {string} - CSV-innehåll som string
 */
export function exportToCSV(dataset) {
  if (!dataset || dataset.isEmpty()) {
    throw new Error('Ingen data att exportera');
  }
  
  const headers = EXPECTED_COLUMNS;
  const rows = [headers.join(',')];
  
  for (const weeklyData of dataset.data) {
    const row = [
      weeklyData.page.pageId,
      `"${weeklyData.page.pageName}"`,
      weeklyData.period.year,
      weeklyData.period.week,
      weeklyData.period.startDate,
      weeklyData.period.endDate,
      weeklyData.metrics.reach,
      weeklyData.metrics.engagements,
      weeklyData.status,
      weeklyData.comment || ''
    ];
    
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}
