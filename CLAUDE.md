# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Differential** is a daily medical puzzle game that combines NYT-style puzzle mechanics with medical education. Players diagnose conditions by strategically revealing clues on a 3x3 tile board, then receive sophisticated diagnostic efficiency analysis through AUEC (Area Under the Efficiency Curve) calculations.

**Live site**: https://basshaven.github.io/thedifferential

## Core Architecture

### Game System (Frontend)
- **`index.html`**: Main game interface with centered attempts display, no scoring UI
- **`script.js`**: Single-class `DifferentialGame` architecture handling:
  - Game state management with action sequence tracking  
  - Tile interaction and reveal mechanics
  - AUEC analysis and visualization (primary post-game feedback)
  - SVG plot generation with 1:1 aspect ratio and full axis limits
  - Smart answer matching with medical variations/synonyms
- **`styles.css`**: Dark theme with AUEC-focused styling (no score log or performance assessment styles)
- **`today.json`**: Current puzzle data (auto-loaded with fallback to embedded data)

### Puzzle Generation System (Backend)
- **`generate_puzzle.py`**: Main CLI orchestrator with review workflow
- **`config.py`**: Configurable discipline weights, category distributions, validation rules
- **`agents/`**: Modular AI agent system (currently OpenAI-only, designed for expansion)
  - `base_agent.py`: Abstract base class for all agents
  - `openai_puzzle_agent.py`: GPT-4 implementation for complete puzzle generation
- **`AI_PUZZLE_PROMPT.md`**: Comprehensive 250+ line prompt for medical puzzle creation

### Data Flow
1. **Generation**: `python generate_puzzle.py` → `today.json`
2. **Game Load**: `script.js` fetches `today.json` (with fallback data)
3. **Gameplay**: Tile interactions tracked in `actionSequence` array
4. **Analysis**: AUEC calculation from action sequence → SVG efficiency curve
5. **Education**: Post-game explanations for each revealed tile

## Development Commands

### Daily Puzzle Updates
```bash
# Generate new puzzle with review
python generate_puzzle.py

# Auto-generate without review  
python generate_puzzle.py --no-review

# Force specific discipline
python generate_puzzle.py --discipline "Cardiology"

# Commit and deploy
git add today.json
git commit -m "Daily puzzle: [discipline] - [date]"
git push origin main
```

### Local Testing
```bash
# Start local server for testing
python3 -m http.server 8000
# Visit http://localhost:8000

# Direct file testing (may have CORS issues)
open index.html
```

### Setup (One-time)
```bash
# Install dependencies
pip install -r requirements.txt

# Add OpenAI API key
echo "sk-your-actual-key" > openai_key.txt
```

## Key Architecture Decisions

### AUEC-Centered Design
The game was recently streamlined to focus on **AUEC (Area Under the Efficiency Curve) analysis** as the primary educational feedback mechanism. Removed systems:
- Point-based scoring (was 25-point base with tile costs)
- Score logging interface
- Performance assessment percentile ranking
- Rectangular AUEC scores (kept only empirical)

### Game Data Structure
Puzzles follow a strict 9-tile format:
- **Easy tiles (2)**: Most pathognomonic clues, highest strategic value
- **Medium tiles (3)**: Supporting evidence
- **Hard tiles (4)**: Technical/confirmatory details

Categories: `diagnosis` (70%), `lab_test` (20%), `adverse_event` (10%)

### AUEC Calculation Engine
Complex efficiency analysis in `calculateAUEC()` method:
- Tracks cost vs. information curves from action sequence
- Generates SVG plots with consistent 0-37 cost, 0-27 info axes
- Provides plain-English interpretation and strategic advice
- 1:1 aspect ratio plots for visual consistency

### Medical Accuracy Focus
- **AI_PUZZLE_PROMPT.md**: 250+ line specification ensuring medical accuracy
- **Smart matching**: Handles medical synonyms, abbreviations, typos
- **Evidence-based clues**: All tiles must be factually accurate
- **Educational explanations**: Post-game learning for each tile

## Important Configuration

### Discipline Weights (`config.py`)
Modify `DISCIPLINE_WEIGHTS` to change specialty distribution:
- Internal Medicine (15%), Cardiology (12%), Emergency Medicine (10%)
- Pharmacy has 3x higher adverse event likelihood

### Game Constants (`script.js`)
- `maxPossibleCost = 37` (9 tiles × 3 + 2 wrong guesses × 5)
- `maxPossibleInfo = 27` (9 hard tiles × 3)
- AUEC plot: 400×400px for 1:1 aspect ratio

### Validation Rules (`config.py`)
- Clue length: ≤20 characters
- Concepts range: 20-25 differential diagnoses
- Required tile distribution: 2 easy, 3 medium, 4 hard

## Testing and Debugging

### Game Testing
- **Manual**: Play through complete game to verify AUEC display
- **Debug file**: `debug_test.html` for isolated AUEC testing
- **Local vs. GitHub Pages**: Test locally first (CORS differences expected)

### Puzzle Validation
- Automatic validation in generation pipeline
- Review workflow prevents publishing invalid puzzles
- Backup system: all generated puzzles saved to `generated_puzzles/`

## Security Notes

- **API keys**: Stored in `openai_key.txt` (git-ignored)
- **Private repository**: Source code not publicly visible
- **No cloud storage**: All generation happens locally

## File Relationships

```
Game Flow: index.html → script.js → today.json
Generation: AI_PUZZLE_PROMPT.md → generate_puzzle.py → today.json  
Configuration: config.py → agents/openai_puzzle_agent.py
Deployment: git push → GitHub Pages (automatic)
```

The architecture prioritizes medical education through sophisticated efficiency analysis while maintaining simple, focused gameplay mechanics.