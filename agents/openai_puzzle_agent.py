"""
OpenAI-powered puzzle generation agent for The Differential.
Generates complete medical puzzles using GPT models.
"""

import json
import asyncio
import random
from typing import Dict, Any
from openai import OpenAI
from .base_agent import BaseAgent
import config
import sys
import os

# Add parent directory to path for discipline_selector import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from discipline_selector import DisciplineSelector

class OpenAIPuzzleAgent(BaseAgent):
    """Agent that generates complete puzzles using OpenAI GPT models."""
    
    def __init__(self, api_key: str):
        super().__init__("OpenAI Puzzle Generator")
        self.client = OpenAI(api_key=api_key)
        self.model = config.OPENAI_MODEL
        self.temperature = config.OPENAI_TEMPERATURE
        self.max_tokens = config.OPENAI_MAX_TOKENS
        self.discipline_selector = DisciplineSelector()
        
    async def generate(self, forced_discipline: str = None, forced_category: str = None, **kwargs) -> Dict[str, Any]:
        """Generate a complete medical puzzle using two-stage approach."""
        self.logger.info("Starting two-stage puzzle generation...")
        
        # STAGE 1: Deterministic discipline and category selection
        self.logger.info("Stage 1: Selecting discipline and category...")
        selection_result = self.discipline_selector.select_discipline_and_category(
            forced_discipline=forced_discipline,
            forced_category=forced_category
        )
        
        selected_discipline = selection_result["discipline"]
        selected_category = selection_result["category"]
        selection_rationale = selection_result["rationale"]
        
        self.logger.info(f"✅ Selected: {selected_discipline} / {selected_category}")
        self.logger.info(f"📝 Rationale: {selection_rationale}")
        
        # STAGE 2: AI content generation for specific discipline/category
        self.logger.info("Stage 2: Generating medical content...")
        prompt = self._load_focused_prompt(selected_discipline, selected_category, selection_rationale)
        
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
            
            # Add selection metadata to puzzle
            puzzle_data["selection_metadata"] = selection_result
            
            # Validate the puzzle
            if self.validate_puzzle(puzzle_data):
                self.logger.info(f"✅ Generated puzzle: {puzzle_data.get('answer', 'Unknown')}")
                return puzzle_data
            else:
                raise ValueError("Generated puzzle failed validation")
                
        except Exception as e:
            self.logger.error(f"Failed to generate puzzle: {e}")
            raise
    
    def _load_focused_prompt(self, discipline: str, category: str, rationale: str) -> str:
        """Load the focused prompt with specific discipline and category."""
        try:
            with open('AI_FOCUSED_PROMPT.md', 'r') as f:
                prompt_content = f.read()
            
            # Replace placeholders with actual values
            prompt_content = prompt_content.replace("[DISCIPLINE_PLACEHOLDER]", discipline)
            prompt_content = prompt_content.replace("[CATEGORY_PLACEHOLDER]", category)
            
            # Add specific instructions based on category
            specific_instructions = self._get_category_instructions(category, discipline)
            prompt_content = prompt_content.replace("[SPECIFIC_INSTRUCTIONS_PLACEHOLDER]", specific_instructions)
            
            # Add date
            date_instruction = f"\n\nGenerate puzzle for date: {config.DEFAULT_DATE}"
            
            return prompt_content + date_instruction
            
        except FileNotFoundError:
            # Fallback to simple prompt if file not found
            return self._get_focused_fallback_prompt(discipline, category)
    
    def _get_category_instructions(self, category: str, discipline: str) -> str:
        """Generate specific instructions based on category type."""
        category_details = config.PUZZLE_CATEGORIES.get(category, {})
        category_name = category_details.get("name", category)
        category_desc = category_details.get("description", f"Create a {category} puzzle")
        
        instructions = f"Create a {category_name.lower()}: {category_desc}."
        
        if category == "diagnosis":
            instructions += f" Choose a specific {discipline.lower()} condition that is educationally valuable and diagnostically challenging."
        elif category == "lab_test":
            instructions += f" Choose a specific diagnostic test relevant to {discipline.lower()} that requires clinical reasoning to identify."
        elif category == "adverse_event":
            instructions += f" Choose a specific drug-related adverse event within {discipline.lower()} that requires careful clinical assessment."
        
        return instructions
    
    def _get_focused_fallback_prompt(self, discipline: str, category: str) -> str:
        """Fallback prompt if the focused prompt file isn't found."""
        category_instructions = self._get_category_instructions(category, discipline)
        
        return f"""
        Generate medical puzzle content for "The Differential" game.
        
        ASSIGNED PARAMETERS:
        - Discipline: {discipline}
        - Category: {category}
        - Instructions: {category_instructions}
        
        Requirements:
        - Create exactly 9 clues: 2 easy, 3 medium, 4 hard
        - Each clue must be ≤20 characters
        - Hard tiles should contain the most diagnostically valuable information (9.0 efficiency)
        - Easy tiles should contain obvious but less specific findings (0.25 efficiency)
        - Include 20-25 differential diagnoses
        - Provide explanations for each clue
        
        Return valid JSON in this exact format:
        {{
          "date": "{config.DEFAULT_DATE}",
          "discipline": "{discipline}",
          "category": "{category}",
          "topic_rationale": "Why this topic was chosen",
          "answer": "Specific Answer",
          "acceptable_answers": ["Primary Answer", "Abbreviation", "Alternative"],
          "tiles": [
            {{"difficulty": "easy", "clue": "General finding"}},
            {{"difficulty": "easy", "clue": "Basic symptom"}},
            {{"difficulty": "medium", "clue": "More specific"}},
            {{"difficulty": "medium", "clue": "Supportive finding"}},
            {{"difficulty": "medium", "clue": "Narrowing clue"}},
            {{"difficulty": "hard", "clue": "Expert insight"}},
            {{"difficulty": "hard", "clue": "Pathognomonic"}},
            {{"difficulty": "hard", "clue": "Specialist knowledge"}},
            {{"difficulty": "hard", "clue": "Definitive finding"}}
          ],
          "concepts": ["Answer", "Alternative1", "Alternative2", ...],
          "explanations": {{
            "tile_0": "Educational explanation for clue...",
            "tile_1": "Educational explanation for clue...",
            "tile_2": "Educational explanation for clue...",
            "tile_3": "Educational explanation for clue...",
            "tile_4": "Educational explanation for clue...",
            "tile_5": "Educational explanation for clue...",
            "tile_6": "Educational explanation for clue...",
            "tile_7": "Educational explanation for clue...",
            "tile_8": "Educational explanation for clue..."
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
        
        # Validate acceptable_answers if present
        if 'acceptable_answers' in puzzle:
            acceptable_answers = puzzle['acceptable_answers']
            if not isinstance(acceptable_answers, list):
                self.logger.error("acceptable_answers must be a list")
                return False
            if len(acceptable_answers) < 1:
                self.logger.error("acceptable_answers must contain at least the primary answer")
                return False
            # First item should match the primary answer
            if acceptable_answers[0].lower().strip() != puzzle['answer'].lower().strip():
                self.logger.warning("First acceptable answer should match primary answer")
        
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