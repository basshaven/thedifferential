#!/usr/bin/env python3
"""
The Differential - Puzzle Generator
A modular system for generating daily medical diagnostic puzzles.

Usage:
    python generate_puzzle.py [options]

Example:
    python generate_puzzle.py --agent openai_puzzle --review
"""

import os
import sys
import json
import argparse
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import config
from agents.base_agent import AgentChain
from agents.openai_puzzle_agent import OpenAIPuzzleAgent

class PuzzleGenerator:
    """Main puzzle generation orchestrator."""
    
    def __init__(self):
        self.agents = {}
        self.setup_logging()
        
    def setup_logging(self):
        """Set up logging for the main application."""
        import logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%H:%M:%S'
        )
        self.logger = logging.getLogger("differential.main")
    
    def load_agent(self, agent_name: str):
        """Load a specific agent by name."""
        if agent_name in self.agents:
            return self.agents[agent_name]
        
        if agent_name not in config.AVAILABLE_AGENTS:
            raise ValueError(f"Unknown agent: {agent_name}")
        
        agent_config = config.AVAILABLE_AGENTS[agent_name]
        
        if agent_name == "openai_puzzle":
            api_key = config.load_api_key()
            if not api_key:
                raise ValueError("OpenAI API key not found")
            agent = OpenAIPuzzleAgent(api_key)
        else:
            # Future agents will be added here
            raise NotImplementedError(f"Agent {agent_name} not yet implemented")
        
        self.agents[agent_name] = agent
        return agent
    
    async def generate_puzzle(self, agent_name: str = "openai_puzzle", forced_discipline: str = None, forced_category: str = None) -> Dict[str, Any]:
        """Generate a puzzle using the specified agent."""
        self.logger.info(f"🧠 Loading agent: {config.AVAILABLE_AGENTS[agent_name]['name']}")
        
        agent = self.load_agent(agent_name)
        
        constraints = []
        if forced_discipline:
            constraints.append(f"discipline: {forced_discipline}")
        if forced_category:
            constraints.append(f"category: {forced_category}")
        
        if constraints:
            self.logger.info(f"🎯 Generating puzzle with constraints: {', '.join(constraints)}")
        else:
            self.logger.info("🎯 Generating puzzle with probabilistic selection...")
        
        puzzle = await agent.generate(
            forced_discipline=forced_discipline,
            forced_category=forced_category
        )
        
        # Create backup if enabled
        if config.CREATE_BACKUPS:
            self.create_backup(puzzle)
        
        return puzzle
    
    def create_backup(self, puzzle: Dict[str, Any]):
        """Create a backup of the generated puzzle."""
        backup_dir = config.BACKUP_DIR
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        answer = puzzle.get('answer', 'unknown').replace(' ', '_')
        filename = f"{backup_dir}/puzzle_{timestamp}_{answer}.json"
        
        try:
            with open(filename, 'w') as f:
                json.dump(puzzle, f, indent=2)
            self.logger.info(f"📁 Backup saved: {filename}")
        except Exception as e:
            self.logger.error(f"Failed to create backup: {e}")
    
    def display_puzzle(self, puzzle: Dict[str, Any]):
        """Display the generated puzzle for review."""
        print("\\n" + "="*60)
        print("🎯 GENERATED PUZZLE")
        print("="*60)
        
        print(f"📅 Date: {puzzle.get('date', 'Unknown')}")
        print(f"🏥 Discipline: {puzzle.get('discipline', 'Unknown')}")
        print(f"🎯 Answer: {puzzle.get('answer', 'Unknown')}")
        
        if 'topic_rationale' in puzzle:
            print(f"💡 Rationale: {puzzle['topic_rationale']}")
        
        print("\\n📋 TILES:")
        tiles = puzzle.get('tiles', [])
        for i, tile in enumerate(tiles):
            difficulty = tile.get('difficulty', 'unknown')
            clue = tile.get('clue', 'No clue')
            icon = {"easy": "🟢", "medium": "🟡", "hard": "🔴"}.get(difficulty, "⚪")
            print(f"  {i+1}. {icon} {difficulty.upper():6} | {clue}")
        
        print(f"\\n🔍 Differential ({len(puzzle.get('concepts', []))} items):")
        concepts = puzzle.get('concepts', [])[:10]  # Show first 10
        for concept in concepts:
            print(f"  • {concept}")
        if len(puzzle.get('concepts', [])) > 10:
            print(f"  ... and {len(puzzle.get('concepts', [])) - 10} more")
        
        print("\\n" + "="*60)
    
    def review_puzzle(self, puzzle: Dict[str, Any]) -> bool:
        """Allow user to review and approve the puzzle."""
        self.display_puzzle(puzzle)
        
        while True:
            choice = input("\\n✅ Approve this puzzle? (y/n/r for regenerate): ").lower().strip()
            if choice in ['y', 'yes']:
                return True
            elif choice in ['n', 'no']:
                return False
            elif choice in ['r', 'regenerate', 'regen']:
                return None  # Signal to regenerate
            else:
                print("Please enter 'y' for yes, 'n' for no, or 'r' to regenerate")
    
    def save_puzzle(self, puzzle: Dict[str, Any], filename: str = None) -> bool:
        """Save the puzzle to the output file."""
        if filename is None:
            filename = config.OUTPUT_FILE
        
        try:
            with open(filename, 'w') as f:
                if config.PRETTY_PRINT_JSON:
                    json.dump(puzzle, f, indent=2)
                else:
                    json.dump(puzzle, f)
            
            self.logger.info(f"💾 Puzzle saved to: {filename}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to save puzzle: {e}")
            return False
    
    def generate_commit_message(self, puzzle: Dict[str, Any]) -> str:
        """Generate a commit message based on puzzle content."""
        answer = puzzle.get('answer', 'Unknown')
        discipline = puzzle.get('discipline', 'Medical')
        date = puzzle.get('date', datetime.now().strftime("%Y-%m-%d"))
        
        # Create a short commit message without revealing the answer
        return f"Daily puzzle: {discipline} - {date}"
    
    def show_git_commands(self, puzzle: Dict[str, Any]):
        """Display the git commands needed to deploy the puzzle."""
        commit_msg = self.generate_commit_message(puzzle)
        
        print("\n" + "="*60)
        print("🚀 READY TO DEPLOY")
        print("="*60)
        print("\nCopy and run these commands to publish your puzzle:")
        print("\n" + "-"*40)
        print("git add today.json")
        print(f'git commit -m "{commit_msg}"')
        print("git push origin main")
        print("-"*40)
        print("\nThen visit: https://basshaven.github.io/thedifferential")
        print("(Wait 2-3 minutes for GitHub Pages to update)")
        print("="*60)

async def main():
    """Main application entry point."""
    parser = argparse.ArgumentParser(description="Generate puzzles for The Differential")
    parser.add_argument(
        '--agent', 
        default='openai_puzzle',
        choices=list(config.AVAILABLE_AGENTS.keys()),
        help='Agent to use for generation'
    )
    parser.add_argument(
        '--no-review', 
        action='store_true',
        help='Skip manual review and save automatically'
    )
    parser.add_argument(
        '--output', 
        help='Output filename (default: today.json)'
    )
    parser.add_argument(
        '--max-attempts', 
        type=int, 
        default=3,
        help='Maximum generation attempts'
    )
    parser.add_argument(
        '--discipline',
        help='Force a specific medical discipline (e.g., "Hematology", "Cardiology")'
    )
    parser.add_argument(
        '--category',
        choices=['diagnosis', 'lab_test', 'adverse_event'],
        help='Force a specific puzzle category'
    )
    
    args = parser.parse_args()
    
    generator = PuzzleGenerator()
    
    print("🧬 The Differential - Puzzle Generator")
    print("="*40)
    
    # Verify API key exists
    if args.agent == 'openai_puzzle':
        if not config.load_api_key():
            print("\\n❌ Setup required!")
            print("1. Create a file called 'openai_key.txt'")
            print("2. Add your OpenAI API key to this file")
            print("3. Run the script again")
            return
    
    attempts = 0
    max_attempts = args.max_attempts
    
    while attempts < max_attempts:
        attempts += 1
        
        try:
            print(f"\\n🎲 Generation attempt {attempts}/{max_attempts}")
            puzzle = await generator.generate_puzzle(args.agent, args.discipline, getattr(args, 'category', None))
            
            if args.no_review:
                # Auto-save without review
                if generator.save_puzzle(puzzle, args.output):
                    print("\\n🎉 Puzzle generated and saved successfully!")
                    return
                else:
                    print("\\n❌ Failed to save puzzle")
                    return
            else:
                # Manual review
                review_result = generator.review_puzzle(puzzle)
                
                if review_result is True:
                    # Approved
                    if generator.save_puzzle(puzzle, args.output):
                        print("\\n🎉 Puzzle approved and saved!")
                        generator.show_git_commands(puzzle)
                        return
                    else:
                        print("\\n❌ Failed to save puzzle")
                        return
                elif review_result is False:
                    # Rejected
                    print("\\n❌ Puzzle rejected")
                    return
                else:
                    # Regenerate - continue loop
                    print("\\n🔄 Regenerating...")
                    continue
        
        except Exception as e:
            print(f"\\n❌ Generation failed (attempt {attempts}): {e}")
            if attempts < max_attempts:
                print("🔄 Retrying...")
            else:
                print("\\n💥 All attempts failed. Please check your setup and try again.")
                return

if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())