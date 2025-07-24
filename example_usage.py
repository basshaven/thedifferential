#!/usr/bin/env python3
"""
Example usage of The Differential puzzle generation system.
This shows how to use the agents programmatically.
"""

import asyncio
import json
from agents.openai_puzzle_agent import OpenAIPuzzleAgent
from agents.base_agent import AgentChain
import config

async def example_single_agent():
    """Example: Generate a puzzle with a single OpenAI agent."""
    print("=== Single Agent Example ===")
    
    # Load API key
    api_key = config.load_api_key()
    if not api_key:
        print("❌ API key not found. Create openai_key.txt with your key.")
        return
    
    # Create agent
    agent = OpenAIPuzzleAgent(api_key)
    
    # Generate puzzle
    puzzle = await agent.generate()
    
    # Display result
    print(f"Generated: {puzzle['answer']}")
    print(f"Tiles: {len(puzzle['tiles'])}")
    print(f"Concepts: {len(puzzle['concepts'])}")
    
    return puzzle

async def example_agent_chain():
    """Example: Future multi-agent chain (when more agents are available)."""
    print("=== Agent Chain Example (Future) ===")
    
    # This will be possible once we have multiple agents:
    # chain = AgentChain()
    # chain.add_agent(TopicAgent())
    # chain.add_agent(ResearchAgent()) 
    # chain.add_agent(TileGenerationAgent())
    # chain.add_agent(ValidationAgent())
    # 
    # result = await chain.execute()
    
    print("Multi-agent chains will be available in future versions!")

async def example_custom_configuration():
    """Example: Using custom configuration for specialized puzzles."""
    print("=== Custom Configuration Example ===")
    
    # You could modify the agent's behavior:
    api_key = config.load_api_key()
    if not api_key:
        return
    
    agent = OpenAIPuzzleAgent(api_key)
    
    # Override default settings
    agent.model = "gpt-3.5-turbo"  # Faster, cheaper model
    agent.temperature = 0.9        # More creative
    
    puzzle = await agent.generate()
    print(f"Generated with custom settings: {puzzle['answer']}")

if __name__ == "__main__":
    # Run examples
    asyncio.run(example_single_agent())
    print()
    asyncio.run(example_agent_chain())
    print()
    asyncio.run(example_custom_configuration())