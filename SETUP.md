# 🧬 The Differential - Puzzle Generator Setup

A modular system for generating daily medical diagnostic puzzles with AI agents.

## 🚀 Quick Start (5 minutes)

### 1. Install Python Requirements

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### 2. Set Up OpenAI API Key

**Get your API key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-...`)

**Save your key securely:**
```bash
# Create the key file (this stays on your computer only!)
echo "sk-your-actual-key-here" > openai_key.txt
```

**⚠️ IMPORTANT:** The `openai_key.txt` file is automatically ignored by git, so your key will never be uploaded to GitHub.

### 3. Generate Your First Puzzle

```bash
# Generate a puzzle with review
python generate_puzzle.py

# Or generate and save automatically
python generate_puzzle.py --no-review
```

## 🎮 Usage Examples

### Basic Generation
```bash
# Generate with manual review (recommended)
python generate_puzzle.py

# Output:
# 🧠 Loading agent: OpenAI Puzzle Agent
# 🎯 Generating puzzle...
# [Shows generated puzzle]
# ✅ Approve this puzzle? (y/n/r for regenerate):
```

### Advanced Options
```bash
# Skip review and save automatically
python generate_puzzle.py --no-review

# Save to custom file
python generate_puzzle.py --output my_puzzle.json

# Allow more generation attempts
python generate_puzzle.py --max-attempts 5
```

## 📁 File Structure

```
Differential 2/
├── generate_puzzle.py          # Main script
├── config.py                   # Configuration settings
├── requirements.txt            # Python dependencies
├── openai_key.txt             # Your API key (git-ignored)
├── AI_PUZZLE_PROMPT.md        # Comprehensive generation prompt
├── today.json                 # Generated puzzle output
├── generated_puzzles/         # Backup puzzles (auto-created)
└── agents/
    ├── __init__.py
    ├── base_agent.py          # Base agent class
    └── openai_puzzle_agent.py # OpenAI implementation
```

## ⚙️ Configuration

Edit `config.py` to customize:

```python
# OpenAI Settings
OPENAI_MODEL = "gpt-4"         # or "gpt-3.5-turbo" for faster/cheaper
OPENAI_TEMPERATURE = 0.7       # Creativity level (0-1)

# Validation Settings
MAX_CLUE_LENGTH = 20          # Maximum characters per clue
MIN_CONCEPTS = 20             # Minimum differential diagnoses
MAX_CONCEPTS = 25             # Maximum differential diagnoses

# Output Settings
PRETTY_PRINT_JSON = True      # Format JSON nicely
CREATE_BACKUPS = True         # Save backup copies
```

## 🧠 Future Agent System

The system is designed to support multiple AI agents:

```bash
# Current (single agent)
python generate_puzzle.py --agent openai_puzzle

# Future (multi-agent pipeline)
python generate_puzzle.py --agents topic,research,tiles,validation
```

**Planned agents:**
- **Topic Agent**: Selects medical discipline and specific condition
- **Research Agent**: Searches for recent medical guidelines
- **Tile Generation Agent**: Creates clues based on evidence
- **Validation Agent**: Quality checks and scoring
- **Explanation Agent**: Generates educational explanations

## 🔧 Troubleshooting

### "API key file not found"
```bash
# Make sure the file exists and has your key
ls -la openai_key.txt
cat openai_key.txt  # Should show your API key
```

### "Invalid JSON response"
- The AI sometimes returns malformed JSON
- The script will retry automatically
- Use `--max-attempts 5` for more retry attempts

### "Puzzle validation failed"
- Generated puzzle doesn't meet requirements (wrong tile counts, etc.)
- Script will retry automatically
- Check that your prompt file `AI_PUZZLE_PROMPT.md` exists

### Python/Module Errors
```bash
# Make sure you're in the right directory
cd "Differential 2"

# Install/update dependencies
pip install -r requirements.txt --upgrade
```

## 🔒 Security Notes

- **API key stays local**: Never committed to git
- **Backups are local**: Generated puzzles saved locally only
- **No cloud storage**: Everything stays on your computer
- **Private repo**: Your code is private on GitHub

## 💡 Tips

1. **Review puzzles**: Always review before publishing - AI can make mistakes
2. **Save good ones**: Backup folder contains all generated puzzles
3. **Experiment**: Try different models/settings in `config.py`
4. **Batch generate**: Run multiple times to build a puzzle library

## 🆘 Support

If you encounter issues:
1. Check this troubleshooting section
2. Verify your API key is valid
3. Ensure Python dependencies are installed
4. Check the generated logs for error details

The system is designed to be robust with automatic retries and detailed error messages.