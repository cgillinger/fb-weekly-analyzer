/**
 * Metric Categorizer
 * 
 * Kategoriserar metrics i summerbara vs icke-summerbara
 * Definiera hur olika metrics ska hanteras och aggregeras
 */

/**
 * Metric-kategorier
 */
export const METRIC_CATEGORIES = {
  NON_SUMMABLE: 'non_summable',  // Kan EJ summeras (använd genomsnitt)
  SUMMABLE: 'summable',           // Kan summeras över perioder
  METADATA: 'metadata'            // Ej numeriska värden
};

/**
 * Metric-definitioner med alla egenskaper
 */
export const METRIC_DEFINITIONS = {
  reach: {
    key: 'reach',
    displayName: 'Räckvidd',
    category: METRIC_CATEGORIES.NON_SUMMABLE,
    description: 'Antal unika personer som nåddes',
    canSum: false,
    aggregationMethod: 'average',
    unit: 'personer',
    formatType: 'number',
    warningMessage: 'Reach kan ALDRIG summeras över veckor. Använd genomsnitt.'
  },
  engagements: {
    key: 'engagements',
    displayName: 'Engagemang',
    category: METRIC_CATEGORIES.SUMMABLE,
    description: 'Totalt antal interaktioner',
    canSum: true,
    aggregationMethod: 'sum',
    unit: 'interaktioner',
    formatType: 'number',
    warningMessage: null
  },
  status: {
    key: 'status',
    displayName: 'Status',
    category: METRIC_CATEGORIES.METADATA,
    description: 'Sidans status',
    canSum: false,
    aggregationMethod: 'none',
    unit: null,
    formatType: 'string',
    warningMessage: null
  },
  comment: {
    key: 'comment',
    displayName: 'Kommentar',
    category: METRIC_CATEGORIES.METADATA,
    description: 'Kommentarer',
    canSum: false,
    aggregationMethod: 'none',
    unit: null,
    formatType: 'string',
    warningMessage: null
  }
};

/**
 * Hämtar alla summerbara metrics
 * @returns {Array<string>} - Array med metric-nycklar
 */
export function getSummableMetrics() {
  return Object.keys(METRIC_DEFINITIONS).filter(
    key => METRIC_DEFINITIONS[key].category === METRIC_CATEGORIES.SUMMABLE
  );
}

/**
 * Hämtar alla icke-summerbara metrics
 * @returns {Array<string>} - Array med metric-nycklar
 */
export function getNonSummableMetrics() {
  return Object.keys(METRIC_DEFINITIONS).filter(
    key => METRIC_DEFINITIONS[key].category === METRIC_CATEGORIES.NON_SUMMABLE
  );
}

/**
 * Hämtar alla numeriska metrics (både summerbara och icke-summerbara)
 * @returns {Array<string>} - Array med metric-nycklar
 */
export function getNumericMetrics() {
  return Object.keys(METRIC_DEFINITIONS).filter(
    key => METRIC_DEFINITIONS[key].formatType === 'number'
  );
}

/**
 * Hämtar alla metadata-fält (icke-numeriska)
 * @returns {Array<string>} - Array med metric-nycklar
 */
export function getMetadataFields() {
  return Object.keys(METRIC_DEFINITIONS).filter(
    key => METRIC_DEFINITIONS[key].category === METRIC_CATEGORIES.METADATA
  );
}

/**
 * Kontrollerar om en metric kan summeras
 * @param {string} metricKey - Metric-nyckel
 * @returns {boolean}
 */
export function canSumMetric(metricKey) {
  const metric = METRIC_DEFINITIONS[metricKey];
  return metric ? metric.canSum : false;
}

/**
 * Hämtar korrekt aggregeringsmetod för en metric
 * @param {string} metricKey - Metric-nyckel
 * @returns {string} - 'sum', 'average', eller 'none'
 */
export function getAggregationMethod(metricKey) {
  const metric = METRIC_DEFINITIONS[metricKey];
  return metric ? metric.aggregationMethod : 'none';
}

/**
 * Hämtar visningsnamn för en metric
 * @param {string} metricKey - Metric-nyckel
 * @returns {string}
 */
export function getDisplayName(metricKey) {
  const metric = METRIC_DEFINITIONS[metricKey];
  return metric ? metric.displayName : metricKey;
}

/**
 * Hämtar beskrivning för en metric
 * @param {string} metricKey - Metric-nyckel
 * @returns {string}
 */
export function getDescription(metricKey) {
  const metric = METRIC_DEFINITIONS[metricKey];
  return metric ? metric.description : '';
}

/**
 * Hämtar varningsmeddelande för en metric (om det finns)
 * @param {string} metricKey - Metric-nyckel
 * @returns {string|null}
 */
export function getWarningMessage(metricKey) {
  const metric = METRIC_DEFINITIONS[metricKey];
  return metric ? metric.warningMessage : null;
}

/**
 * Formaterar metric-värde baserat på typ
 * @param {string} metricKey - Metric-nyckel
 * @param {any} value - Värde att formatera
 * @returns {string} - Formaterat värde
 */
export function formatMetricValue(metricKey, value) {
  const metric = METRIC_DEFINITIONS[metricKey];
  
  if (!metric) {
    return String(value);
  }
  
  switch (metric.formatType) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('sv-SE') : '0';
    case 'string':
      return String(value || '');
    default:
      return String(value);
  }
}

/**
 * Validerar att korrekt aggregeringsmetod används för en metric
 * @param {string} metricKey - Metric-nyckel
 * @param {string} attemptedMethod - Metod som försöks användas ('sum', 'average')
 * @returns {Object} - {isValid, errorMessage}
 */
export function validateAggregationMethod(metricKey, attemptedMethod) {
  const metric = METRIC_DEFINITIONS[metricKey];
  
  if (!metric) {
    return {
      isValid: false,
      errorMessage: `Okänd metric: ${metricKey}`
    };
  }
  
  const correctMethod = metric.aggregationMethod;
  
  if (attemptedMethod !== correctMethod) {
    return {
      isValid: false,
      errorMessage: `Felaktig aggregeringsmetod för ${metric.displayName}. ` +
                   `Använd "${correctMethod}" istället för "${attemptedMethod}". ` +
                   (metric.warningMessage || '')
    };
  }
  
  return {
    isValid: true,
    errorMessage: null
  };
}

/**
 * Skapar metric-selector options för UI
 * @param {boolean} includeMetadata - Om metadata-fält ska inkluderas
 * @returns {Array<Object>} - Array med {key, label, category} objekt
 */
export function getMetricOptions(includeMetadata = false) {
  const options = [];
  
  for (const key in METRIC_DEFINITIONS) {
    const metric = METRIC_DEFINITIONS[key];
    
    // Skippa metadata om inte önskat
    if (!includeMetadata && metric.category === METRIC_CATEGORIES.METADATA) {
      continue;
    }
    
    options.push({
      key: metric.key,
      label: metric.displayName,
      category: metric.category,
      canSum: metric.canSum
    });
  }
  
  return options;
}

/**
 * Grupperar metrics per kategori
 * @returns {Object} - Grupperade metrics: {summable: [], nonSummable: [], metadata: []}
 */
export function getMetricsByCategory() {
  return {
    summable: getSummableMetrics().map(key => ({
      key,
      ...METRIC_DEFINITIONS[key]
    })),
    nonSummable: getNonSummableMetrics().map(key => ({
      key,
      ...METRIC_DEFINITIONS[key]
    })),
    metadata: getMetadataFields().map(key => ({
      key,
      ...METRIC_DEFINITIONS[key]
    }))
  };
}

/**
 * Skapar sammanfattning av metric-egenskaper
 * @param {string} metricKey - Metric-nyckel
 * @returns {Object|null} - Komplett metric-information
 */
export function getMetricSummary(metricKey) {
  const metric = METRIC_DEFINITIONS[metricKey];
  
  if (!metric) {
    return null;
  }
  
  return {
    ...metric,
    isSummable: metric.canSum,
    isNumeric: metric.formatType === 'number',
    hasWarning: metric.warningMessage !== null
  };
}

/**
 * Kontrollerar om två metrics kan jämföras
 * @param {string} metric1Key - Första metric
 * @param {string} metric2Key - Andra metric
 * @returns {boolean}
 */
export function canCompareMetrics(metric1Key, metric2Key) {
  const metric1 = METRIC_DEFINITIONS[metric1Key];
  const metric2 = METRIC_DEFINITIONS[metric2Key];
  
  if (!metric1 || !metric2) {
    return false;
  }
  
  // Kan bara jämföra numeriska metrics
  return metric1.formatType === 'number' && metric2.formatType === 'number';
}

/**
 * Skapar tooltip-text för en metric
 * @param {string} metricKey - Metric-nyckel
 * @returns {string} - Tooltip-text
 */
export function getMetricTooltip(metricKey) {
  const metric = METRIC_DEFINITIONS[metricKey];
  
  if (!metric) {
    return '';
  }
  
  let tooltip = metric.description;
  
  if (metric.warningMessage) {
    tooltip += `\n\n⚠️ ${metric.warningMessage}`;
  }
  
  if (metric.unit) {
    tooltip += `\n\nEnhet: ${metric.unit}`;
  }
  
  tooltip += `\nAggregering: ${metric.aggregationMethod}`;
  
  return tooltip;
}
