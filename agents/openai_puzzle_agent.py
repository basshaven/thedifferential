"""
OpenAI-powered puzzle generation agent for The Differential.
Generates complete medical puzzles using GPT models.
"""

import json
import asyncio
from typing import Dict, Any
from openai import OpenAI
from .base_agent import BaseAgent
import config

class OpenAIPuzzleAgent(BaseAgent):
    """Agent that generates complete puzzles using OpenAI GPT models."""
    
    def __init__(self, api_key: str):
        super().__init__("OpenAI Puzzle Generator")
        self.client = OpenAI(api_key=api_key)
        self.model = config.OPENAI_MODEL
        self.temperature = config.OPENAI_TEMPERATURE
        self.max_tokens = config.OPENAI_MAX_TOKENS
        
    async def generate(self, **kwargs) -> Dict[str, Any]:
        """Generate a complete medical puzzle."""
        self.logger.info("Starting puzzle generation...")
        
        # Load the comprehensive prompt
        prompt = self._load_prompt()
        
        try:
            # Make API call
            self.logger.info(f"Calling OpenAI API with model: {self.model}")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert medical educator creating diagnostic puzzles. Always respond with valid JSON only, no additional text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            # Parse response
            content = response.choices[0].message.content.strip()
            self.logger.info("Received response from OpenAI")
            
            # Clean and parse JSON
            puzzle_data = self._parse_json_response(content)
            
            # Validate the puzzle
            if self.validate_puzzle(puzzle_data):
                self.logger.info(f"✅ Generated puzzle: {puzzle_data.get('answer', 'Unknown')}")
                return puzzle_data
            else:
                raise ValueError("Generated puzzle failed validation")
                
        except Exception as e:
            self.logger.error(f"Failed to generate puzzle: {e}")
            raise
    
    def _load_prompt(self) -> str:
        """Load the comprehensive puzzle generation prompt."""
        try:
            with open('AI_PUZZLE_PROMPT.md', 'r') as f:
                prompt_content = f.read()
            
            # Extract the actual prompt instructions (everything after the overview)
            prompt_start = prompt_content.find("## Step-by-Step Generation Process")
            if prompt_start != -1:
                core_prompt = prompt_content[prompt_start:]
            else:
                core_prompt = prompt_content
            
            # Add current date
            date_instruction = f"\\n\\nGenerate a puzzle for date: {config.DEFAULT_DATE}"
            
            return core_prompt + date_instruction
            
        except FileNotFoundError:
            # Fallback prompt if file not found
            return self._get_fallback_prompt()
    
    def _get_fallback_prompt(self) -> str:
        """Fallback prompt if the main prompt file isn't found."""
        return f"""
        Generate a medical diagnostic puzzle for "The Differential" game.
        
        Requirements:
        - Choose a medical discipline and specific condition
        - Create exactly 9 clues: 2 easy, 3 medium, 4 hard
        - Each clue must be ≤20 characters
        - Include 20-25 differential diagnoses
        - Provide explanations for each clue
        
        Return valid JSON in this exact format:
        {{
          "date": "{config.DEFAULT_DATE}",
          "discipline": "Medical Discipline",
          "topic_rationale": "Why this topic was chosen",
          "answer": "Specific Diagnosis",
          "tiles": [
            {{"difficulty": "easy", "clue": "Short clue"}},
            {{"difficulty": "easy", "clue": "Short clue"}},
            {{"difficulty": "medium", "clue": "Med clue"}},
            {{"difficulty": "medium", "clue": "Med clue"}},
            {{"difficulty": "medium", "clue": "Med clue"}},
            {{"difficulty": "hard", "clue": "Hard clue"}},
            {{"difficulty": "hard", "clue": "Hard clue"}},
            {{"difficulty": "hard", "clue": "Hard clue"}},
            {{"difficulty": "hard", "clue": "Hard clue"}}
          ],
          "concepts": ["Diagnosis1", "Diagnosis2", ...],
          "explanations": {{
            "tile_0": "How clue relates to diagnosis",
            "tile_1": "How clue relates to diagnosis",
            ...
          }}
        }}
        """
    
    def _parse_json_response(self, content: str) -> Dict[str, Any]:
        """Parse and clean JSON response from OpenAI."""
        # Remove any markdown formatting
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        
        content = content.strip()
        
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON: {e}")
            self.logger.error(f"Raw content: {content[:500]}...")
            raise ValueError(f"Invalid JSON response from OpenAI: {e}")
    
    def validate_puzzle(self, puzzle: Dict[str, Any]) -> bool:
        """Validate that the generated puzzle meets requirements."""
        required_fields = ['date', 'answer', 'tiles', 'concepts', 'explanations']
        
        # Check required fields
        for field in required_fields:
            if field not in puzzle:
                self.logger.error(f"Missing required field: {field}")
                return False
        
        # Validate tiles
        tiles = puzzle['tiles']
        if len(tiles) != 9:
            self.logger.error(f"Expected 9 tiles, got {len(tiles)}")
            return False
        
        # Check tile distribution
        difficulty_counts = {}
        for tile in tiles:
            if 'difficulty' not in tile or 'clue' not in tile:
                self.logger.error("Tile missing difficulty or clue")
                return False
            
            diff = tile['difficulty']
            difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
            
            # Check clue length
            if len(tile['clue']) > config.MAX_CLUE_LENGTH:
                self.logger.warning(f"Clue too long ({len(tile['clue'])} chars): {tile['clue']}")
        
        # Validate difficulty distribution
        expected = config.REQUIRED_TILE_COUNTS
        for diff, expected_count in expected.items():
            actual_count = difficulty_counts.get(diff, 0)
            if actual_count != expected_count:
                self.logger.error(f"Expected {expected_count} {diff} tiles, got {actual_count}")
                return False
        
        # Validate concepts count
        concepts = puzzle['concepts']
        if not (config.MIN_CONCEPTS <= len(concepts) <= config.MAX_CONCEPTS):
            self.logger.warning(f"Concepts count ({len(concepts)}) outside recommended range")
        
        # Validate explanations
        explanations = puzzle['explanations']
        for i in range(9):
            key = f"tile_{i}"
            if key not in explanations:
                self.logger.error(f"Missing explanation for {key}")
                return False
        
        self.logger.info("✅ Puzzle validation passed")
        return True