# 📅 DAILY UPDATE GUIDE - The Differential

**Ultra-clear, step-by-step instructions for updating your daily medical puzzle.**

## 🎯 **EXACTLY WHAT TO DO EACH DAY**

### **Step 1: Open Terminal/Command Prompt**
- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + R`, type "cmd", press Enter

### **Step 2: Navigate to Your Game Folder**
```bash
cd "Differential 2"
```

### **Step 3: Generate New Puzzle**
```bash
python3 generate_puzzle.py
```

**What happens:**
- Script loads OpenAI and generates a medical puzzle
- Shows you: discipline, diagnosis, tile clues, explanations
- Displays like this:
```
🎯 GENERATED PUZZLE
============================
📅 Date: 2025-07-24
🏥 Discipline: Cardiology  
🎯 Answer: Takotsubo Cardiomyopathy
💡 Rationale: Stress-induced cardiomyopathy...

📋 TILES:
  1. 🟢 EASY   | 70yo female
  2. 🟢 EASY   | Chest pain stress
  3. 🟡 MEDIUM | EKG: ST changes
  ...

✅ Approve this puzzle? (y/n/r for regenerate):
```

### **Step 4: Review and Approve**
- **Type `y`** if you like the puzzle
- **Type `n`** if you want to cancel
- **Type `r`** if you want to regenerate a different puzzle

### **Step 5: Upload to Live Site**
The script will show you the exact commands to copy and paste:
```bash
git add today.json
git commit -m "Daily puzzle: Cardiology - 2025-07-24"
git push origin main
```

**No need to type the answer!** The commit message is automatically generated from the discipline and date, so you can still play the game yourself without spoilers.

### **Step 6: Wait and Verify**
- **Wait**: 2-3 minutes for GitHub to update
- **Check**: https://basshaven.github.io/thedifferential
- **Verify**: New puzzle appears with today's date

## ⚡ **COMPLETE DAILY WORKFLOW (Copy-Paste Ready)**

```bash
# Navigate to game folder
cd "Differential 2"

# Generate puzzle (follow prompts)
python generate_puzzle.py

# Upload to live site (the script shows you the exact command)
git add today.json
git commit -m "Daily puzzle: [discipline] - [date]"
git push origin main

# Verify live site in 2-3 minutes:
# https://basshaven.github.io/thedifferential
```

## 🛠️ **TROUBLESHOOTING**

### **"python: command not found"**
**Solution**: Install Python from https://python.org

### **"No module named 'openai'"**
**Solution**: 
```bash
pip install -r requirements.txt
```

### **"API key file not found"**
**Solution**: Create your API key file
```bash
echo "sk-your-openai-key-here" > openai_key.txt
```

### **"Generation failed"**
**Solutions**:
1. Check your OpenAI API key is valid
2. Try again (sometimes OpenAI has temporary issues)
3. Use more attempts: `python generate_puzzle.py --max-attempts 5`

### **"Permission denied" or Git errors**
**Solution**: Make sure you're in the right folder
```bash
pwd  # Should show path ending in "Differential 2"
ls   # Should show index.html, script.js, today.json, etc.
```

### **Live site shows old puzzle**
**Solutions**:
1. Wait 5 more minutes (GitHub Pages can be slow)
2. Check GitHub Pages is enabled: Repository Settings → Pages → main branch
3. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)

## 🎛️ **ADVANCED OPTIONS**

### **Skip Review (Auto-Approve)**
```bash
python generate_puzzle.py --no-review
```

### **Generate Multiple Options**
```bash
python generate_puzzle.py --max-attempts 3
# Type 'r' to regenerate until you find one you like
```

### **Custom Filename**
```bash
python generate_puzzle.py --output my_puzzle.json
```

## 📁 **WHERE EVERYTHING IS STORED**

- **Live puzzle**: `today.json` (this is what the game loads)
- **Backups**: `generated_puzzles/` folder (automatic saves of everything you generate)
- **Your API key**: `openai_key.txt` (never gets uploaded to GitHub)
- **Game files**: `index.html`, `script.js`, `styles.css`

## ⏰ **DAILY ROUTINE SUGGESTION**

**Best time**: Generate puzzles the night before or early morning

**Workflow**:
1. **Generate**: Run the script, review puzzle
2. **Approve**: If good, type 'y'. If not, type 'r' for another
3. **Upload**: Copy-paste the git commands
4. **Verify**: Check live site loads new puzzle
5. **Done**: Takes 2-3 minutes total

## 🔥 **EMERGENCY BACKUP PLAN**

If something goes wrong and you need to quickly fix the live site:

1. **Use a previous puzzle**:
```bash
cp generated_puzzles/puzzle_20250123_*.json today.json
git add today.json
git commit -m "Restore previous puzzle"
git push origin main
```

2. **Or manually edit today.json** with any medical case you know

The game is designed to be robust - even if something breaks, players can still play with the fallback data built into the game.

---

**🎯 Remember**: The most important steps are:
1. `python generate_puzzle.py` (generates)
2. `git add today.json && git commit -m "..." && git push` (publishes)
3. Wait 2-3 minutes and check the live site

That's it! 🎉
