#!/bin/bash
# Local puzzle testing script

echo "🧪 Local Puzzle Testing Script"
echo "=============================="

# Backup current puzzle
if [ -f "today.json" ]; then
    echo "📁 Backing up current today.json..."
    cp today.json today_backup_$(date +%Y%m%d_%H%M%S).json
fi

# Generate test puzzle
echo "🎲 Generating test puzzle..."
if [ "$1" == "" ]; then
    python3 generate_puzzle.py --output today.json --no-review
else
    python3 generate_puzzle.py --discipline "$1" --output today.json --no-review
fi

if [ $? -eq 0 ]; then
    echo "✅ Test puzzle generated successfully!"
    echo ""
    echo "📋 Puzzle Summary:"
    echo "=================="
    python3 -c "
import json
with open('today.json', 'r') as f:
    data = json.load(f)
print(f'📅 Date: {data.get(\"date\", \"Unknown\")}')
print(f'🏥 Discipline: {data.get(\"discipline\", \"Unknown\")}')  
print(f'📊 Category: {data.get(\"category\", \"Unknown\")}')
print(f'🎯 Answer: {data.get(\"answer\", \"Unknown\")}')
print(f'🔢 Tiles: {len(data.get(\"tiles\", []))}')
print(f'🧠 Concepts: {len(data.get(\"concepts\", []))}')
"
    echo ""
    echo "🚀 Starting local server..."
    echo "Visit: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C when done testing"
    echo "=============================="
    
    # Start server
    python3 -m http.server 8000
    
else
    echo "❌ Failed to generate test puzzle"
    exit 1
fi