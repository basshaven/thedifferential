# The Differential - Daily Medical Puzzle Generation Prompt

## Overview
You are tasked with creating a daily medical diagnostic puzzle for "The Differential" - a minimalist, NYT-style game where players diagnose medical conditions by strategically revealing clues on a 3x3 tile board.

## Game Mechanics Understanding
- **Tile Layout**: 3 columns by difficulty - Column 1: 2 easy tiles, Column 2: 3 medium tiles, Column 3: 4 hard tiles
- **Strategic Scoring**: Base 25 points. Each tile flip costs: Easy -3, Medium -2, Hard -1 
- **Key Strategy**: Easy tiles cost the MOST points but should provide the MOST valuable/pathognomonic information
- **Player Logic**: Flip easy tiles first to get the most diagnostic value per point spent
- **Guessing**: 3 attempts maximum. Bonuses: 1st correct +25, 2nd correct +10, 3rd correct +0. Wrong guesses -5 each
- **Target Score Range**: 0-100 points (encourages efficient play)

## Step-by-Step Generation Process

### Step 1: Choose Medical Discipline
Select ONE medical discipline from this comprehensive list:
- **Internal Medicine**: General medicine, hospitalist medicine
- **Cardiology**: Heart conditions, arrhythmias, heart failure
- **Pulmonology**: Respiratory diseases, critical care
- **Nephrology**: Kidney diseases, electrolyte disorders
- **Gastroenterology**: GI diseases, liver conditions
- **Endocrinology**: Diabetes, thyroid, hormonal disorders
- **Hematology**: Blood disorders, coagulation issues
- **Oncology**: Cancers, hematologic malignancies
- **Infectious Disease**: Infections, sepsis, tropical diseases
- **Rheumatology**: Autoimmune, connective tissue disorders
- **Neurology**: Brain, spinal cord, peripheral nerve conditions
- **Psychiatry**: Mental health, cognitive disorders
- **Emergency Medicine**: Acute presentations, trauma
- **Critical Care**: ICU conditions, shock states
- **Pharmacy**: Drug therapy, adverse events, pharmacokinetics, drug interactions
- **Dermatology**: Skin conditions with systemic implications
- **Ophthalmology**: Eye conditions with systemic connections
- **Otolaryngology**: ENT conditions with systemic features

**Chosen Discipline**: [State your choice clearly]

### Step 2: Select Puzzle Category and Specific Topic
First, choose the TYPE of puzzle you want to create:

#### **Available Puzzle Categories:**
1. **Medical Diagnosis (70% of puzzles)**: Diagnose a specific medical condition
   - Examples: "Sheehan's Syndrome", "Aortic Dissection", "Takotsubo Cardiomyopathy"
   
2. **Laboratory Test (20% of puzzles)**: Identify the most appropriate diagnostic test
   - Examples: "Anti-CCP Antibody", "Troponin I Assay", "HbA1c Testing"
   
3. **Drug Adverse Event (10% of puzzles)**: Identify a drug-related adverse reaction
   - Examples: "Vancomycin-induced nephrotoxicity", "Heparin-induced thrombocytopenia"

**Chosen Category**: [Select diagnosis, lab_test, or adverse_event]

Then within your chosen discipline and category, select a specific topic that is:
- **Not too common** (avoid "pneumonia" or "MI" - be more specific)
- **Not too rare** (avoid zebras unless fascinating)
- **Educationally valuable** (good learning opportunity)
- **Diagnostically challenging** (requires synthesis of multiple clues)

#### Examples by Category:
**Diagnosis Examples:**
- Instead of "pneumonia" → "Legionella pneumonia" 
- Instead of "heart failure" → "High-output heart failure"
- Instead of "anemia" → "Paroxysmal nocturnal hemoglobinuria"

**Lab Test Examples:**
- Instead of "blood test" → "Serum protein electrophoresis"
- Instead of "cardiac test" → "NT-proBNP assay"
- Instead of "infection test" → "Galactomannan antigen"

**Adverse Event Examples:**  
- Instead of "drug reaction" → "ACE inhibitor-induced angioedema"
- Instead of "antibiotic side effect" → "Fluoroquinolone-associated tendinopathy"
- Instead of "chemotherapy toxicity" → "Bleomycin pulmonary fibrosis"

**Pharmacy-Specific Examples:**
- **Diagnosis**: "Drug-induced hepatotoxicity", "Serotonin syndrome"
- **Lab Test**: "Serum drug level", "Pharmacogenomic testing"  
- **Adverse Event**: "Statins myopathy", "Warfarin bleeding", "NSAID nephrotoxicity"

**Chosen Specific Topic**: [State your choice and briefly explain why it's educational]

### Step 3: Generate Tile Clues
Create exactly 9 clues following this **strategic difficulty hierarchy** (easy tiles should be most valuable since they cost the most points):

#### Easy Tiles (2 tiles - Column 1) - MOST PATHOGNOMONIC:
- **Purpose**: Classic, characteristic features that strongly suggest the answer
- **Character limit**: ~20 characters max
- **Strategy**: Most valuable information - players pay -3 points, should get the most specific clues
- **Examples for Diagnosis**: 
  - Guillain-Barré: "Ascending paralysis", "Areflexia bilateral"
  - Takotsubo: "Apical ballooning", "Emotional stressor"
  - Kawasaki: "Strawberry tongue", "Coronary aneurysms"
- **Examples for Lab Tests**: 
  - Anti-CCP: "RA diagnosis", "Erosive changes"
  - Troponin: "Chest pain acute", "STEMI ECG"
- **Examples for Adverse Events**:
  - Vancomycin nephrotoxicity: "Serum creat rise", "Recent vanco"

#### Medium Tiles (3 tiles - Column 2) - SUPPORTIVE FEATURES:
- **Purpose**: Important associated findings, but not pathognomonic alone
- **Character limit**: ~20 characters max  
- **Strategy**: Good supporting evidence - worth the -2 point cost
- **Examples**: "Miller-Fisher variant", "CSF protein high", "Recent infection"

#### Hard Tiles (4 tiles - Column 3) - TECHNICAL/SUBTLE:
- **Purpose**: Technical details, lab values, subtle findings requiring expertise
- **Character limit**: ~20 characters max
- **Strategy**: Confirmatory details for experts - cheapest at -1 point
- **Examples**: "Anti-GQ1b positive", "Nerve conduction slow", "EMG: denervation"

**CRITICAL PRINCIPLE**: Easy tiles should be so characteristic that an expert could guess the answer from just 1-2 easy tiles. Avoid generic demographics ("35yo male") in easy tiles.

### Step 4: Create Alternative Options List
Generate 20-25 plausible alternatives based on your puzzle category:

#### For Diagnosis Puzzles:
- **The correct diagnosis** (must be included)
- **Close mimics** (conditions with similar presentations)  
- **Common conditions** (that might be considered first)
- **Red herrings** (plausible but less likely given the clues)

#### For Lab Test Puzzles:
- **The correct test** (must be included)
- **Related tests** (from same category or panel)
- **Alternative diagnostic approaches** (different tests for same condition)
- **Common first-line tests** (that might be considered initially)

#### For Adverse Event Puzzles:
- **The correct adverse event** (must be included)
- **Other side effects** of the same drug class
- **Similar adverse events** from different drugs
- **Unrelated conditions** that might present similarly

### Step 5: Tile Explanations (Post-Game)
For each tile, provide a 1-2 sentence explanation of how it relates to the diagnosis. This will be shown to users after they complete the puzzle for educational value.

## Required Output Format

```json
{
  "date": "YYYY-MM-DD",
  "discipline": "[Chosen medical discipline]",
  "category": "[diagnosis/lab_test/adverse_event]",
  "topic_rationale": "[Brief explanation of why this topic was chosen]",
  "answer": "[Exact answer - diagnosis name, test name, or adverse event]",
  "tiles": [
    {"difficulty": "easy", "clue": "[Clue text ≤20 chars]"},
    {"difficulty": "easy", "clue": "[Clue text ≤20 chars]"},
    {"difficulty": "medium", "clue": "[Clue text ≤20 chars]"},
    {"difficulty": "medium", "clue": "[Clue text ≤20 chars]"},
    {"difficulty": "medium", "clue": "[Clue text ≤20 chars]"},
    {"difficulty": "hard", "clue": "[Clue text ≤20 chars]"},
    {"difficulty": "hard", "clue": "[Clue text ≤20 chars]"},
    {"difficulty": "hard", "clue": "[Clue text ≤20 chars]"},
    {"difficulty": "hard", "clue": "[Clue text ≤20 chars]"}
  ],
  "concepts": [
    "[Correct answer]",
    "[Alternative 1 - could be differential diagnoses, other tests, or other adverse events]",
    "[Alternative 2]",
    ...
  ],
  "explanations": {
    "tile_0": "[How this easy clue relates to the answer]",
    "tile_1": "[How this easy clue relates to the answer]", 
    "tile_2": "[How this medium clue relates to the answer]",
    "tile_3": "[How this medium clue relates to the answer]",
    "tile_4": "[How this medium clue relates to the answer]",
    "tile_5": "[How this hard clue relates to the answer]",
    "tile_6": "[How this hard clue relates to the answer]",
    "tile_7": "[How this hard clue relates to the answer]",
    "tile_8": "[How this hard clue relates to the answer]"
  }
}
```

## Quality Criteria
- **Clues must be factually accurate** and evidence-based
- **Easy tiles must be pathognomonic** - characteristic features that strongly suggest the answer
- **Avoid generic demographics in easy tiles** (age/gender alone tells you nothing specific)
- **Difficulty should reflect diagnostic value**, not medical complexity
- **No abbreviations without context** (spell out what's needed)  
- **Hard tiles can be technical** but should be definitive when present
- **Ensure diagnostic coherence** - all clues should point to the answer
- **Strategic value alignment** - most expensive tiles (easy) should provide most diagnostic value

### Examples of GOOD vs BAD Easy Tiles:
**For Guillain-Barré Syndrome:**
- ✅ GOOD: "Ascending paralysis", "Areflexia bilateral" 
- ❌ BAD: "35yo male", "Hospitalized"

**For Anti-CCP Antibody Test:**
- ✅ GOOD: "RA diagnosis", "Joint erosions"
- ❌ BAD: "Blood test", "Lab ordered"

**For Vancomycin Nephrotoxicity:**
- ✅ GOOD: "Creatinine doubled", "Recent vancomycin"
- ❌ BAD: "ICU patient", "On antibiotics"

## Educational Goals
- **Promote clinical reasoning** through strategic tile selection
- **Teach diagnostic patterns** across medical specialties  
- **Highlight key differentiating features** of conditions
- **Encourage strategic thinking** (easy tiles cost more but provide most diagnostic value)
- **Provide learning moments** through post-game explanations

## Example Template Usage
```
Discipline: Hematology
Topic: Thrombotic Thrombocytopenic Purpura (TTP)
Rationale: Classic pentad presentation with high mortality if missed, excellent teaching case for hematologic emergencies

Easy tiles: "Thrombocytopenia", "Microangiopathic anemia" (pathognomonic features)
Medium tiles: "Neurologic symptoms", "Renal dysfunction", "Fever" (classic pentad components)
Hard tiles: "Schistocytes on smear", "LDH >1000", "ADAMTS13 deficiency" (technical confirmatory)
```

**Remember**: Easy tiles should be so characteristic that a hematologist could suspect TTP from just those two clues alone!

Now generate a complete puzzle following this systematic approach!