# GitHub Pages Deployment Guide

## Quick Setup (5 minutes)

### 1. Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it something like `the-differential` or `daily-medical-puzzle`
3. Make it public (required for free GitHub Pages)
4. Don't initialize with README (we have our own files)

### 2. Upload Files
```bash
cd "Differential 2"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/basshaven/thedifferential.git
git push -u origin main
```

### 3. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select "Deploy from a branch"
5. Select branch: **main** and folder: **/ (root)**
6. Click **Save**

### 4. Your Site is Live!
- Your game will be available at: `https://YOURUSERNAME.github.io/YOURREPOSITORY`
- It may take 5-10 minutes for the first deployment

## Daily AI Updates (Optional)

### 1. Set up OpenAI API Key (if using AI)
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key
5. Click **Add secret**

### 2. Customize the AI Script
- Edit `scripts/generate_daily_puzzle.py`
- Replace the placeholder AI function with your actual AI integration
- The script runs daily at 6 AM UTC (customize in `.github/workflows/daily-update.yml`)

### 3. Manual Updates
You can also manually update `today.json` and push to GitHub:
```bash
# Edit today.json with new puzzle
git add today.json
git commit -m "Update daily puzzle"
git push
```

## File Structure
```
Differential 2/
├── index.html              # Main game page
├── styles.css              # Styling
├── script.js               # Game logic + fallback data
├── today.json              # Daily puzzle data
├── README.md               # Documentation
├── DEPLOYMENT.md           # This file
├── .github/workflows/
│   └── daily-update.yml    # GitHub Actions for daily updates
└── scripts/
    └── generate_daily_puzzle.py  # AI puzzle generator
```

## Troubleshooting

**Site not loading?**
- Check that repository is public
- Verify GitHub Pages is enabled in Settings
- Wait 5-10 minutes for deployment

**Old puzzle showing?**
- The game uses cache-busting to load fresh data
- Fallback data in script.js provides redundancy
- Browser may cache for a few minutes

**Daily updates not working?**
- Check GitHub Actions tab for error logs
- Verify API keys are set correctly
- Ensure the AI script runs without errors

## Benefits of This Setup

✅ **Free hosting** - GitHub Pages is completely free
✅ **Global CDN** - Fast loading worldwide  
✅ **Automatic updates** - AI can update daily via GitHub Actions
✅ **Version control** - All puzzles are saved in git history
✅ **Reliable** - Fallback data ensures game always works
✅ **Custom domain** - Can add your own domain later

## Next Steps

1. Deploy to GitHub Pages using the steps above
2. Test the live site
3. Customize the AI puzzle generator for your needs
4. Share the URL with players!

Your live game URL: `https://YOURUSERNAME.github.io/YOURREPOSITORY`
