# Quick Test Guide ✅

## How to Test the New Features

### 1. Test Analysis Metadata Modal

**Steps:**
1. Open app → Login
2. Navigate to "New Analysis" tab
3. Upload or capture an image
4. Click "🔍 Analyze Image" button
5. **Modal appears** with form fields:
   - Analysis Name (text)
   - Total Seeds Kept (number)
   - Total Seeds Germinated (number)
   - Germination % (auto-calculated)

**Test Cases:**
- Try to submit without name → Error: "Please enter an analysis name"
- Try 0 seeds kept → Error: "Please enter valid total seeds kept"
- Try germinated > kept → Error: "Seeds germinated cannot be more than seeds kept"
- Enter valid data → Modal closes, analysis runs
- ✅ Modal should say "Analysis - [Name] #1" in results

---

### 2. Test Analysis Results with Metadata

**Expected Result Display:**
```
🌱 Seed Vigour Index (SVI)

Calculation:
Germination % = (85 / 100) × 100 = 85.00%
Avg Length = 5.23 + 3.37 = 8.60 cm
SVI = 8.60 × 85 = 731.00
```

**Verify:**
- Seeds Kept shows correct number
- Seeds Germinated shows correct number
- Germination % calculated from user input
- SVI uses new germination % (not re-calculated from plants)

---

### 3. Test History Screen

**Steps:**
1. Complete at least 2 analyses with different metadata:
   - Analysis 1: "Batch A Week 1", 100 kept, 85 germinated
   - Analysis 2: "Batch B Week 1", 100 kept, 70 germinated

2. Click "History" tab

**Expected Display:**
```
Card 1 (Newest):
  [Thumbnail] │ Batch B Week 1     #1
              │ Dec 10, 2024 2:30 PM
              │ ┌──────┬─────────┬─────┐
              │ │70%   │8.6 cm   │602  │
              │ └──────┴─────────┴─────┘

Card 2:
  [Thumbnail] │ Batch A Week 1     #2
              │ Dec 10, 2024 2:15 PM
              │ ┌──────┬─────────┬─────┐
              │ │85%   │8.6 cm   │731  │
              │ └──────┴─────────┴─────┘
```

**Verify:**
- [x] Analysis names display correctly
- [x] Run numbers are correct (#1 newest, #2 older)
- [x] Germination % shows from metadata
- [x] Average length calculated (root + shoot)
- [x] SVI calculated using germination % formula
- [x] Thumbnail images display
- [x] Date & time formatted correctly

---

### 4. Test Detail Screen

**Steps:**
1. From History, tap any analysis card

**Expected Layout:**

```
┌─ ANALYSIS INFO ─────────┐
│ Name: Batch A Week 1    │
│ Date: Dec 10, 2024      │
│ Time: 2:30 PM           │
└─────────────────────────┘

┌─ GERMINATION & VIGOUR ──┐
│ Seeds Kept      100     │
│ Germinated      85      │
│ Germination %   85%     │
│ SVI             731     │ ← Orange highlight
└─────────────────────────┘

┌─ COMPREHENSIVE ANNOTATION ─┐
│ [Full plant image]         │
│ 🔍 Tap to zoom             │
└────────────────────────────┘

┌─ AVERAGE MEASUREMENTS ──┐
│ Avg Root: 5.23 cm       │
│ Avg Shoot: 3.37 cm      │
│ Total Plants: 3         │
└─────────────────────────┘

┌─ PLANT-WISE MEASUREMENTS ──┐
│ ┌─ Plant #1 ─────────────┐ │
│ │ 🌱 Root: 5.20 cm       │ │
│ │ 🌿 Shoot: 3.40 cm      │ │
│ │ 📏 Total: 8.60 cm      │ │
│ └────────────────────────┘ │
│ ┌─ Plant #2 ─────────────┐ │
│ │ 🌱 Root: 5.25 cm       │ │
│ │ 🌿 Shoot: 3.35 cm      │ │
│ │ 📏 Total: 8.60 cm      │ │
│ └────────────────────────┘ │
│ ┌─ Plant #3 ─────────────┐ │
│ │ 🌱 Root: 5.18 cm       │ │
│ │ 🌿 Shoot: 3.38 cm      │ │
│ │ 📏 Total: 8.56 cm      │ │
│ └────────────────────────┘ │
└──────────────────────────────┘
```

**Verify:**
- [x] All sections present and readable
- [x] Metadata displayed correctly
- [x] SVI shown in orange (prominent)
- [x] Annotation image displays
- [x] All plants listed with correct measurements
- [x] Plant measurements match input data

---

### 5. Test Zoom Functionality

**Steps:**
1. In Detail Screen, tap annotation image
2. Full-screen zoom modal opens
3. Image takes up full height (scrollable)
4. Tap "✕ Close" button to return

**Verify:**
- [x] Modal opens with black background
- [x] Image displays at full resolution
- [x] Can scroll if image taller than screen
- [x] Close button returns to detail view
- [x] No performance lag

---

### 6. Test State Persistence Across Tabs

**Steps:**
1. New Analysis tab
2. Upload image
3. Remove background (optional)
4. Click History tab
5. Come back to New Analysis tab

**Verify:**
- [x] Image still there
- [x] Background removal state preserved
- [x] Rotation angle preserved
- [x] Previous analysis results still visible
- [x] No loss of data

---

### 7. Edge Cases

**Test These Scenarios:**
1. **Missing analysis_name** → Detail screen shows "—" for name
2. **0 seeds kept** → Germination % shows 0%
3. **0 seeds germinated** → Germination % shows 0%, SVI = 0
4. **No annotation image** → Detail screen skips image section
5. **No per_plant data** → Detail screen skips plant-wise section
6. **Multiple analyses same day** → Run numbers still correct
7. **Switch to History with no analyses** → Shows "No analyses yet"

---

## SVI Verification Formula

To verify SVI calculation is correct:

**Given:**
- Seeds kept: 100
- Seeds germinated: 85
- Avg root: 5.23 cm
- Avg shoot: 3.37 cm

**Calculate:**
```
Germination % = (85 / 100) × 100 = 85%
Avg Length = 5.23 + 3.37 = 8.60 cm
SVI = 8.60 × 85% = 8.60 × 0.85 = 7.31
```

**Expected in app:**
- History card: SVI = 731 (×100 for display)
- Detail screen: SVI = 731

---

## Backend Verification

### Check result.json is saved correctly:

**Path:** `debug/{user_id}/{iteration}/result.json`

**Expected structure:**
```json
{
  "analysis_name": "Batch A Week 1",
  "total_seeds_kept": 100,
  "total_seeds_germinated": 85,
  "germination_percentage": 85.0,
  "timestamp": "2024-12-10T14:30:00.000000",
  "image_id": "...",
  "total_seedlings_detected": 3,
  "statistics": {
    "avg_biggest_root_length_cm": 5.23,
    "avg_biggest_shoot_length_cm": 3.37,
    ...
  },
  "per_plant": [
    {
      "plant_id": 1,
      "biggest_root_length_cm": 5.20,
      "biggest_shoot_length_cm": 3.40,
      ...
    },
    ...
  ],
  ...
}
```

### Check /user-analyses/{user_id} endpoint:

**URL:** `http://localhost:8002/user-analyses/1`

**Expected response:**
```json
{
  "user_id": "1",
  "analyses": [
    {
      "id": "iteration_2",
      "timestamp": "2024-12-10T14:30:00.000000",
      "analysis_name": "Batch B Week 1",
      "total_seeds_kept": 100,
      "total_seeds_germinated": 70,
      "germination_percentage": 70.0,
      "image_id": "...",
      "total_seedlings_detected": 3,
      "statistics": {...},
      "per_plant": [...],
      "comprehensive_annotation": "/debug/1/iteration_2/..."
    },
    {
      "id": "iteration_1",
      "timestamp": "2024-12-10T14:15:00.000000",
      "analysis_name": "Batch A Week 1",
      ...
    }
  ],
  "total": 2
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal doesn't appear | Check that button calls `handleAnalyzeButtonPress()` |
| SVI shows 0 | Check germination % is being passed (not null) |
| History is blank | Check `/user-analyses/{user_id}` backend endpoint |
| Run numbers wrong | Backend should return newest first |
| Images don't load | Check image URLs include API_URL prefix |
| Zoom modal is black | Image URI might be invalid |
| Plant measurements missing | Check `per_plant` array in result.json |

---

## Demo Data

For testing, good example values:

**Analysis 1:**
- Name: "Batch A Week 1"
- Seeds Kept: 100
- Seeds Germinated: 85
- Expected SVI: 731 (if avg length = 8.6)

**Analysis 2:**
- Name: "Batch B Week 2"  
- Seeds Kept: 120
- Seeds Germinated: 96
- Expected SVI: 806 (if avg length = 8.6)

**Analysis 3:**
- Name: "Control Group"
- Seeds Kept: 50
- Seeds Germinated: 35
- Expected SVI: 476 (if avg length = 8.6)

---

## Success Criteria ✅

All of the following should work:

- [x] Modal appears before analysis
- [x] Metadata collected and sent to backend
- [x] Result.json contains metadata
- [x] History screen shows analysis name + run #
- [x] History screen shows germination % + SVI
- [x] Detail screen shows all metadata sections
- [x] Annotation image displays and can zoom
- [x] Plant-wise measurements display correctly
- [x] SVI calculated correctly from germination %
- [x] State persists across tab switches
- [x] No TypeScript errors
- [x] Responsive on different screen sizes

