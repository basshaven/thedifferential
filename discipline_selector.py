#!/usr/bin/env python3
"""
Deterministic discipline and category selection for The Differential.
This script handles all probabilistic choices BEFORE calling the AI model.
"""

import random
import json
from datetime import datetime
from typing import Dict, Any, Tuple
import config

class DisciplineSelector:
    """Handles deterministic selection of medical discipline and puzzle category."""
    
    def __init__(self, seed=None):
        """Initialize selector with optional seed for reproducible results."""
        if seed is not None:
            random.seed(seed)
        self.selection_history = []
    
    def select_discipline_and_category(self, forced_discipline: str = None, forced_category: str = None) -> Dict[str, Any]:
        """
        Select discipline and category using weighted probabilities.
        
        Returns:
            Dict containing:
            - discipline: Selected medical discipline
            - category: Selected puzzle category (diagnosis/lab_test/adverse_event)
            - rationale: Explanation of why this combination was chosen
            - weights_used: The probability weights that led to this selection
        """
        
        # Stage 1: Select discipline
        if forced_discipline:
            if forced_discipline not in config.DISCIPLINE_WEIGHTS:
                available = list(config.DISCIPLINE_WEIGHTS.keys())
                raise ValueError(f"Unknown discipline '{forced_discipline}'. Available: {available}")
            selected_discipline = forced_discipline
            discipline_source = "forced"
        else:
            selected_discipline = self._select_weighted_discipline()
            discipline_source = "weighted_random"
        
        # Stage 2: Select category based on discipline
        if forced_category:
            if forced_category not in config.PUZZLE_CATEGORIES:
                available = list(config.PUZZLE_CATEGORIES.keys())
                raise ValueError(f"Unknown category '{forced_category}'. Available: {available}")
            selected_category = forced_category
            category_source = "forced"
        else:
            selected_category = self._select_weighted_category(selected_discipline)
            category_source = "weighted_random"
        
        # Generate selection rationale
        rationale = self._generate_rationale(
            selected_discipline, selected_category, 
            discipline_source, category_source
        )
        
        # Track selection for history/analysis
        selection_record = {
            "timestamp": datetime.now().isoformat(),
            "discipline": selected_discipline,
            "category": selected_category,
            "discipline_source": discipline_source,
            "category_source": category_source,
            "discipline_weight": config.DISCIPLINE_WEIGHTS[selected_discipline],
            "category_weight": self._get_category_weight(selected_discipline, selected_category)
        }
        self.selection_history.append(selection_record)
        
        return {
            "discipline": selected_discipline,
            "category": selected_category,
            "rationale": rationale,
            "weights_used": {
                "discipline_weight": config.DISCIPLINE_WEIGHTS[selected_discipline],
                "category_weight": self._get_category_weight(selected_discipline, selected_category),
                "selection_method": f"{discipline_source}_{category_source}"
            },
            "selection_record": selection_record
        }
    
    def _select_weighted_discipline(self) -> str:
        """Select discipline using weighted random selection."""
        disciplines = list(config.DISCIPLINE_WEIGHTS.keys())
        weights = list(config.DISCIPLINE_WEIGHTS.values())
        
        # Normalize weights to ensure they sum to 1.0
        total_weight = sum(weights)
        normalized_weights = [w / total_weight for w in weights]
        
        return random.choices(disciplines, weights=normalized_weights)[0]
    
    def _select_weighted_category(self, discipline: str) -> str:
        """Select category using weighted selection, modified by discipline preferences."""
        
        # Start with base category weights
        base_weights = {cat: info["weight"] for cat, info in config.PUZZLE_CATEGORIES.items()}
        
        # Apply discipline-specific modifiers if they exist
        if discipline in config.DISCIPLINE_CATEGORY_MODIFIERS:
            modifiers = config.DISCIPLINE_CATEGORY_MODIFIERS[discipline]
            for category, modifier in modifiers.items():
                if category in base_weights:
                    base_weights[category] *= modifier
        
        # Normalize weights
        total_weight = sum(base_weights.values())
        normalized_weights = {cat: weight / total_weight for cat, weight in base_weights.items()}
        
        # Random selection
        categories = list(normalized_weights.keys())
        weights = list(normalized_weights.values())
        
        return random.choices(categories, weights=weights)[0]
    
    def _get_category_weight(self, discipline: str, category: str) -> float:
        """Get the effective weight for a category given the discipline."""
        base_weight = config.PUZZLE_CATEGORIES[category]["weight"]
        
        # Apply discipline modifier if it exists
        if discipline in config.DISCIPLINE_CATEGORY_MODIFIERS:
            modifiers = config.DISCIPLINE_CATEGORY_MODIFIERS[discipline]
            if category in modifiers:
                return base_weight * modifiers[category]
        
        return base_weight
    
    def _generate_rationale(self, discipline: str, category: str, 
                          discipline_source: str, category_source: str) -> str:
        """Generate human-readable explanation for the selection."""
        
        rationale_parts = []
        
        # Discipline rationale
        if discipline_source == "forced":
            rationale_parts.append(f"Discipline '{discipline}' was explicitly specified.")
        else:
            discipline_weight = config.DISCIPLINE_WEIGHTS[discipline]
            rationale_parts.append(
                f"Discipline '{discipline}' selected via weighted random (weight: {discipline_weight:.2f})."
            )
        
        # Category rationale
        if category_source == "forced":
            rationale_parts.append(f"Category '{category}' was explicitly specified.")
        else:
            effective_weight = self._get_category_weight(discipline, category)
            base_weight = config.PUZZLE_CATEGORIES[category]["weight"]
            
            if effective_weight != base_weight:
                modifier = effective_weight / base_weight
                rationale_parts.append(
                    f"Category '{category}' selected with discipline modifier "
                    f"(base: {base_weight:.2f}, modified: {effective_weight:.2f}, {modifier:.1f}x)."
                )
            else:
                rationale_parts.append(
                    f"Category '{category}' selected via standard weighting ({base_weight:.2f})."
                )
        
        return " ".join(rationale_parts)
    
    def get_selection_stats(self) -> Dict[str, Any]:
        """Get statistics about recent selections for analysis."""
        if not self.selection_history:
            return {"message": "No selections recorded yet"}
        
        # Count disciplines
        discipline_counts = {}
        category_counts = {}
        
        for record in self.selection_history:
            disc = record["discipline"]
            cat = record["category"]
            
            discipline_counts[disc] = discipline_counts.get(disc, 0) + 1
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        total_selections = len(self.selection_history)
        
        return {
            "total_selections": total_selections,
            "discipline_distribution": {
                disc: {"count": count, "percentage": count/total_selections*100}
                for disc, count in discipline_counts.items()
            },
            "category_distribution": {
                cat: {"count": count, "percentage": count/total_selections*100}
                for cat, count in category_counts.items()
            },
            "recent_selections": self.selection_history[-10:] if len(self.selection_history) > 10 else self.selection_history
        }
    
    def save_selection_history(self, filename: str = "selection_history.json"):
        """Save selection history to file for analysis."""
        with open(filename, 'w') as f:
            json.dump({
                "metadata": {
                    "total_selections": len(self.selection_history),
                    "generated_at": datetime.now().isoformat()
                },
                "selections": self.selection_history,
                "statistics": self.get_selection_stats()
            }, f, indent=2)


def main():
    """Command-line interface for testing discipline selection."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test discipline and category selection")
    parser.add_argument('--discipline', help='Force specific discipline')
    parser.add_argument('--category', help='Force specific category') 
    parser.add_argument('--seed', type=int, help='Random seed for reproducible results')
    parser.add_argument('--count', type=int, default=1, help='Number of selections to make')
    parser.add_argument('--stats', action='store_true', help='Show statistics after selections')
    
    args = parser.parse_args()
    
    # Create selector
    selector = DisciplineSelector(seed=args.seed)
    
    print("🎯 Discipline & Category Selector")
    print("=" * 40)
    
    # Make selections
    for i in range(args.count):
        if args.count > 1:
            print(f"\n📋 Selection #{i+1}:")
        
        try:
            result = selector.select_discipline_and_category(
                forced_discipline=args.discipline,
                forced_category=args.category
            )
            
            print(f"🏥 Discipline: {result['discipline']}")
            print(f"📊 Category: {result['category']}")
            print(f"💡 Rationale: {result['rationale']}")
            print(f"⚖️  Weights: {result['weights_used']}")
            
        except ValueError as e:
            print(f"❌ Error: {e}")
            return
    
    # Show statistics if requested
    if args.stats and args.count > 1:
        print("\n📈 Selection Statistics:")
        print("=" * 40)
        stats = selector.get_selection_stats()
        
        print("\nDiscipline Distribution:")
        for disc, info in stats["discipline_distribution"].items():
            print(f"  {disc}: {info['count']} ({info['percentage']:.1f}%)")
        
        print("\nCategory Distribution:")
        for cat, info in stats["category_distribution"].items():
            print(f"  {cat}: {info['count']} ({info['percentage']:.1f}%)")


if __name__ == "__main__":
    main()