import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { TrendingUp, Download } from 'lucide-react';
import { METRIC_DEFINITIONS } from '../utils/metric_categorizer';

// Endast dessa metrics visas (reach och engagements)
const ALLOWED_METRICS = [
  { key: 'reach', label: 'Räckvidd', canSum: false },
  { key: 'engagements', label: 'Engagemang', canSum: true }
];

// Färger för linjerna (distinkt åtskilda)
const CHART_COLORS = [
  '#2563EB', '#16A34A', '#EAB308', '#DC2626', '#7C3AED', '#EA580C',
  '#0891B2', '#BE185D', '#059669', '#7C2D12', '#4338CA', '#C2410C'
];

const TrendAnalysisView = ({ uploadedPeriods }) => {
  const [selectedMetric, setSelectedMetric] = useState('reach');
  const [selectedPages, setSelectedPages] = useState([]);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Få alla unika sidor
  const availablePages = useMemo(() => {
    if (!uploadedPeriods || uploadedPeriods.length === 0) return [];
    
    const pagesMap = new Map();
    
    uploadedPeriods.forEach(period => {
      if (period.data && Array.isArray(period.data)) {
        period.data.forEach(weeklyData => {
          const pageId = weeklyData.page.pageId;
          const pageName = weeklyData.page.pageName;
          
          if (!pagesMap.has(pageId)) {
            pagesMap.set(pageId, { pageId, pageName });
          }
        });
      }
    });
    
    return Array.from(pagesMap.values()).sort((a, b) => 
      a.pageName.localeCompare(b.pageName)
    );
  }, [uploadedPeriods]);

  // Få alla unika perioder (grupperade per månad)
  const availablePeriods = useMemo(() => {
    if (!uploadedPeriods || uploadedPeriods.length === 0) return [];
    
    return uploadedPeriods.map(period => ({
      year: period.year,
      week: period.week,
      month: period.month,
      startDate: period.startDate,
      endDate: period.endDate,
      displayString: `Vecka ${period.week} (${period.startDate})`,
      monthKey: `${period.year}-${String(period.month).padStart(2, '0')}`
    })).sort((a, b) => {
      return a.startDate.localeCompare(b.startDate);
    });
  }, [uploadedPeriods]);

  // Gruppera perioder per månad för display
  const periodsByMonth = useMemo(() => {
    const grouped = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    
    availablePeriods.forEach(period => {
      const key = period.monthKey;
      if (!grouped[key]) {
        grouped[key] = {
          label: `${monthNames[period.month - 1]} ${period.year}`,
          periods: []
        };
      }
      grouped[key].periods.push(period);
    });
    
    return grouped;
  }, [availablePeriods]);

  // Toggle alla sidor
  const toggleAllPages = () => {
    if (selectedPages.length === availablePages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(availablePages.map(p => p.pageId));
    }
  };

  // Toggle alla perioder
  const toggleAllPeriods = () => {
    if (selectedPeriods.length === availablePeriods.length) {
      setSelectedPeriods([]);
    } else {
      setSelectedPeriods(availablePeriods.map(p => `${p.year}_${p.week}`));
    }
  };

  // Generera chart data
  const chartData = useMemo(() => {
    if (selectedPages.length === 0 || selectedPeriods.length === 0) {
      return [];
    }

    const points = [];

    uploadedPeriods.forEach(period => {
      const periodKey = `${period.year}_${period.week}`;
      
      if (!selectedPeriods.includes(periodKey)) return;

      period.data.forEach(weeklyData => {
        const pageId = weeklyData.page.pageId;
        
        if (!selectedPages.includes(pageId)) return;

        const value = weeklyData.metrics[selectedMetric] || 0;

        points.push({
          periodKey,
          period: `Vecka ${period.week}`,
          week: period.week,
          year: period.year,
          startDate: period.startDate,
          pageId,
          pageName: weeklyData.page.pageName,
          value,
          metric: selectedMetric
        });
      });
    });

    return points;
  }, [uploadedPeriods, selectedPages, selectedPeriods, selectedMetric]);

  // Gruppera data per sida för linjer
  const chartLines = useMemo(() => {
    const groupedByPage = new Map();
    
    chartData.forEach(point => {
      if (!groupedByPage.has(point.pageId)) {
        groupedByPage.set(point.pageId, {
          pageId: point.pageId,
          pageName: point.pageName,
          points: [],
          color: CHART_COLORS[groupedByPage.size % CHART_COLORS.length]
        });
      }
      groupedByPage.get(point.pageId).points.push(point);
    });

    groupedByPage.forEach(line => {
      line.points.sort((a, b) => {
        return a.startDate.localeCompare(b.startDate);
      });
    });

    return Array.from(groupedByPage.values());
  }, [chartData]);

  // Beräkna Y-axel range (FIX 1: Börja från 0)
  const yAxisRange = useMemo(() => {
    if (chartData.length === 0) {
      return { min: 0, max: 100 };
    }

    const values = chartData.map(d => d.value);
    const max = Math.max(...values);
    
    // FIX 2: Beräkna "runda" max-värden
    let roundedMax;
    if (max < 10) {
      roundedMax = Math.ceil(max);
    } else if (max < 100) {
      roundedMax = Math.ceil(max / 10) * 10;
    } else if (max < 1000) {
      roundedMax = Math.ceil(max / 100) * 100;
    } else if (max < 10000) {
      roundedMax = Math.ceil(max / 1000) * 1000;
    } else if (max < 100000) {
      roundedMax = Math.ceil(max / 10000) * 10000;
    } else if (max < 1000000) {
      roundedMax = Math.ceil(max / 100000) * 100000;
    } else {
      roundedMax = Math.ceil(max / 1000000) * 1000000;
    }

    return {
      min: 0,  // ALLTID börja från 0
      max: roundedMax
    };
  }, [chartData]);

  // Handle mouse events
  const handleMouseMove = (event, point) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    setHoveredDataPoint(point);
  };

  // Export to PNG
  const handleExport = () => {
    const svg = document.getElementById('trend-chart-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `trendanalys_${selectedMetric}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!uploadedPeriods || uploadedPeriods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trendanalys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ladda upp minst en veckofil för att se trendanalys.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trendanalys
          </CardTitle>
          {chartData.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportera PNG
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Controls */}
        <div className="grid grid-cols-3 gap-4">
          {/* Column 1: Pages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                Välj Facebook-sidor ({selectedPages.length} valda)
              </h4>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                checked={selectedPages.length === availablePages.length}
                onCheckedChange={toggleAllPages}
              />
              <label className="text-sm cursor-pointer" onClick={toggleAllPages}>
                Välj alla
              </label>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded p-2">
              {availablePages.map(page => (
                <div key={page.pageId} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedPages.includes(page.pageId)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPages([...selectedPages, page.pageId]);
                      } else {
                        setSelectedPages(selectedPages.filter(id => id !== page.pageId));
                      }
                    }}
                  />
                  <label className="text-sm cursor-pointer flex-1" onClick={() => {
                    if (selectedPages.includes(page.pageId)) {
                      setSelectedPages(selectedPages.filter(id => id !== page.pageId));
                    } else {
                      setSelectedPages([...selectedPages, page.pageId]);
                    }
                  }}>
                    {page.pageName}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Metrics */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Välj datapunkt</h4>
            <div className="space-y-2">
              {ALLOWED_METRICS.map(metric => (
                <div key={metric.key} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="metric"
                    value={metric.key}
                    checked={selectedMetric === metric.key}
                    onChange={() => setSelectedMetric(metric.key)}
                    className="cursor-pointer"
                  />
                  <label
                    className="text-sm cursor-pointer"
                    onClick={() => setSelectedMetric(metric.key)}
                  >
                    {metric.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Periods */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                Välj perioder ({selectedPeriods.length} valda)
              </h4>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                checked={selectedPeriods.length === availablePeriods.length}
                onCheckedChange={toggleAllPeriods}
              />
              <label className="text-sm cursor-pointer" onClick={toggleAllPeriods}>
                Välj alla perioder
              </label>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded p-2">
              {Object.entries(periodsByMonth).map(([monthKey, monthData]) => (
                <div key={monthKey} className="space-y-1">
                  <div className="font-medium text-xs text-gray-600 mt-2">
                    {monthData.label}
                  </div>
                  {monthData.periods.map(period => {
                    const periodKey = `${period.year}_${period.week}`;
                    return (
                      <div key={periodKey} className="flex items-center space-x-2 ml-2">
                        <Checkbox
                          checked={selectedPeriods.includes(periodKey)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPeriods([...selectedPeriods, periodKey]);
                            } else {
                              setSelectedPeriods(selectedPeriods.filter(p => p !== periodKey));
                            }
                          }}
                        />
                        <label className="text-sm cursor-pointer" onClick={() => {
                          if (selectedPeriods.includes(periodKey)) {
                            setSelectedPeriods(selectedPeriods.filter(p => p !== periodKey));
                          } else {
                            setSelectedPeriods([...selectedPeriods, periodKey]);
                          }
                        }}>
                          {period.displayString}
                        </label>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box */}
        {selectedMetric && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">
              Visar: {METRIC_DEFINITIONS[selectedMetric]?.displayName || selectedMetric}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Aktuell datapunkt som visas i diagrammet
            </p>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-3">
              {chartLines.map(line => (
                <div key={line.pageId} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className="text-sm font-medium">{line.pageName}</span>
                </div>
              ))}
            </div>

            {/* SVG Chart - FIX 3 & 4: Korrigerad positionering */}
            <div className="relative">
              <svg
                id="trend-chart-svg"
                width="100%"
                height="500"
                viewBox="0 0 1000 500"
                className="border rounded bg-gray-50"
                onMouseLeave={() => setHoveredDataPoint(null)}
              >
                {/* Grid */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Y-axis labels - FIX 2: Runda värden */}
                {[0, 25, 50, 75, 100].map(percent => {
                  const yPos = 450 - (percent / 100) * 380;
                  const value = yAxisRange.min + (percent / 100) * (yAxisRange.max - yAxisRange.min);
                  return (
                    <g key={percent}>
                      <line x1="70" y1={yPos} x2="930" y2={yPos} stroke="#d1d5db" strokeWidth="1"/>
                      <text x="65" y={yPos + 4} textAnchor="end" fontSize="14" fill="#6b7280">
                        {Math.round(value).toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {chartLines[0]?.points.map((point, index) => {
                  const xPos = 70 + (index * (860 / (chartLines[0].points.length - 1 || 1)));
                  return (
                    <text
                      key={index}
                      x={xPos}
                      y="480"
                      textAnchor="middle"
                      fontSize="12"
                      fill="#6b7280"
                    >
                      V{point.week}
                    </text>
                  );
                })}

                {/* Lines and Points - Smooth curves med korrekt positionering */}
                {chartLines.map(line => {
                  const numPoints = line.points.length;
                  const xStep = 860 / (numPoints - 1 || 1);
                  
                  // Skapa smooth path med Bézier curves
                  const createSmoothPath = () => {
                    if (numPoints === 0) return '';
                    if (numPoints === 1) {
                      const xPos = 70;
                      const yPos = 450 - ((line.points[0].value - yAxisRange.min) / (yAxisRange.max - yAxisRange.min)) * 380;
                      return `M ${xPos} ${yPos}`;
                    }

                    let path = '';
                    for (let i = 0; i < numPoints; i++) {
                      const xPos = 70 + i * xStep;
                      const yPos = 450 - ((line.points[i].value - yAxisRange.min) / (yAxisRange.max - yAxisRange.min)) * 380;

                      if (i === 0) {
                        path = `M ${xPos} ${yPos}`;
                      } else {
                        const prevXPos = 70 + (i - 1) * xStep;
                        const prevYPos = 450 - ((line.points[i - 1].value - yAxisRange.min) / (yAxisRange.max - yAxisRange.min)) * 380;
                        
                        // Beräkna control points för smooth curve
                        const cp1x = prevXPos + (xPos - prevXPos) * 0.5;
                        const cp1y = prevYPos;
                        const cp2x = prevXPos + (xPos - prevXPos) * 0.5;
                        const cp2y = yPos;
                        
                        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xPos} ${yPos}`;
                      }
                    }
                    return path;
                  };
                  
                  return (
                    <g key={line.pageId}>
                      {/* Smooth line path - TJOCKARE LINJE */}
                      <path
                        d={createSmoothPath()}
                        fill="none"
                        stroke={line.color}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Points - STÖRRE PUNKTER */}
                      {line.points.map((point, i) => {
                        const xPos = 70 + i * xStep;
                        const yPos = 450 - ((point.value - yAxisRange.min) / (yAxisRange.max - yAxisRange.min)) * 380;
                        return (
                          <circle
                            key={i}
                            cx={xPos}
                            cy={yPos}
                            r="6"
                            fill={line.color}
                            stroke="white"
                            strokeWidth="3"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => handleMouseMove(e, point)}
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {/* Tooltip */}
                {hoveredDataPoint && (
                  <g>
                    {(() => {
                      const tooltipWidth = 200;
                      const tooltipHeight = 70;
                      let tooltipX = mousePosition.x + 15;
                      let tooltipY = mousePosition.y - tooltipHeight / 2;

                      if (tooltipX + tooltipWidth > 970) {
                        tooltipX = mousePosition.x - tooltipWidth - 15;
                      }
                      if (tooltipY < 15) {
                        tooltipY = mousePosition.y + 15;
                      }
                      if (tooltipY + tooltipHeight > 480) {
                        tooltipY = mousePosition.y - tooltipHeight - 15;
                      }

                      return (
                        <>
                          <rect
                            x={tooltipX}
                            y={tooltipY}
                            width={tooltipWidth}
                            height={tooltipHeight}
                            fill="rgba(0,0,0,0.85)"
                            rx="6"
                          />
                          <text x={tooltipX + 12} y={tooltipY + 20} fill="white" fontSize="13" fontWeight="bold">
                            {hoveredDataPoint.pageName}
                          </text>
                          <text x={tooltipX + 12} y={tooltipY + 38} fill="white" fontSize="12">
                            {hoveredDataPoint.period}
                          </text>
                          <text x={tooltipX + 12} y={tooltipY + 55} fill="white" fontSize="12">
                            {METRIC_DEFINITIONS[hoveredDataPoint.metric]?.displayName}: {hoveredDataPoint.value.toLocaleString()}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Välj sidor och perioder för att visa diagram</p>
            <p className="text-sm">
              {selectedPages.length === 0 && selectedPeriods.length === 0
                ? "Markera minst en Facebook-sida och period"
                : selectedPages.length === 0
                ? "Markera minst en Facebook-sida i listan ovan"
                : "Markera minst en period i listan ovan"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendAnalysisView;
