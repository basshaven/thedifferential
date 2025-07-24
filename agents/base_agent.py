"""
Base agent class for The Differential puzzle generation system.
All agents inherit from this class for consistency.
"""

import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional

class BaseAgent(ABC):
    """Base class for all puzzle generation agents."""
    
    def __init__(self, name: str, config: Dict[str, Any] = None):
        self.name = name
        self.config = config or {}
        self.logger = self._setup_logger()
        
    def _setup_logger(self) -> logging.Logger:
        """Set up logging for the agent."""
        logger = logging.getLogger(f"differential.{self.name}")
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger
    
    @abstractmethod
    async def generate(self, **kwargs) -> Dict[str, Any]:
        """
        Generate content based on inputs.
        Must be implemented by each agent.
        """
        pass
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """
        Validate the agent's output format.
        Can be overridden by specific agents.
        """
        return isinstance(output, dict)
    
    def log_generation(self, inputs: Dict[str, Any], output: Dict[str, Any]):
        """Log the generation process for debugging."""
        self.logger.info(f"Generated content with inputs: {list(inputs.keys())}")
        if 'answer' in output:
            self.logger.info(f"Generated puzzle: {output['answer']}")
    
    def save_backup(self, output: Dict[str, Any], filename: Optional[str] = None):
        """Save a backup of generated content."""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"backup_{self.name}_{timestamp}.json"
        
        try:
            with open(filename, 'w') as f:
                json.dump(output, f, indent=2)
            self.logger.info(f"Backup saved: {filename}")
        except Exception as e:
            self.logger.error(f"Failed to save backup: {e}")

class AgentChain:
    """Manages execution of multiple agents in sequence."""
    
    def __init__(self):
        self.agents = []
        self.logger = logging.getLogger("differential.chain")
    
    def add_agent(self, agent: BaseAgent):
        """Add an agent to the execution chain."""
        self.agents.append(agent)
        self.logger.info(f"Added agent: {agent.name}")
    
    async def execute(self, initial_input: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute all agents in sequence."""
        current_output = initial_input or {}
        
        for agent in self.agents:
            self.logger.info(f"Executing agent: {agent.name}")
            try:
                current_output = await agent.generate(**current_output)
                if not agent.validate_output(current_output):
                    raise ValueError(f"Invalid output from {agent.name}")
                agent.log_generation(current_output, current_output)
            except Exception as e:
                self.logger.error(f"Agent {agent.name} failed: {e}")
                raise
        
        return current_output