# Analysis Metadata Feature ✅

## Overview
Before analysis, users are now prompted to enter:
1. **Analysis Name** - Text field for naming the analysis (e.g., "Batch A - Week 1")
2. **Total Seeds Kept** - Number field for seeds started for germination
3. **Total Seeds Germinated** - Number field for seeds that germinated
4. **Germination %** - Auto-calculated: (germinated / kept) × 100

## What Changed

### Frontend Changes

#### 1. New Component: `src/components/AnalysisMetadataModal.tsx`
- Modal dialog that appears when user clicks "Analyze Image"
- Three input fields + auto-calculated germination %
- Validation:
  - Analysis name is required
  - Total seeds kept > 0
  - Total seeds germinated >= 0
  - Germinated <= Kept
- Returns metadata object on submit

#### 2. Updated: `src/AppContent.tsx`
- Added state for modal visibility and metadata
- Changed analyze button to show modal first (`handleAnalyzeButtonPress`)
- Added `handleMetadataSubmit` to receive metadata and call analysis
- Updated `analyzeImage()` to accept metadata parameter
- Sends metadata to backend:
  - `analysis_name`
  - `total_seeds_kept`
  - `total_seeds_germinated`
  - `germination_percentage`
- Stores metadata in `analysisResult` object
- Updated `calculateSVI()` to use new germination % from metadata
- Updated SVI display fields to show:
  - Total Seeds Kept (not just "Total Seeds")
  - Total Seeds Germinated
  - Germination % from metadata (not recalculated)
- Added modal to JSX return

### Backend Changes

#### Updated: `backend/main.py` `/analyze` endpoint
- Added parameters:
  ```python
  analysis_name: Optional[str] = Form(None),
  total_seeds_kept: Optional[int] = Form(None),
  total_seeds_germinated: Optional[int] = Form(None),
  germination_percentage: Optional[float] = Form(None),
  ```
- Added to response JSON:
  ```json
  {
    "analysis_name": "string",
    "total_seeds_kept": number,
    "total_seeds_germinated": number,
    "germination_percentage": number
  }
  ```
- Metadata saved to `result.json` for history

## Data Flow

```
User clicks "Analyze Image"
    ↓
Modal appears with form
    ↓
User fills:
  - Name: "Batch A Week 1"
  - Seeds Kept: 100
  - Seeds Germinated: 85
    ↓
Modal calculates: 85/100 × 100 = 85%
    ↓
User clicks "Analyze"
    ↓
Frontend sends to /analyze with:
  - analysis_name: "Batch A Week 1"
  - total_seeds_kept: 100
  - total_seeds_germinated: 85
  - germination_percentage: 85.0
  - (+ image and other params)
    ↓
Backend receives, saves to result.json
    ↓
Frontend displays results with:
  - SVI calculated using 85% (from metadata)
  - Seeds Kept: 100
  - Seeds Germinated: 85
```

## SVI Calculation (Updated)

**Old Formula:**
```
SVI = (avg_root + avg_shoot) × (detected_plants / detected_plants) × 100
```

**New Formula:**
```
Germination % = (total_seeds_germinated / total_seeds_kept) × 100
SVI = (avg_root + avg_shoot) × germination_percentage
```

Example:
- Kept: 100 seeds
- Germinated: 85 seeds
- Germination %: 85%
- Avg Root: 5.2 cm
- Avg Shoot: 3.8 cm
- SVI = (5.2 + 3.8) × 85 = 767

## History Integration

When user views analysis history:
- **Analysis Name** is displayed (instead of timestamp)
- **Germination %** is shown
- **SVI** is calculated from metadata germination %
- **Run Number** (1st, 2nd, etc.) shown based on date

## Files Changed
- ✅ Created: `src/components/AnalysisMetadataModal.tsx` (170 lines)
- ✅ Updated: `src/AppContent.tsx` (state, modal, SVI logic)
- ✅ Updated: `backend/main.py` (endpoint parameters, response fields)

## Testing Checklist
- [ ] Modal appears when clicking "Analyze Image"
- [ ] Cannot submit without name
- [ ] Cannot submit with invalid seed counts
- [ ] Germination % auto-calculates correctly
- [ ] Metadata sent to backend
- [ ] result.json contains metadata
- [ ] SVI displays correctly with new germination %
- [ ] History shows analysis name, germination %, and SVI

## Next Steps
1. ✅ Implement history screen to display analysis name + germination % + SVI
2. ✅ Show original image thumbnail in history
3. ✅ Update detail screen with plant-wise results
4. ✅ Show comprehensive annotation with zoom in detail view
