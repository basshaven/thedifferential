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