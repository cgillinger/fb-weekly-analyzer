# 📊 Facebook Weekly Trend Analyzer

**FÖRENKLAD VERSION** - Fokuserad webbapp för trendanalys av Facebook veckodata.

## 🎯 Projektöversikt

### Syfte
Visualisera veckodata från Facebook API med fokus på:
- Trendanalys över veckor (linjediagram)
- Jämförelse mellan Facebook-sidor
- Korrekt hantering av summerbara vs icke-summerbara metrics

### Funktionalitet
✅ **Endast Trendanalys-vy** - ingen komplex navigation  
✅ Upload av vecko-CSV-filer  
✅ Interaktivt linjediagram med veckofilter  
✅ Export till PNG  

### Dataformat
- **CSV-filer:** Veckodata (t.ex. `week_41.csv`, `week_42.csv`)
- **Kolumner (10 st):** page_id, page_name, year, week, start_date, end_date, reach, engagements, status, comment
- **Storlek:** ~72 rader per fil (en rad per Facebook-sida)

### Kritiska datahanteringsregler
- ⚠️ **Reach:** KAN ALDRIG summeras över veckor (unika personer per vecka)
- ✅ **Engagements:** Kan summeras över veckor
- 📅 **Period:** year + week + datumspan (start_date, end_date)

## 🛠️ Teknisk Stack

- **React 18** - UI-bibliotek
- **Vite** - Byggverktyg och utvecklingsserver
- **TailwindCSS** - Styling och design system
- **Radix UI** - Tillgängliga UI-komponenter
- **PapaParse** - CSV-parsning och validering
- **Lucide React** - Ikoner
- **XLSX** - Excel-export funktionalitet

## 🏗️ Projektstruktur (Förenklad)

```
fb-weekly-analyzer/
├── src/
│   ├── core/                      # Kärnlogik (FAS 2)
│   │   ├── weekly_models.js       # Datastrukturer för veckoserier
│   │   ├── period_extractor.js    # Extrahera year/week från filnamn
│   │   └── csv_processor.js       # Bearbeta vecko-CSV:er
│   ├── services/                  # Business logic (FAS 3)
│   │   ├── weekly_analytics.js    # Veckobaserad analys
│   │   ├── reach_calculator.js    # Hantera icke-summerbar Reach
│   │   └── aggregation_service.js # Aggregera veckor → månader
│   ├── components/                # React-komponenter
│   │   ├── WeeklyUploader.jsx     # Multi-CSV uppladdning (FAS 5)
│   │   ├── TrendAnalysisView.jsx  # Trend-visualiseringar (FAS 5)
│   │   └── ui/                    # UI-komponenter ✅ KLARA
│   ├── utils/                     # Hjälpfunktioner (FAS 4)
│   │   ├── weekly_storage.js      # Veckovis lagring (valfritt)
│   │   ├── period_validator.js    # Validera filnamn och struktur
│   │   └── metric_categorizer.js  # Kategorisera metrics
│   └── lib/                       # Generella utilities ✅ KLAR
└── public/                        # Statiska assets ✅ KLAR
```

## 🚀 Installation och Utveckling

### Förutsättningar
- Node.js (v18 eller senare)
- npm eller yarn

### Installationssteg

1. **Installera dependencies**
   ```bash
   cd fb-weekly-analyzer
   npm install
   ```

2. **Starta utvecklingsserver**
   ```bash
   npm run dev
   ```

3. **Bygga för produktion**
   ```bash
   npm run build
   ```

4. **Förhandsgranska produktionsbygge**
   ```bash
   npm run preview
   ```

## 📋 Utvecklingsfaser

### ✅ FAS 1: GRUNDKONFIGURATION (KLAR)
- [x] Komplett projektstruktur
- [x] package.json med alla dependencies
- [x] Konfigurationsfiler (Vite, Tailwind, PostCSS)
- [x] UI-komponenter från månadsappen
- [x] Global styling
- [x] Bas App.jsx struktur

### 🔄 FAS 2: DATAHANTERING (CORE)
- [ ] weekly_models.js - Datastrukturer för veckodata
- [ ] period_extractor.js - Extrahera year/week från filnamn
- [ ] csv_processor.js - Parsa och validera CSV-data (10 kolumner)

### 🔄 FAS 3: BUSINESS LOGIC (SERVICES)
- [ ] weekly_analytics.js - Veckobaserad analys
- [ ] reach_calculator.js - Hantera icke-summerbar Reach
- [ ] aggregation_service.js - Korrekta aggregeringar

### 🔄 FAS 4: UTILITIES OCH LAGRING
- [ ] weekly_storage.js - Datalagring (valfritt)
- [ ] period_validator.js - Filnamnsvalidering (week_XX.csv)
- [ ] metric_categorizer.js - Metric-kategorisering

### 🔄 FAS 5: UPLOAD + TRENDANALYS + INTEGRATION
- [ ] WeeklyUploader.jsx - Multi-CSV uppladdning
- [ ] TrendAnalysisView.jsx - Huvudkomponent med linjediagram
- [ ] App.jsx final integration
- [ ] Export till PNG-funktion

## 📊 Veckodata vs Månadsdata

### Skillnader mot månadsappen (fb-page-analyzer):

| Aspekt | Månadsapp | Veckoapp |
|--------|-----------|----------|
| **Kolumner** | 9 | 10 |
| **Period** | År + månad | År + vecka + datumspan |
| **Filnamn** | FB_YYYY_MM.csv | week_XX.csv |
| **Metrics** | 5 summerbara | 1 summerbar (endast engagements) |
| **Vyer** | 4 st (tabs) | 1 st (endast trend) |
| **Datum** | Implicit | Explicit (start_date, end_date) |

### CSV-struktur (veckodata):
```csv
page_id,page_name,year,week,start_date,end_date,reach,engagements,status,comment
136111959774049,P4 DANS,2025,41,2025-10-06,2025-10-12,151433,10370,OK,
```

## 🎨 Design System

### Färgschema
- **Primary:** Facebook blå (#1877F2)
- **Bakgrund:** Ljusgrå för kontrast
- **Accent:** Variations av Facebook blå för interaktiva element

### Komponenter
Alla UI-komponenter återanvända från månadsappen (Radix UI + Tailwind CSS).

## 📊 Datahantering

### Viktiga datahanteringsregler
1. **Filnamn:** Format `week_XX.csv` (t.ex. week_41.csv)
2. **Reach:** Visa som genomsnitt, summera ALDRIG över veckor
3. **Engagements:** Kan summeras för totaler över veckor
4. **Validering:** Kontrollera att alla 10 kolumner finns

## 🔧 Utvecklaranteckningar

### Baserad på
- **fb-page-analyzer** (månadsappen)
- Återanvänder UI-komponenter, lib, styles
- Förenklad version med endast trendanalys

### Namnkonventioner
- **Filer:** camelCase för JS, PascalCase för React-komponenter
- **Funktioner:** Veckospecifika namn (weekly_analytics, WeeklyUploader)
- **Komponenter:** Tydligt vecko-fokus

## 📄 Licens

MIT License - Se LICENSE-fil för detaljer.

## 👥 Bidrag

Detta projekt utvecklas i faser enligt en detaljerad projektplan. Varje fas måste kompletteras innan nästa påbörjas.

---

**Status:** FAS 1 KOMPLETT ✅  
**Nästa steg:** Börja FAS 2 - Datahantering (Core)  
**Senast uppdaterad:** Oktober 2025
