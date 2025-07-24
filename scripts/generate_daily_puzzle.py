#!/usr/bin/env python3
"""
Daily puzzle generator for The Differential game.
This script generates a new medical case and updates both today.json and the fallback data in script.js.
"""

import json
import os
import re
from datetime import datetime
from typing import Dict, List, Any

# Example implementation - replace with your AI service
def generate_puzzle_with_ai() -> Dict[str, Any]:
    """
    Generate a new medical puzzle using AI.
    Replace this function with your actual AI integration.
    """
    
    # This is a placeholder - replace with your AI API call
    # Example using OpenAI API:
    """
    import openai
    
    prompt = '''
    Generate a medical differential diagnosis puzzle with:
    - A specific diagnosis (not too common, but not extremely rare)
    - 9 clues of varying difficulty (2 easy, 3 medium, 4 hard)
    - Each clue should be ~20 characters or less
    - Include 20-25 differential diagnosis options
    - Easy clues: basic symptoms/demographics
    - Medium clues: lab values, vital signs  
    - Hard clues: specific tests, pathognomonic findings
    
    Return as JSON format...
    '''
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return json.loads(response.choices[0].message.content)
    """
    
    # Placeholder data - replace with AI-generated content
    sample_puzzles = [
        {
            "answer": "Acute Appendicitis",
            "tiles": [
                {"difficulty": "easy", "clue": "RLQ pain"},
                {"difficulty": "medium", "clue": "WBC 15k"},
                {"difficulty": "hard", "clue": "McBurney's point"},
                {"difficulty": "easy", "clue": "Nausea vomiting"},
                {"difficulty": "medium", "clue": "Low grade fever"},
                {"difficulty": "hard", "clue": "CT shows fat strand"},
                {"difficulty": "medium", "clue": "Pain migration"},
                {"difficulty": "hard", "clue": "Rovsing's sign +"},
                {"difficulty": "hard", "clue": "Neutrophil left shift"}
            ],
            "concepts": [
                "Acute Appendicitis", "Ovarian Cyst", "Kidney Stones", "Gastroenteritis",
                "Inflammatory Bowel Disease", "Diverticulitis", "Ectopic Pregnancy",
                "Pelvic Inflammatory Disease", "Urinary Tract Infection", "Gallbladder Disease",
                "Peptic Ulcer Disease", "Bowel Obstruction", "Hernia", "Testicular Torsion",
                "Mesenteric Adenitis", "Mittelschmerz", "Endometriosis", "Ovarian Torsion",
                "Cholecystitis", "Pancreatitis", "Pneumonia", "Muscle Strain", "Food Poisoning"
            ]
        }
        # Add more sample puzzles here
    ]
    
    # For now, return the sample puzzle
    # In production, this would be AI-generated
    return sample_puzzles[0]

def update_today_json(puzzle_data: Dict[str, Any]) -> None:
    """Update the today.json file with new puzzle data."""
    today_data = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "answer": puzzle_data["answer"],
        "tiles": puzzle_data["tiles"],
        "concepts": puzzle_data["concepts"]
    }
    
    with open("today.json", "w") as f:
        json.dump(today_data, f, indent=2)
    
    print(f"Updated today.json with: {puzzle_data['answer']}")

def update_fallback_data(puzzle_data: Dict[str, Any]) -> None:
    """Update the fallback data in script.js for redundancy."""
    
    with open("script.js", "r") as f:
        script_content = f.read()
    
    # Create the new fallback data string
    fallback_data = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "answer": puzzle_data["answer"],
        "tiles": puzzle_data["tiles"],
        "concepts": puzzle_data["concepts"]
    }
    
    fallback_json = json.dumps(fallback_data, indent=16)
    
    # Replace the getFallbackData function content
    pattern = r'(getFallbackData\(\) \{\s*return )(\{.*?\});(\s*\})'
    replacement = f'\\1{fallback_json};\\3'
    
    updated_content = re.sub(pattern, replacement, script_content, flags=re.DOTALL)
    
    with open("script.js", "w") as f:
        f.write(updated_content)
    
    print(f"Updated fallback data in script.js with: {puzzle_data['answer']}")

def main():
    """Main function to generate and update daily puzzle."""
    try:
        print(f"Generating daily puzzle for {datetime.now().strftime('%Y-%m-%d')}...")
        
        # Generate new puzzle using AI
        puzzle_data = generate_puzzle_with_ai()
        
        # Update both files
        update_today_json(puzzle_data)
        update_fallback_data(puzzle_data)
        
        print("Daily puzzle update completed successfully!")
        
    except Exception as e:
        print(f"Error generating daily puzzle: {e}")
        raise

if __name__ == "__main__":
    main()