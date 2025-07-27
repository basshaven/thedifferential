/**
 * AUEC (Area Under the Efficiency Curve) Analysis Module
 * Handles all efficiency calculations, scoring, and interpretation for The Differential
 */

// Extend DifferentialGame with AUEC methods
DifferentialGame.prototype.getAUECConfig = function(scheme = 'intuitive') {
    const schemes = {
        // New integer-weight system designed for proper area normalization
        // Pattern: Easy tiles high-info but equally high-cost (low ratio)
        // Hard tiles maintain high info/cost ratio for expert reward
        strategic: {
            costWeights: { easy: 9, medium: 6, hard: 2, wrong: 8 },
            infoWeights: { easy: 9, medium: 6, hard: 6, wrong: 0 },
            description: "Strategic system: Easy=1.0, Medium=1.0, Hard=3.0 info/cost ratio"
        }
    };
    
    const config = schemes[scheme] || schemes.strategic;
    
    // Add computed efficiency ratios (info per cost)
    config.efficiency = {
        easy: config.infoWeights.easy / config.costWeights.easy,
        medium: config.infoWeights.medium / config.costWeights.medium,
        hard: config.infoWeights.hard / config.costWeights.hard
    };
    
    console.log(`AUEC Config: Easy=${config.efficiency.easy.toFixed(2)}, Medium=${config.efficiency.medium.toFixed(2)}, Hard=${config.efficiency.hard.toFixed(2)} info/cost`);
    
    return config;
};

DifferentialGame.prototype.calculateAUEC = function() {
    console.log('calculateAUEC called');
    
    try {
        // AUEC Configuration - use clinically sensible weights
        const auecConfig = this.getAUECConfig();

        // Validate required properties exist
        if (!this.gameData || !this.gameData.tiles) {
            throw new Error('Game data or tiles not available');
        }
        
        if (!this.actionSequence) {
            throw new Error('Action sequence data not available');
        }

        // Handle edge case: Failed games (no correct guess) - return 0% score immediately
        const gameWon = this.actionSequence.some(action => action.type === 'correct_guess');
        if (!gameWon) {
            console.log('Failed game detected - returning 0% AUEC score');
            return this.createFailedGameAUEC(auecConfig);
        }

        // Build efficiency curve from chronological action sequence
        const curve = this.buildEfficiencyCurveFromSequence(auecConfig);
        
        // Calculate area under curve (ONLY for vertical segments - info gains)
        const area = this.calculateTrueAUEC(curve);
        
        // Calculate normalization scores
        const scoreA = this.calculateEmpiricalScore(curve, auecConfig);
        const scoreB = this.calculateRectangularScore(area, curve);
        
        console.log('AUEC calculation complete:', { curve, scoreA, scoreB, area });
        
        return {
            curve: curve,
            scoreA: scoreA,
            scoreB: scoreB,
            config: auecConfig,
            userSequence: this.actionSequence,
            interpretation: this.generateAUECInterpretation(scoreA, scoreB, curve, area, gameWon, auecConfig)
        };
        
    } catch (error) {
        console.error('AUEC calculation failed:', error);
        return this.createFallbackAUEC(error.message);
    }
};

DifferentialGame.prototype.createFailedGameAUEC = function(auecConfig) {
    // For failed games, return zero/minimal data
    const curve = [{ x: 0, y: 0, action: 'start' }];
    
    // Add any tile flips that occurred
    let cumulativeCost = 0;
    let cumulativeInfo = 0;
    
    this.actionSequence.forEach(action => {
        if (action.type === 'tile_flip') {
            cumulativeCost += auecConfig.costWeights[action.difficulty];
            cumulativeInfo += auecConfig.infoWeights[action.difficulty];
            curve.push({
                x: cumulativeCost,
                y: cumulativeInfo,
                action: `${action.difficulty}_flip`,
                tileIndex: action.tileIndex
            });
        } else if (action.type === 'wrong_guess') {
            cumulativeCost += (auecConfig.costWeights.wrong || 5); // Default 5 if undefined
            curve.push({
                x: cumulativeCost,
                y: cumulativeInfo,
                action: 'wrong_guess'
            });
        }
    });
    
    return {
        curve: curve,
        scoreA: 0, // Floor failed games at 0
        scoreB: 0,
        config: auecConfig,
        userSequence: this.actionSequence,
        interpretation: this.generateAUECInterpretation(0, 0, curve, 0, false, auecConfig)
    };
};

DifferentialGame.prototype.buildEfficiencyCurveFromSequence = function(auecConfig) {
    let cumulativeCost = 0;
    let cumulativeInfo = 0;
    
    // Start from origin
    const curve = [{ x: 0, y: 0, action: 'start' }];
    
    this.actionSequence.forEach(action => {
        if (action.type === 'tile_flip') {
            cumulativeCost += auecConfig.costWeights[action.difficulty];
            cumulativeInfo += auecConfig.infoWeights[action.difficulty];
            curve.push({
                x: cumulativeCost,
                y: cumulativeInfo,
                action: `${action.difficulty}_flip`,
                tileIndex: action.tileIndex
            });
        } else if (action.type === 'wrong_guess') {
            cumulativeCost += (auecConfig.costWeights.wrong || 5);
            // Wrong guesses add cost but no information
            curve.push({
                x: cumulativeCost,
                y: cumulativeInfo,
                action: 'wrong_guess'
            });
        } else if (action.type === 'correct_guess') {
            // Correct guesses end the game - no additional cost or info
            curve.push({
                x: cumulativeCost,
                y: cumulativeInfo,
                action: 'correct_guess'
            });
        }
    });
    
    return curve;
};

DifferentialGame.prototype.calculateTrueAUEC = function(curve) {
    let area = 0;
    
    for (let i = 1; i < curve.length; i++) {
        const prevPoint = curve[i - 1];
        const currPoint = curve[i];
        
        // Only add area when info increases (trapezoid rule)
        if (currPoint.y > prevPoint.y) {
            const dx = currPoint.x - prevPoint.x;
            // Trapezoid area: dx * (y1 + y2) / 2
            const trapezoidArea = dx * (prevPoint.y + currPoint.y) / 2;
            area += trapezoidArea;
        }
        // Horizontal moves (wrong guesses) contribute no area
    }
    
    return area;
};

DifferentialGame.prototype.calculateEmpiricalScore = function(curve, auecConfig) {
    if (!curve || curve.length === 0) return 0;
    
    try {
        // Calculate user's actual area under curve
        const userArea = this.calculateTrueAUEC(curve);
        
        // Get cached bounds for inverse normalization (smaller area = better score)
        const { bestArea, worstArea } = this.getAUECBounds(auecConfig);
        
        // Normalize to 0-100 scale (inverse: smaller area = higher score)
        if (worstArea > bestArea) {
            const normalizedScore = (worstArea - userArea) / (worstArea - bestArea);
            const clampedScore = Math.max(0, Math.min(1, normalizedScore));
            
            console.log(`AUEC Area: ${userArea.toFixed(1)} (best: ${bestArea.toFixed(1)}, worst: ${worstArea.toFixed(1)})`);
            console.log(`Inverse normalized: ${(clampedScore * 100).toFixed(1)}% of optimal strategy`);
            
            return clampedScore;
        }
        
        return 0;
    } catch (error) {
        console.error('Empirical score calculation failed:', error);
        return 0;
    }
};

DifferentialGame.prototype.calculateIdealArea = function(targetInfo, auecConfig) {
    // Ideal: all hard tiles to reach target information
    const hardEfficiency = auecConfig.efficiency.hard;
    const hardCost = auecConfig.costWeights.hard;
    const hardInfo = auecConfig.infoWeights.hard;
    
    // How many hard tiles needed?
    const tilesNeeded = Math.ceil(targetInfo / hardInfo);
    const totalCost = tilesNeeded * hardCost;
    const totalInfo = tilesNeeded * hardInfo;
    
    // Area = cost × info (rectangle)
    return totalCost * totalInfo;
};

DifferentialGame.prototype.calculateWorstArea = function(targetInfo, auecConfig) {
    // Worst: all easy tiles to reach target information  
    const easyEfficiency = auecConfig.efficiency.easy;
    const easyCost = auecConfig.costWeights.easy;
    const easyInfo = auecConfig.infoWeights.easy;
    
    // How many easy tiles needed?
    const tilesNeeded = Math.ceil(targetInfo / easyInfo);
    const totalCost = tilesNeeded * easyCost;
    const totalInfo = tilesNeeded * easyInfo;
    
    // Area = cost × info (rectangle)
    return totalCost * totalInfo;
};

DifferentialGame.prototype.getAUECBounds = function(auecConfig) {
    // Cache bounds to avoid recalculation
    const cacheKey = `${auecConfig.costWeights.easy}_${auecConfig.costWeights.medium}_${auecConfig.costWeights.hard}_${auecConfig.costWeights.wrong}`;
    
    if (!this._auecBoundsCache) {
        this._auecBoundsCache = {};
    }
    
    if (this._auecBoundsCache[cacheKey]) {
        return this._auecBoundsCache[cacheKey];
    }
    
    // Calculate extreme paths for inverse scoring (smaller area = better performance)
    const bestArea = this.calculateMaxArea(auecConfig);   // Best path: Hard flip → correct (area = 6)
    const worstArea = this.calculateMinArea(auecConfig);  // Worst path: All tiles + 2WG (area = 1032)
    
    const bounds = { bestArea, worstArea };
    this._auecBoundsCache[cacheKey] = bounds;
    
    console.log(`AUEC Bounds: best=${bestArea.toFixed(1)}, worst=${worstArea.toFixed(1)}`);
    return bounds;
};

DifferentialGame.prototype.calculateMaxArea = function(auecConfig) {
    // Best path: Flip one hard tile, then correct guess
    // Point 1: (0, 0)
    // Point 2: (2, 6) - one hard tile
    // Point 3: (2, 6) - correct guess (no move)
    
    const hardCost = auecConfig.costWeights.hard;
    const hardInfo = auecConfig.infoWeights.hard;
    
    // Trapezoid area from (0,0) to (hardCost, hardInfo)
    // Area = dx * (y1 + y2) / 2 = hardCost * (0 + hardInfo) / 2
    const maxArea = hardCost * hardInfo / 2;
    
    return maxArea;
};

DifferentialGame.prototype.calculateMinArea = function(auecConfig) {
    // Worst legal solved path: All tiles in order (Easy→Medium→Hard) + 2 wrong guesses + correct
    const { costWeights, infoWeights } = auecConfig;
    
    const curve = [{ x: 0, y: 0 }]; // Start
    let x = 0, y = 0;
    
    // 2 Easy tiles
    for (let i = 0; i < 2; i++) {
        x += costWeights.easy;
        y += infoWeights.easy;
        curve.push({ x, y });
    }
    
    // 3 Medium tiles
    for (let i = 0; i < 3; i++) {
        x += costWeights.medium;
        y += infoWeights.medium;
        curve.push({ x, y });
    }
    
    // 4 Hard tiles
    for (let i = 0; i < 4; i++) {
        x += costWeights.hard;
        y += infoWeights.hard;
        curve.push({ x, y });
    }
    
    // 2 Wrong guesses (horizontal moves)
    for (let i = 0; i < 2; i++) {
        x += costWeights.wrong;
        curve.push({ x, y }); // No info increase
    }
    
    // Calculate area for this worst path
    return this.calculateTrueAUEC(curve);
};

DifferentialGame.prototype.generateSampleLegalPaths = function(auecConfig, sampleSize = 50) {
    const paths = [];
    
    for (let i = 0; i < sampleSize; i++) {
        paths.push(this.generateRandomLegalPath(auecConfig));
    }
    
    return paths;
};

DifferentialGame.prototype.generateExtremePaths = function(auecConfig) {
    // Best path: hard tiles only, guess on attempt 1
    const bestPath = {
        tiles: [5, 6, 7, 8], // All hard tiles (indices)
        wrongGuesses: 0,
        attempt: 1
    };
    
    // Worst path: easy tiles only, guess on attempt 3 with wrong guesses
    const worstPath = {
        tiles: [0, 1], // All easy tiles
        wrongGuesses: 2,
        attempt: 3
    };
    
    // Balanced path: mix of tiles
    const balancedPath = {
        tiles: [0, 2, 5], // Easy, medium, hard
        wrongGuesses: 1,
        attempt: 2
    };
    
    return [bestPath, worstPath, balancedPath];
};

DifferentialGame.prototype.generateRandomLegalPath = function(auecConfig) {
    const numTiles = Math.floor(Math.random() * 9) + 1; // 1-9 tiles
    const tiles = [];
    
    // Select random tiles
    const availableTiles = Array.from({length: 9}, (_, i) => i);
    for (let i = 0; i < numTiles; i++) {
        const randomIndex = Math.floor(Math.random() * availableTiles.length);
        tiles.push(availableTiles.splice(randomIndex, 1)[0]);
    }
    
    return {
        tiles: tiles,
        wrongGuesses: Math.floor(Math.random() * 3), // 0-2 wrong guesses
        attempt: Math.floor(Math.random() * 3) + 1   // Attempt 1-3
    };
};

DifferentialGame.prototype.calculatePathAUEC = function(path, auecConfig) {
    const curve = this.buildEfficiencyCurveFromPath(path, auecConfig);
    return this.calculateTrueAUEC(curve);
};

DifferentialGame.prototype.buildEfficiencyCurveFromPath = function(path, auecConfig) {
    let cumulativeCost = 0;
    let cumulativeInfo = 0;
    
    const curve = [{ x: 0, y: 0, action: 'start' }];
    
    // Add tile flips
    path.tiles.forEach(tileIndex => {
        const difficulty = this.getTileDifficulty(tileIndex);
        cumulativeCost += auecConfig.costWeights[difficulty];
        cumulativeInfo += auecConfig.infoWeights[difficulty];
        curve.push({
            x: cumulativeCost,
            y: cumulativeInfo,
            action: `${difficulty}_flip`,
            tileIndex: tileIndex
        });
    });
    
    // Add wrong guesses
    for (let i = 0; i < path.wrongGuesses; i++) {
        cumulativeCost += auecConfig.costWeights.wrong;
        curve.push({
            x: cumulativeCost,
            y: cumulativeInfo,
            action: 'wrong_guess'
        });
    }
    
    // Add correct guess (no additional cost/info)
    curve.push({
        x: cumulativeCost,
        y: cumulativeInfo,
        action: 'correct_guess'
    });
    
    return curve;
};

DifferentialGame.prototype.getTileDifficulty = function(tileIndex) {
    if (tileIndex < 2) return 'easy';
    if (tileIndex < 5) return 'medium';
    return 'hard';
};

DifferentialGame.prototype.calculateRectangularScore = function(area, curve) {
    // Simple area-based score for now (avoids circular dependency)
    const maxX = Math.max(...curve.map(p => p.x), 1);
    const maxY = Math.max(...curve.map(p => p.y), 1);
    const maxArea = maxX * maxY;
    
    return maxArea > 0 ? Math.max(0, Math.min(1, area / maxArea)) : 0;
};

DifferentialGame.prototype.createFallbackAUEC = function(errorMessage) {
    const config = this.getAUECConfig();
    const fallbackCurve = [{ x: 0, y: 0, action: 'start' }, { x: 1, y: 1, action: 'fallback' }];
    
    return {
        curve: fallbackCurve,
        scoreA: 0,
        scoreB: 0,
        config: config,
        userSequence: this.actionSequence || [],
        interpretation: {
            headline: "AUEC Analysis Error",
            explanation: `Unable to calculate diagnostic efficiency: ${errorMessage}. This usually indicates a technical issue.`,
            advice: "Try refreshing the page or playing the puzzle again. If the problem persists, the issue may be temporary.",
            tooltips: {
                empirical: "AUEC calculation unavailable due to error",
                rectangular: "Analysis unavailable"
            }
        }
    };
};

DifferentialGame.prototype.generateAUECInterpretation = function(empirical, rectangular, curve, area, gameWon, config) {
    if (!gameWon) {
        return {
            headline: "Game incomplete - analysis limited",
            explanation: "Complete the puzzle to see full efficiency analysis.",
            advice: "Try the puzzle again and aim to flip harder tiles first for better efficiency.",
            tooltips: {
                empirical: "Requires successful completion",
                rectangular: "Requires successful completion"
            }
        };
    }
    
    const empPercent = Math.round(empirical * 100);
    const rectPercent = Math.round(rectangular * 100);
    
    const getCategory = (score) => {
        if (score >= 80) return { label: "Excellent", desc: "Top-tier efficiency" };
        if (score >= 60) return { label: "Strong", desc: "Efficient" };
        if (score >= 30) return { label: "Moderate", desc: "Room to improve" };
        return { label: "Developing", desc: "Learning opportunity" };
    };
    
    const empCategory = getCategory(empPercent);
    const rectCategory = getCategory(rectPercent);

    // Generate headline
    const headline = `Diagnostic Efficiency: ${empPercent}% — ${empCategory.label}`;

    // Compare the two scores
    let comparison = "";
    const scoreDiff = Math.abs(empPercent - rectPercent);

    if (scoreDiff <= 15) {
        comparison = "Your efficiency metrics align well, indicating consistent diagnostic strategy.";
    } else if (rectangular < empirical - 15) {
        comparison = "Your information-gathering was front-loaded, showing strong early strategy.";
    } else if (rectangular > empirical + 15) {
        comparison = "Your later moves were more efficient, showing adaptive strategy.";
    }

    // Generate explanation
    let explanation = `Your AUEC score (${empPercent}%) measures diagnostic efficiency: how much information you gained per unit cost. `;
    
    explanation += `Hard tiles give ${config.efficiency.hard.toFixed(1)}x more info per cost than easy/medium tiles (${config.efficiency.hard.toFixed(1)} vs ${config.efficiency.easy.toFixed(1)}), rewarding strategic thinking. `;
    
    if (empPercent >= 70) {
        explanation += "Excellent efficiency suggests you prioritized hard tiles and avoided unnecessary moves.";
    } else if (empPercent >= 40) {
        explanation += "Good efficiency with room for improvement by flipping harder tiles first.";
    } else {
        explanation += "Lower efficiency suggests focusing on hard tiles first would improve your strategy.";
    }

    // Generate actionable advice
    const wrongGuesses = this.actionSequence.filter(a => a.type === 'wrong_guess').length;
    const tilesFlipped = this.actionSequence.filter(a => a.type === 'tile_flip').length;
    
    let advice = "Strategic tips: ";
    if (wrongGuesses > 0) {
        advice += `Reduce wrong guesses (you had ${wrongGuesses}) by gathering more evidence first. `;
    }
    if (tilesFlipped > 6) {
        advice += "Try using fewer tiles by prioritizing the most informative (hard) ones. ";
    }
    advice += `Remember: hard tiles cost ${config.costWeights.hard} but give ${config.infoWeights.hard} info points (${config.efficiency.hard.toFixed(1)} efficiency), while easy tiles cost ${config.costWeights.easy} but give ${config.infoWeights.easy} info points (${config.efficiency.easy.toFixed(2)} efficiency).`;

    return {
        headline: headline,
        explanation: explanation,
        advice: advice,
        tooltips: {
            empirical: `Diagnostic efficiency score: 100% = perfect strategy. Hard tiles: ${config.efficiency.hard.toFixed(1)} info/cost, Medium: ${config.efficiency.medium.toFixed(1)}, Easy: ${config.efficiency.easy.toFixed(2)}`,
            rectangular: "Area under your efficiency curve compared to theoretical optimal path"
        }
    };
};

DifferentialGame.prototype.generateAUECCalculationBreakdown = function(auecData) {
    try {
        if (!auecData || !auecData.curve || !auecData.config) {
            return '<p style="color: #ccc;">Calculation breakdown unavailable.</p>';
        }

        if (!this.actionSequence) {
            throw new Error('Missing actionSequence');
        }

        const gameWon = this.actionSequence.some(action => action.type === 'correct_guess');
        if (!gameWon) {
            return this.createFailedGameAUEC(auecData.config);
        }

        const tiles = this.actionSequence.filter(a => a.type === 'tile_flip');
        const wrongGuesses = this.actionSequence.filter(a => a.type === 'wrong_guess').length;
        
        // Calculate step-by-step efficiency
        let html = '<div style="color: #ccc; background: rgba(20, 24, 32, 0.6); padding: 15px; border-radius: 8px; margin: 15px 0;">';
        html += '<h5 style="color: #4caf50; margin: 0 0 15px 0; font-size: 16px;">🧮 How Your AUEC Score Was Calculated</h5>';
        
        // Track cumulative values
        let totalCost = 0;
        let totalInfo = 0;
        let weightedEfficiency = 0;
        
        // Tile breakdown with specific tiles mentioned
        const tileBreakdown = tiles.map((action, index) => {
            const cost = auecData.config.costWeights[action.difficulty];
            const info = auecData.config.infoWeights[action.difficulty];
            const efficiency = info / cost;
            
            totalCost += cost;
            totalInfo += info;
            weightedEfficiency += efficiency * cost;
            
            return {
                step: index + 1,
                difficulty: action.difficulty,
                cost,
                info,
                efficiency,
                totalCost,
                totalInfo
            };
        });
        
        // Add wrong guess penalties
        let finalCost = totalCost + (wrongGuesses * auecData.config.costWeights.wrong);
        let finalInfo = totalInfo; // Wrong guesses don't add info
        
        // Use the already-calculated area-based score for consistency
        const areaScore = auecData.scoreA * 100; // Convert to percentage
        const userArea = this.calculateTrueAUEC(auecData.curve);
        const { bestArea, worstArea } = this.getAUECBounds(auecData.config);
        
        // Generate the breakdown
        html += '<div style="font-family: monospace; font-size: 12px; line-height: 1.4;">';
        
        // Step-by-step tile analysis
        tileBreakdown.forEach(step => {
            const efficiencyColor = step.efficiency >= 2 ? '#4caf50' : step.efficiency >= 1 ? '#ffeb3b' : '#ff9800';
            html += `<div style="margin: 5px 0; padding: 5px; background: rgba(0,0,0,0.3); border-radius: 4px;">`;
            html += `<strong>Step ${step.step}:</strong> <span style="color: ${efficiencyColor}">${step.difficulty.toUpperCase()}</span> tile → `;
            html += `Cost: ${step.cost}, Info: ${step.info} (${step.efficiency.toFixed(2)} ratio)`;
            html += `</div>`;
        });
        
        if (wrongGuesses > 0) {
            html += `<div style="margin: 5px 0; padding: 5px; background: rgba(244, 67, 54, 0.2); border-radius: 4px;">`;
            html += `<strong>Penalties:</strong> ${wrongGuesses} wrong guess${wrongGuesses > 1 ? 'es' : ''} → +${wrongGuesses * auecData.config.costWeights.wrong} cost, +0 info`;
            html += `</div>`;
        }
        
        // Final calculation using consistent area-based scoring
        html += '<div style="margin: 15px 0 10px 0; padding: 10px; background: rgba(76, 175, 80, 0.1); border-radius: 4px;">';
        html += '<h6 style="color: #4caf50; margin: 0 0 8px 0;">🏆 Final AUEC Score</h6>';
        html += `<div><strong>Your Area:</strong> ${userArea.toFixed(1)} (trapezoids under curve)</div>`;
        html += `<div><strong>Best Possible:</strong> ${bestArea.toFixed(1)} (1 hard tile → correct)</div>`;
        html += `<div><strong>Worst Possible:</strong> ${worstArea.toFixed(1)} (all tiles + wrong guesses)</div>`;
        html += `<div style="border-top: 1px solid #333; margin-top: 8px; padding-top: 8px;">`;
        html += `<strong>📊 Score Calculation:</strong><br>`;
        html += `<code style="background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 3px; font-family: monospace;">`;
        html += `(${worstArea.toFixed(1)} - ${userArea.toFixed(1)}) ÷ (${worstArea.toFixed(1)} - ${bestArea.toFixed(1)}) × 100 = ${areaScore.toFixed(1)}%`;
        html += `</code><br>`;
        html += `<strong>Your Score:</strong> <span style="color: #4caf50;">${areaScore.toFixed(1)}% strategic efficiency</span>`;
        html += `<br><small style="color: #999;">Formula: (worst - yours) ÷ (worst - best) × 100 | Smaller area = better strategy</small>`;
        html += `</div></div>`;
        
        html += '</div>';
        
        // Strategy examples
        html += this.generateStrategyExamples(finalInfo, auecData.config, 
            areaScore, bestArea, worstArea);
        
        html += '</div>';
        
        return html;
        
    } catch (error) {
        console.error('Error generating AUEC breakdown:', error);
        return `<p style="color: #f44336;">Error generating calculation breakdown: ${error.message}</p>`;
    }
};

DifferentialGame.prototype.generatePathStoryBreakdown = function(tileBreakdown, wrongGuesses, finalCost, finalInfo) {
    let story = '<h6 style="color: #ffeb3b; margin: 10px 0 5px 0;">📋 Your Diagnostic Path</h6>';
    story += '<div style="font-size: 11px;">';
    
    tileBreakdown.forEach((step, index) => {
        const efficiency = step.info / step.cost;
        const efficiencyEmoji = efficiency >= 2 ? '🎯' : efficiency >= 1 ? '👍' : '⚠️';
        story += `${index + 1}. ${efficiencyEmoji} Flipped ${step.difficulty} tile (${efficiency.toFixed(1)}x efficiency)<br>`;
    });
    
    if (wrongGuesses > 0) {
        story += `❌ Made ${wrongGuesses} wrong guess${wrongGuesses > 1 ? 'es' : ''} (+${wrongGuesses * 5} cost)<br>`;
    }
    
    story += `✅ Successful diagnosis (Total: ${finalCost} cost, ${finalInfo} info)`;
    story += '</div>';
    
    return story;
};

DifferentialGame.prototype.generateStrategyExamples = function(finalInfo, config, userScore, bestArea, worstArea) {
    let examples = '<h6 style="color: #ffeb3b; margin: 10px 0 5px 0;">💡 Strategy Comparison</h6>';
    examples += '<div style="font-size: 11px; line-height: 1.3;">';
    examples += `<div>🏆 <strong>Perfect:</strong> 1 hard tile → area ${bestArea.toFixed(1)} → 100% score</div>`;
    examples += `<div>👤 <strong>You:</strong> ${userScore.toFixed(1)}% strategic efficiency</div>`;
    examples += `<div>📈 <strong>Key:</strong> Hard tiles cost ${config.costWeights.hard} but give ${config.infoWeights.hard} info (${config.efficiency.hard.toFixed(1)}x efficiency)</div>`;
    examples += `<div>⚡ <strong>Strategy:</strong> Start with hard tiles to minimize area under curve</div>`;
    examples += '</div>';
    
    return examples;
};

DifferentialGame.prototype.generateCurveInterpretation = function(curve, userArea, perfectArea) {
    const frontLoaded = this.isCurveFrontLoaded(curve);
    
    let interpretation = frontLoaded 
        ? "Your curve shows front-loaded efficiency - you started with high-value tiles." 
        : "Your curve shows back-loaded efficiency - you improved your strategy over time.";
    
    const areaPercent = Math.round((userArea / perfectArea) * 100);
    interpretation += ` Your area represents ${areaPercent}% of the theoretical maximum.`;
    
    return interpretation;
};

DifferentialGame.prototype.isCurveFrontLoaded = function(curve) {
    if (curve.length < 3) return false;
    
    const midPoint = Math.floor(curve.length / 2);
    const firstHalfSlope = (curve[midPoint].y - curve[0].y) / (curve[midPoint].x - curve[0].x || 1);
    const secondHalfSlope = (curve[curve.length - 1].y - curve[midPoint].y) / (curve[curve.length - 1].x - curve[midPoint].x || 1);
    
    return firstHalfSlope > secondHalfSlope;
};