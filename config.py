"""
Configuration settings for The Differential puzzle generator.
"""

import os
from datetime import datetime

# API Configuration
OPENAI_API_KEY_FILE = "openai_key.txt"  # Store your key in this file (will be git-ignored)

# Puzzle Configuration
DEFAULT_DATE = datetime.now().strftime("%Y-%m-%d")
OUTPUT_FILE = "today.json"
BACKUP_DIR = "generated_puzzles"

# Agent Configuration
AVAILABLE_AGENTS = {
    "openai_puzzle": {
        "name": "OpenAI Puzzle Agent",
        "description": "Generates complete puzzles using OpenAI GPT models",
        "class": "OpenAIPuzzleAgent",
        "module": "agents.openai_puzzle_agent"
    }
    # Future agents will be added here:
    # "topic": {
    #     "name": "Topic Selection Agent", 
    #     "description": "Selects medical discipline and specific topic",
    #     "class": "TopicAgent",
    #     "module": "agents.topic_agent"
    # },
    # "research": {
    #     "name": "Research Agent",
    #     "description": "Searches for recent medical guidelines",
    #     "class": "ResearchAgent", 
    #     "module": "agents.research_agent"
    # }
}

# OpenAI Settings
OPENAI_MODEL = "gpt-4"
OPENAI_TEMPERATURE = 0.7
OPENAI_MAX_TOKENS = 2000

# Validation Settings
REQUIRED_TILE_COUNTS = {
    "easy": 2,
    "medium": 3,
    "hard": 4
}

MIN_CONCEPTS = 20
MAX_CONCEPTS = 25
MAX_CLUE_LENGTH = 20

# Configurable Puzzle Categories
# You can modify these to change what types of puzzles are generated
PUZZLE_CATEGORIES = {
    "diagnosis": {
        "name": "Medical Diagnosis",
        "description": "Diagnose a specific medical condition",
        "weight": 0.7,  # 70% of puzzles will be diagnoses
        "examples": ["Sheehan's Syndrome", "Aortic Dissection", "Takotsubo Cardiomyopathy"]
    },
    "lab_test": {
        "name": "Laboratory Test",
        "description": "Identify the most appropriate diagnostic test",
        "weight": 0.2,  # 20% of puzzles will be lab tests
        "examples": ["Anti-CCP Antibody", "Troponin I", "HbA1c"]
    },
    "adverse_event": {
        "name": "Drug Adverse Event",
        "description": "Identify a drug-related adverse reaction",
        "weight": 0.1,  # 10% of puzzles will be adverse events
        "examples": ["Vancomycin-induced nephrotoxicity", "Heparin-induced thrombocytopenia"]
    }
}

# Configurable Medical Discipline Weights  
# You can modify these weights to change how often each discipline appears
# Higher weights = more likely to be selected
DISCIPLINE_WEIGHTS = {
    "Internal Medicine": 0.15,    # General medicine, hospitalist medicine
    "Cardiology": 0.12,           # Heart conditions, arrhythmias, heart failure
    "Emergency Medicine": 0.10,   # Acute presentations, trauma
    "Infectious Disease": 0.08,   # Infections, sepsis, tropical diseases
    "Pulmonology": 0.08,          # Respiratory diseases, critical care
    "Gastroenterology": 0.07,     # GI diseases, liver conditions  
    "Nephrology": 0.06,           # Kidney diseases, electrolyte disorders
    "Neurology": 0.06,            # Brain, spinal cord, peripheral nerve conditions
    "Endocrinology": 0.05,        # Diabetes, thyroid, hormonal disorders
    "Hematology": 0.05,           # Blood disorders, coagulation issues
    "Rheumatology": 0.04,         # Autoimmune, connective tissue disorders
    "Oncology": 0.04,             # Cancers, hematologic malignancies
    "Critical Care": 0.03,        # ICU conditions, shock states
    "Psychiatry": 0.02,           # Mental health, cognitive disorders
    "Pharmacy": 0.02,             # Drug therapy, adverse events, pharmacokinetics
    "Dermatology": 0.01,          # Skin conditions with systemic implications
    "Ophthalmology": 0.01,        # Eye conditions with systemic connections
    "Otolaryngology": 0.01        # ENT conditions with systemic features
}

# Discipline-specific category preferences
# When a discipline is selected, these weights modify the category selection
DISCIPLINE_CATEGORY_MODIFIERS = {
    "Pharmacy": {
        "adverse_event": 3.0,  # 3x more likely to generate adverse events
        "diagnosis": 0.5,      # 0.5x less likely to generate diagnoses
        "lab_test": 1.0        # Normal likelihood for lab tests
    }
}

# Output Settings
PRETTY_PRINT_JSON = True
CREATE_BACKUPS = True

def load_api_key():
    """Load OpenAI API key from file."""
    key_file = OPENAI_API_KEY_FILE
    if os.path.exists(key_file):
        with open(key_file, 'r') as f:
            return f.read().strip()
    else:
        print(f"⚠️  API key file '{key_file}' not found!")
        print("Please create this file and add your OpenAI API key.")
        print("Example: echo 'sk-your-key-here' > openai_key.txt")
        return None