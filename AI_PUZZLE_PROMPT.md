# The Differential - Daily Medical Puzzle Generation Prompt

## Overview
You are tasked with creating a daily medical diagnostic puzzle for "The Differential" - a minimalist, NYT-style game where players diagnose medical conditions by strategically revealing clues on a 3x3 tile board.

## Game Mechanics Understanding
- **Tile Layout**: 3 columns by difficulty - Column 1: 2 easy tiles, Column 2: 3 medium tiles, Column 3: 4 hard tiles
- **Scoring**: Base 25 points. Each tile flip costs: Easy -3, Medium -2, Hard -1 (strategy rewards flipping harder tiles first)
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

**Chosen Specific Topic**: [State your choice and briefly explain why it's educational]

### Step 3: Generate Tile Clues
Create exactly 9 clues following this distribution:

#### Easy Tiles (2 tiles - Column 1):
- **Purpose**: Basic demographics, common symptoms, obvious presentations
- **Character limit**: ~20 characters max
- **Examples**: "65yo male smoker", "Chest pain 2hrs", "High fever chills"
- **Strategy**: Information most players would expect/recognize

#### Medium Tiles (3 tiles - Column 2):
- **Purpose**: Lab values, vital signs, intermediate findings
- **Character limit**: ~20 characters max  
- **Examples**: "WBC 15k bands", "BP 80/40 mmHg", "Creatinine 2.5↑"
- **Strategy**: Requires some medical knowledge to interpret

#### Hard Tiles (4 tiles - Column 3):
- **Purpose**: Specific tests, pathognomonic findings, advanced diagnostics
- **Character limit**: ~20 characters max
- **Examples**: "Anti-GBM +", "Schizocytes on smear", "C-ANCA positive"
- **Strategy**: Definitive/confirmatory information for experts

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
- **Difficulty progression should be logical** (easy→medium→hard)
- **No abbreviations without context** (spell out what's needed)
- **Avoid overly obscure terms** in easy/medium tiles
- **Hard tiles can be very specific** but must be definitive
- **Ensure diagnostic coherence** - all clues should point to the answer
- **Cultural sensitivity** - avoid biased demographic assumptions

## Educational Goals
- **Promote clinical reasoning** through strategic tile selection
- **Teach diagnostic patterns** across medical specialties  
- **Highlight key differentiating features** of conditions
- **Encourage cost-effective diagnostic thinking** (harder tiles = better value)
- **Provide learning moments** through post-game explanations

## Example Template Usage
```
Discipline: Hematology
Topic: Thrombotic Thrombocytopenic Purpura (TTP)
Rationale: Classic pentad presentation with high mortality if missed, excellent teaching case for hematologic emergencies

Easy tiles: Demographics + obvious symptoms
Medium tiles: Basic labs + vital signs  
Hard tiles: Specific findings + confirmatory tests
```

Now generate a complete puzzle following this systematic approach!