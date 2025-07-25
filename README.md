# 🧬 The Differential - Daily Medical Puzzle Game

A minimalist, NYT-style daily medical puzzle game where players diagnose conditions by strategically revealing clues on a tile board with celebration animations and educational explanations.

🎮 **Live Game**: https://basshaven.github.io/thedifferential

## 🎯 Current Game Features

### **Core Gameplay**
- **3x3 tile grid** organized by difficulty columns (Easy | Medium | Hard)
- **Strategic scoring**: Easy tiles -3 points, Medium -2, Hard -1 
- **Key Strategy**: Easy tiles cost MORE but contain the most pathognomonic/characteristic clues
- **Optimal Play**: Flip easy tiles first to get maximum diagnostic value per point
- **Smart answer matching**: Accepts medical variations, typos, abbreviations, synonyms
- **Base score**: 25 points, range 0-100
- **3 attempts** with guess bonuses: 1st +25, 2nd +10, 3rd +0
- **Wrong guess penalty**: -5 points each

### **Visual Experience** 
- **🎊 Celebration animations** for correct answers (confetti, title pulsing, container bounce)
- **😞 Failure animations** for wrong answers (shaking, red styling)
- **📱 Mobile-optimized** with full-height explanation tiles
- **🎨 Dark theme** with high-contrast yellow/green colors and Crimson Text font

### **Educational Features**
- **📚 Post-game explanations** appear after completion showing how each clue relates to the diagnosis
- **🎯 Tile previews** in explanations match the game board appearance
- **📊 Score logging** tracks every action and point change throughout the game
- **🔍 Post-game exploration** - continue clicking tiles after game ends to see remaining clues

### **🧠 Smart Answer System**
- **Multiple acceptable answers**: "Legionella" = "Legionnaire's disease" = "Legionella pneumonia"
- **Typo tolerance**: "legionela" → "legionella" (minor spelling errors accepted)
- **Punctuation flexible**: "Sheehan's syndrome" = "Sheehan syndrome" = "sheehans syndrome"
- **Medical abbreviations**: "MI" = "Myocardial infarction" = "Heart attack"
- **Organism vs disease**: "Legionella" accepted for "Legionella pneumonia"
- **Case insensitive**: All matching is case-insensitive

## 📋 **DAILY UPDATE INSTRUCTIONS**

### **🚀 Quick Daily Update (Recommended)**

1. **Generate new puzzle:**
   ```bash
   cd "Differential 2"
   python generate_puzzle.py
   ```

2. **Review the generated puzzle** (shows discipline, answer, tiles, and explanations)

3. **Approve or regenerate** until you're satisfied

4. **Push to live site:** (script provides exact commands - no spoilers!)
   ```bash
   git add today.json
   git commit -m "Daily puzzle: [discipline] - [date]"
   git push origin main
   ```

5. **Wait 2-3 minutes** for GitHub Pages to update

6. **Verify live:** https://basshaven.github.io/thedifferential

### **⚙️ One-Time Setup for Daily Updates**

If this is your first time:

1. **Install Python requirements:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Add your OpenAI API key:**
   ```bash
   echo "sk-your-actual-openai-key" > openai_key.txt
   ```

3. **Test generation:**
   ```bash
   python generate_puzzle.py
   ```

### **🎛️ Advanced Generation Options**

```bash
# Skip review and auto-save
python generate_puzzle.py --no-review

# Multiple attempts if generation fails
python generate_puzzle.py --max-attempts 5

# Force a specific medical discipline
python generate_puzzle.py --discipline "Hematology"
python generate_puzzle.py --discipline "Pharmacy"

# Save to custom filename
python generate_puzzle.py --output custom_puzzle.json

# Combine options
python generate_puzzle.py --discipline "Cardiology" --max-attempts 5
```

### **📁 Generated Content Location**
- **Live puzzle**: `today.json` (automatically loaded by game)
- **Backups**: `generated_puzzles/` folder (automatic backups of all puzzles)
- **Fallback**: Embedded in `script.js` (works offline)

### **🎲 Puzzle Categories & Disciplines**
The AI generates different types of medical puzzles:
- **Medical Diagnosis (70%)**: Identify specific conditions (e.g., "Sheehan's Syndrome")
- **Laboratory Test (20%)**: Identify the most appropriate diagnostic test (e.g., "Anti-CCP Antibody")  
- **Drug Adverse Event (10%)**: Identify medication-related complications (e.g., "Vancomycin nephrotoxicity")

**Medical Disciplines** are weighted by frequency (editable in `config.py`):
- Internal Medicine (15%), Cardiology (12%), Emergency Medicine (10%)
- Infectious Disease (8%), Pulmonology (8%), Gastroenterology (7%)
- Nephrology (6%), Neurology (6%), Endocrinology (5%)
- Hematology (5%), Rheumatology (4%), Oncology (4%)
- Critical Care (3%), Psychiatry (2%), **Pharmacy (2%)**
- Dermatology (1%), Ophthalmology (1%), Otolaryngology (1%)

*Pharmacy discipline has 3x higher likelihood of generating adverse drug events*

## 🏗️ **System Architecture**

### **Game Files**
- `index.html` - Main game interface with 3x3 grid
- `styles.css` - Dark theme styling with animations  
- `script.js` - Game logic, scoring, animations, and explanations
- `today.json` - Current day's puzzle data

### **Puzzle Generation System**
- `generate_puzzle.py` - Main generation script with CLI interface
- `config.py` - Configuration settings (API keys, validation rules)
- `agents/` - Modular agent system for AI puzzle generation
- `AI_PUZZLE_PROMPT.md` - Comprehensive prompt for puzzle creation
- `SETUP.md` - Detailed setup instructions

### **Data Format**
```json
{
  "date": "2025-07-24",
  "discipline": "Endocrinology", 
  "category": "diagnosis",
  "answer": "Sheehan's Syndrome",
  "acceptable_answers": [
    "Sheehan's Syndrome",
    "Sheehan syndrome", 
    "Sheehans syndrome",
    "Postpartum pituitary necrosis",
    "Postpartum hypopituitarism"
  ],
  "tiles": [
    {"difficulty": "easy", "clue": "Postpartum woman"},
    {"difficulty": "easy", "clue": "Severe hemorrhage"},
    {"difficulty": "medium", "clue": "Failed lactation"},
    {"difficulty": "medium", "clue": "Fatigue & weight gain"},
    {"difficulty": "medium", "clue": "Loss of pubic hair"},
    {"difficulty": "hard", "clue": "Low plasma ACTH"},
    {"difficulty": "hard", "clue": "Low serum TSH"},
    {"difficulty": "hard", "clue": "MRI: Empty sella"},
    {"difficulty": "hard", "clue": "Hyponatremia"}
  ],
  "concepts": ["Sheehan's Syndrome", "Postpartum depression", ...],
  "explanations": {
    "tile_0": "Sheehan's syndrome typically affects women who have had severe obstetric hemorrhage...",
    ...
  }
}
```

## 🔒 **Security & Privacy**

- **🔐 Private repository** - Source code not publicly visible
- **🔑 API keys stored locally** - Never committed to git (protected by .gitignore)
- **🛡️ Custom license** - Prevents commercial use without permission
- **📍 Local generation** - All puzzle creation happens on your computer

## 🎨 **Game Design Philosophy**

- **Minimalist aesthetic** inspired by NYT games
- **Educational focus** with post-game learning
- **Strategic gameplay** where easy tiles provide maximum diagnostic value for higher cost
- **Pathognomonic approach** - easy tiles contain the most characteristic features
- **Medical accuracy** with evidence-based puzzles
- **Mobile-first** responsive design
- **Celebration of success** with engaging animations

## 🚀 **Future Expansion Ready**

The modular agent system is designed for easy expansion:
- **Topic Selection Agent** - Strategic discipline/topic picking
- **Research Agent** - Latest medical guideline integration
- **Validation Agent** - Quality scoring and medical accuracy checking
- **Multi-AI orchestration** - Chain different AI services together

## 📞 **Support & Troubleshooting**

### **Common Issues:**
- **404 Error**: Check GitHub Pages settings (Settings → Pages → main branch, root folder)
- **Generation Fails**: Verify `openai_key.txt` exists and contains valid API key
- **Local Testing**: Use `python -m http.server 8000` then visit `http://localhost:8000`

### **File Locations:**
- **Setup guide**: `SETUP.md`
- **Generation examples**: `example_usage.py`
- **Configuration**: `config.py`

---

*The Differential combines the engagement of puzzle games with the depth of medical education, creating daily learning opportunities for healthcare professionals and students.*