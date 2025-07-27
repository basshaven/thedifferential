# The Differential - Focused Medical Content Generation Prompt

## Overview
You are tasked with creating medical puzzle content for "The Differential" - a minimalist, NYT-style game where players diagnose medical conditions by strategically revealing clues on a 3x3 tile board.

**IMPORTANT**: The medical discipline and puzzle category have already been deterministically selected. Your job is to create excellent medical content for the specified topic.

## Game Mechanics Understanding
- **Tile Layout**: 3 columns by difficulty - Column 1: 2 easy tiles, Column 2: 3 medium tiles, Column 3: 4 hard tiles
- **Strategic AUEC Scoring**: Easy tiles cost 8 but give 2 info (0.25 efficiency), Medium cost 4 give 4 info (1.0 efficiency), Hard cost 1 give 9 info (9.0 efficiency)
- **Key Strategy**: Expert diagnosticians prioritize hard tiles (9x more efficient than easy tiles)
- **Player Logic**: Smart players flip hard tiles first to maximize diagnostic efficiency
- **Guessing**: 3 attempts maximum. Wrong guesses cost 10 points
- **Target**: Reward players who think like expert diagnosticians

## Content Generation Process

### Step 1: Topic Analysis
You will be given:
- **Required Discipline**: [DISCIPLINE_PLACEHOLDER]
- **Required Category**: [CATEGORY_PLACEHOLDER] 
- **Specific Instructions**: [SPECIFIC_INSTRUCTIONS_PLACEHOLDER]

Analyze this topic and explain why it makes a good educational puzzle.

### Step 2: Generate Tile Clues
Create exactly 9 clues following this **expert diagnostic hierarchy** (hard tiles should contain the most diagnostically valuable information):

#### Easy Tiles (2 tiles - Column 1) - OBVIOUS FEATURES:
- **Purpose**: Basic, general signs/symptoms that are present but not specific
- **Character limit**: ≤20 characters max
- **Strategy**: Low diagnostic value per cost - obvious findings that novices would order first
- **Information content**: Common findings that could suggest many conditions
- **Examples for Diagnosis**: 
  - Guillain-Barré: "Muscle weakness", "Fatigue onset"
  - Takotsubo: "Chest pain", "Dyspnea acute"
  - Kawasaki: "Fever high", "Irritability"
- **Examples for Lab Tests**: 
  - Anti-CCP: "Joint swelling", "Morning stiffness"
  - Troponin: "Chest discomfort", "SOB sudden"
- **Examples for Adverse Events**:
  - Vancomycin nephrotoxicity: "Decreased UO", "Recent surgery"

#### Medium Tiles (3 tiles - Column 2) - SUPPORTIVE FEATURES:
- **Purpose**: More specific findings that narrow the differential
- **Character limit**: ≤20 characters max  
- **Strategy**: Moderate diagnostic value - useful but not pathognomonic
- **Information content**: Findings that suggest a category of conditions
- **Examples for Diagnosis**:
  - Guillain-Barré: "CSF protein high", "Nerve conduction", "Miller Fisher"
  - Takotsubo: "Troponin mild", "ECG changes ST", "Wall motion abn"
- **Examples for Lab Tests**:
  - Anti-CCP: "RF positive", "X-ray erosions", "Symmetric joints"
- **Examples for Adverse Events**:
  - Vancomycin nephrotoxicity: "Trough level high", "Daily dosing", "ICU patient"

#### Hard Tiles (4 tiles - Column 3) - EXPERT-LEVEL INSIGHTS:
- **Purpose**: Pathognomonic findings, expert-level details that clinch the diagnosis
- **Character limit**: ≤20 characters max
- **Strategy**: Maximum diagnostic value per cost - what expert diagnosticians look for
- **Information content**: Specific findings that are nearly diagnostic
- **Examples for Diagnosis**:
  - Guillain-Barré: "Cytoalbuminous", "F wave absent", "Anti-GQ1b Ab", "Campylobacter Hx"
  - Takotsubo: "Apical ballooning", "No CAD", "Stress trigger", "Midventricular"
- **Examples for Lab Tests**:
  - Anti-CCP: "Citrullination", "Pre-clinical RA", "HLA-DRB1", "ACPA positive"
- **Examples for Adverse Events**:  
  - Vancomycin nephrotoxicity: "AIN biopsy", "Tubular necrosis", "Non-oliguric", "Red man syndrome"

### Step 3: Generate Differential Diagnoses
Create a list of 20-25 plausible alternative diagnoses that a medical professional might reasonably consider. These should be:
- **Medically accurate** alternatives within the same clinical presentation
- **Appropriately challenging** - not obvious exclusions
- **Educationally valuable** - good learning opportunities
- **Realistic** differential considerations

### Step 4: Create Educational Explanations
For each of the 9 tiles, write a clear explanation (50-150 words) that:
- **Explains the medical significance** of the clue
- **Connects it to the correct answer** specifically 
- **Provides educational context** about why this finding matters
- **Uses appropriate medical terminology** but remains accessible

### Step 5: Quality Validation
Ensure your content meets these standards:
- **Medical accuracy**: All clues and explanations are factually correct
- **Appropriate difficulty progression**: Easy → Medium → Hard represents increasingly specific/expert findings
- **Character limits**: All clues ≤20 characters
- **Educational value**: Players will learn something meaningful
- **Diagnostic logic**: The clues logically build toward the answer

## Required JSON Output Format

Return ONLY valid JSON in this exact format:

```json
{
  "date": "YYYY-MM-DD",
  "discipline": "Assigned Discipline",
  "category": "Assigned Category", 
  "topic_rationale": "Brief explanation of why this topic was chosen and its educational value",
  "answer": "Specific Answer",
  "acceptable_answers": [
    "Primary Answer",
    "Common Abbreviation",
    "Alternative Name 1",
    "Alternative Name 2"
  ],
  "tiles": [
    {"difficulty": "easy", "clue": "First easy clue"},
    {"difficulty": "easy", "clue": "Second easy clue"},
    {"difficulty": "medium", "clue": "First medium clue"},
    {"difficulty": "medium", "clue": "Second medium clue"},
    {"difficulty": "medium", "clue": "Third medium clue"},
    {"difficulty": "hard", "clue": "First hard clue"},
    {"difficulty": "hard", "clue": "Second hard clue"},
    {"difficulty": "hard", "clue": "Third hard clue"},
    {"difficulty": "hard", "clue": "Fourth hard clue"}
  ],
  "concepts": [
    "Primary Answer",
    "Alternative Diagnosis 1",
    "Alternative Diagnosis 2",
    ...20-25 total concepts
  ],
  "explanations": {
    "tile_0": "Explanation for first easy tile...",
    "tile_1": "Explanation for second easy tile...",
    "tile_2": "Explanation for first medium tile...",
    "tile_3": "Explanation for second medium tile...",
    "tile_4": "Explanation for third medium tile...",
    "tile_5": "Explanation for first hard tile...",
    "tile_6": "Explanation for second hard tile...",
    "tile_7": "Explanation for third hard tile...",
    "tile_8": "Explanation for fourth hard tile..."
  }
}
```

## Expert Diagnostic Principles to Follow

1. **Hard tiles contain the highest-yield information** - think like an expert who can extract maximum diagnostic value from subtle findings
2. **Easy tiles are "expensive" obvious findings** - what a novice would order first but provides less specific information  
3. **Progression should feel natural** - easy findings suggest a broad category, hard findings clinch the specific diagnosis
4. **Educational focus** - players should learn something valuable about medical reasoning
5. **Realistic clinical scenario** - clues should represent findings a physician would actually encounter

Remember: You are creating content for the specific discipline and category provided. Focus on creating the highest quality medical educational content possible within those constraints.