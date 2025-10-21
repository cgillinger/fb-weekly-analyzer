import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import WeeklyUploader from './components/WeeklyUploader';
import TrendAnalysisView from './components/TrendAnalysisView';

function App() {
  const [uploadedPeriods, setUploadedPeriods] = useState([]);

  const handleDataUploaded = (periods) => {
    console.log('Data uploaded:', periods);
    
    // Merge med befintliga perioder, undvik dubbletter
    const mergedPeriods = [...uploadedPeriods];
    
    periods.forEach(newPeriod => {
      const exists = mergedPeriods.some(existing => 
        existing.year === newPeriod.year && existing.week === newPeriod.week
      );
      
      if (!exists) {
        mergedPeriods.push(newPeriod);
      } else {
        console.log(`Vecka ${newPeriod.week} finns redan, hoppar över dubblett`);
      }
    });
    
    // Sortera perioder
    mergedPeriods.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.week - b.week;
    });
    
    setUploadedPeriods(mergedPeriods);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Facebook Weekly Trend Analyzer
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <WeeklyUploader onDataUploaded={handleDataUploaded} />

          {/* Trend Analysis Section */}
          {uploadedPeriods.length > 0 ? (
            <TrendAnalysisView uploadedPeriods={uploadedPeriods} />
          ) : (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">
                Ingen data uppladdad ännu
              </p>
              <p className="text-sm">
                Ladda upp vecko-CSV-filer för att se trendanalys
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-4">
          <p className="text-sm text-gray-600 text-center">
            Facebook Weekly Trend Analyzer - Endast Trendanalys-funktionalitet
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
