/**
 * Weekly Storage
 * 
 * Enkel lagring av veckodata i localStorage (valfritt att använda)
 * För en förenklad app kan denna vara minimal
 */

const STORAGE_KEY_PREFIX = 'fb_weekly_';
const STORAGE_VERSION = '1.0';

/**
 * Sparar veckodata till localStorage
 * @param {number} year - År
 * @param {number} week - Vecka
 * @param {Object} data - Data att spara
 * @returns {boolean} - True om lyckad lagring
 */
export function saveWeekData(year, week, data) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${year}_${week}`;
    const storageData = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      year,
      week,
      data
    };
    
    localStorage.setItem(key, JSON.stringify(storageData));
    return true;
  } catch (error) {
    console.error('Kunde inte spara veckodata:', error);
    return false;
  }
}

/**
 * Hämtar veckodata från localStorage
 * @param {number} year - År
 * @param {number} week - Vecka
 * @returns {Object|null} - Sparad data eller null
 */
export function loadWeekData(year, week) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${year}_${week}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }
    
    const parsed = JSON.parse(stored);
    return parsed.data;
  } catch (error) {
    console.error('Kunde inte läsa veckodata:', error);
    return null;
  }
}

/**
 * Tar bort veckodata från localStorage
 * @param {number} year - År
 * @param {number} week - Vecka
 * @returns {boolean} - True om borttagen
 */
export function removeWeekData(year, week) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${year}_${week}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Kunde inte ta bort veckodata:', error);
    return false;
  }
}

/**
 * Hämtar alla sparade veckor
 * @returns {Array<Object>} - Lista med {year, week, timestamp}
 */
export function getAllStoredWeeks() {
  const weeks = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const stored = localStorage.getItem(key);
        const parsed = JSON.parse(stored);
        
        weeks.push({
          year: parsed.year,
          week: parsed.week,
          timestamp: parsed.timestamp
        });
      }
    }
  } catch (error) {
    console.error('Kunde inte hämta sparade veckor:', error);
  }
  
  return weeks.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.week - b.week;
  });
}

/**
 * Rensar all veckodata från localStorage
 * @returns {boolean} - True om lyckad rensning
 */
export function clearAllWeekData() {
  try {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Kunde inte rensa veckodata:', error);
    return false;
  }
}

/**
 * Kontrollerar tillgängligt lagringsutrymme
 * @returns {Object} - {used, available, percentage}
 */
export function checkStorageSpace() {
  try {
    let used = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const item = localStorage.getItem(key);
      if (item) {
        used += key.length + item.length;
      }
    }
    
    // localStorage har typiskt 5-10 MB limit
    const estimatedLimit = 5 * 1024 * 1024; // 5 MB
    
    return {
      used,
      available: estimatedLimit - used,
      percentage: Math.round((used / estimatedLimit) * 100)
    };
  } catch (error) {
    console.error('Kunde inte kontrollera lagringsutrymme:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Exporterar all veckodata som JSON
 * @returns {string} - JSON-string med all data
 */
export function exportAllData() {
  try {
    const allData = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const stored = localStorage.getItem(key);
        allData[key] = JSON.parse(stored);
      }
    }
    
    return JSON.stringify(allData, null, 2);
  } catch (error) {
    console.error('Kunde inte exportera data:', error);
    return null;
  }
}

/**
 * Importerar veckodata från JSON
 * @param {string} jsonString - JSON-string att importera
 * @returns {boolean} - True om lyckad import
 */
export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    for (const key in data) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Kunde inte importera data:', error);
    return false;
  }
}
