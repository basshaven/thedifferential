# The Differential - Daily Medical Puzzle Game

A minimalist, NYT-style daily medical puzzle game where players diagnose conditions by revealing clues on a strategic tile board.

## How to Play

- Click tiles to reveal clues about a medical condition
- Tile costs: Hard -1, Medium -2, Easy -3 (flip harder tiles first!)
- Enter your diagnosis in the text box (3 attempts max)
- Correct guess bonuses: 1st attempt +25, 2nd +10, 3rd +0
- Wrong guesses: -5 points each
- Score range: 0-100 points

## Setup for Daily AI Updates

### 1. GitHub Repository Setup

1. Create a new GitHub repository
2. Upload all files from this folder
3. Go to repository Settings → Pages
4. Set Source to "Deploy from a branch"
5. Select "main" branch and "/ (root)" folder
6. Your site will be available at: `https://yourusername.github.io/repositoryname`

### 2. Daily AI Script Integration

Your AI script should:
1. Generate new puzzle data in the correct format
2. Update `today.json` with new content
3. Optionally update the fallback data in `script.js` for redundancy
4. Commit and push changes to GitHub

#### Example AI Script Workflow:
```python
import json
import requests
from datetime import datetime

# Generate new puzzle data
new_puzzle = {
    "date": datetime.now().strftime("%Y-%m-%d"),
    "answer": "Generated Diagnosis",
    "tiles": [...],  # 9 tiles following the layout
    "concepts": [...]  # List of possible diagnoses
}

# Update today.json via GitHub API
# (Use GitHub personal access token for authentication)
```

### 3. File Structure

- `index.html` - Main game interface
- `styles.css` - Styling and layout
- `script.js` - Game logic with fallback data
- `today.json` - Daily puzzle data (updated by AI)
- `README.md` - This file

### 4. Tile Layout

The game uses a 3-column jagged layout:
- Column 1: Positions 0,3 (2 easy tiles)
- Column 2: Positions 1,4,6 (3 medium tiles)  
- Column 3: Positions 2,5,7,8 (4 hard tiles)

### 5. Data Format

```json
{
  "date": "YYYY-MM-DD",
  "answer": "Exact Diagnosis Name",
  "tiles": [
    {"difficulty": "easy", "clue": "Short clue text"},
    {"difficulty": "medium", "clue": "Medium difficulty clue"},
    {"difficulty": "hard", "clue": "Hard clue text"},
    ...
  ],
  "concepts": ["Diagnosis 1", "Diagnosis 2", ...]
}
```

## Features

- ✅ Clean, minimalist design with black background
- ✅ High contrast yellow/green color scheme
- ✅ Semi-serif typography (Crimson Text)
- ✅ Responsive mobile-friendly layout
- ✅ Score logging with action history
- ✅ Post-game tile exploration
- ✅ Cache-busting for fresh daily data
- ✅ Fallback data system for reliability

## Development

To run locally during development:
```bash
python -m http.server 8000
# Then open http://localhost:8000
```

For production deployment, GitHub Pages handles everything automatically.