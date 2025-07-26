class DifferentialGame {
    constructor() {
        this.gameData = null;
        this.score = 25;
        this.attempts = 3;
        this.flippedTiles = new Set();
        this.gameEnded = false;
        this.selectedConcept = '';
        this.concepts = [];
        this.scoreLog = [];
        this.actionSequence = []; // Track chronological order of all actions
        
        this.init();
    }

    async init() {
        await this.loadGameData();
        console.log('Game data loaded:', this.gameData ? 'success' : 'failed');
        this.setupBoard();
        this.setupGuessInput();
        this.updateDisplay();
        this.updateLastModified();
    }

    async loadGameData() {
        try {
            // Add cache-busting parameter to ensure fresh data
            const timestamp = new Date().getTime();
            const response = await fetch(`today.json?v=${timestamp}`);
            if (!response.ok) throw new Error('Network response was not ok');
            this.gameData = await response.json();
            this.concepts = this.gameData.concepts;
            console.log('Loaded fresh data from today.json');
        } catch (error) {
            console.error('Failed to load game data, using fallback:', error);
            this.gameData = this.getFallbackData();
            this.concepts = this.gameData.concepts;
            console.log('Using embedded fallback data');
        }
    }

    getFallbackData() {
        return {
            "date": "2025-07-24",
            "answer": "Minimal Change Disease",
            "acceptable_answers": [
                "Minimal Change Disease",
                "MCD",
                "Minimal change nephropathy",
                "Minimal change glomerulopathy",
                "Lipoid nephrosis"
            ],
            "tiles": [
                {
                    "difficulty": "easy",
                    "clue": "8yo boy swelling"
                },
                {
                    "difficulty": "easy", 
                    "clue": "Facial puffiness"
                },
                {
                    "difficulty": "medium",
                    "clue": "Protein 4+ dipstick"
                },
                {
                    "difficulty": "medium",
                    "clue": "Albumin 1.8 g/dL"
                },
                {
                    "difficulty": "medium",
                    "clue": "Cholesterol 320"
                },
                {
                    "difficulty": "hard",
                    "clue": "Normal glomeruli LM"
                },
                {
                    "difficulty": "hard",
                    "clue": "Podocyte fusion EM"
                },
                {
                    "difficulty": "hard",
                    "clue": "Steroid responsive"
                },
                {
                    "difficulty": "hard",
                    "clue": "No immune deposits"
                }
            ],
            "concepts": [
                "Minimal Change Disease",
                "Focal Segmental Glomerulosclerosis",
                "Membranous Nephropathy",
                "Membranoproliferative GN",
                "IgA Nephropathy",
                "Lupus Nephritis",
                "Diabetic Nephropathy",
                "Amyloidosis",
                "Post-infectious GN",
                "Acute Tubular Necrosis",
                "Chronic Kidney Disease",
                "Nephritic Syndrome",
                "Acute Interstitial Nephritis",
                "Polycystic Kidney Disease",
                "Alport Syndrome",
                "Thin Basement Membrane",
                "IgM Nephropathy",
                "C3 Glomerulopathy",
                "Anti-GBM Disease",
                "Thrombotic Microangiopathy",
                "Light Chain Deposition",
                "Fibrillary GN",
                "Immunotactoid GN"
            ],
            "explanations": {
                "tile_0": "Young age (8 years old) is classic for minimal change disease, which is the most common cause of nephrotic syndrome in children.",
                "tile_1": "Facial swelling, especially periorbital edema, is often the first sign parents notice in pediatric nephrotic syndrome.",
                "tile_2": "Massive proteinuria (4+ on dipstick) is the hallmark of nephrotic syndrome, defined as >3.5g protein per day.",
                "tile_3": "Severe hypoalbuminemia (<2.5 g/dL) occurs due to urinary protein losses and contributes to edema formation.",
                "tile_4": "Hypercholesterolemia is part of the classic nephrotic syndrome tetrad, caused by increased hepatic lipoprotein synthesis.",
                "tile_5": "Light microscopy shows normal-appearing glomeruli in minimal change disease, distinguishing it from other causes.",
                "tile_6": "Electron microscopy reveals podocyte foot process effacement (fusion), the pathognomonic finding in minimal change disease.",
                "tile_7": "Excellent response to corticosteroids (>90% in children) is characteristic and helps confirm the diagnosis.",
                "tile_8": "Absence of immune deposits on immunofluorescence distinguishes minimal change disease from immune-mediated glomerulonephritis."
            }
        };
    }

    setupBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';

        if (!this.gameData || !this.gameData.tiles) {
            console.error('No game data available for board setup');
            gameBoard.innerHTML = '<p>Unable to load game board. Please refresh the page.</p>';
            return;
        }

        // Create columns by difficulty: easy, medium, hard
        const difficulties = ['easy', 'medium', 'hard'];
        
        difficulties.forEach(difficulty => {
            const column = document.createElement('div');
            column.className = 'game-column';
            
            // Find all tiles of this difficulty
            this.gameData.tiles.forEach((tile, index) => {
                if (tile.difficulty === difficulty) {
                    const tileElement = document.createElement('div');
                    tileElement.className = `tile difficulty-${tile.difficulty}`;
                    tileElement.dataset.index = index;
                    tileElement.innerHTML = `<div class="tile-content"></div>`;
                    tileElement.addEventListener('click', () => this.flipTile(index));
                    column.appendChild(tileElement);
                }
            });
            
            gameBoard.appendChild(column);
        });
    }

    flipTile(index) {
        if (this.flippedTiles.has(index)) return;

        const tile = this.gameData.tiles[index];
        const tileElement = document.querySelector(`[data-index="${index}"]`);
        
        this.flippedTiles.add(index);
        tileElement.classList.add('flipped');
        tileElement.querySelector('.tile-content').textContent = tile.clue;

        if (!this.gameEnded) {
            // Record the action in chronological order
            this.actionSequence.push({
                type: 'tile_flip',
                tileIndex: index,
                difficulty: tile.difficulty,
                timestamp: Date.now()
            });
            
            this.updateScore(tile.difficulty, 'flip');
            this.logAction(`Flipped ${tile.difficulty} tile`, this.getScoreChange(tile.difficulty, 'flip'));
        }
        this.updateDisplay();
    }

    updateScore(difficulty, action) {
        if (action === 'flip') {
            const scoreMap = {
                'hard': -1,   // Hard tiles cost least (most valuable info)
                'medium': -2, // Medium cost
                'easy': -3    // Easy tiles cost most (least valuable info)
            };
            this.score += scoreMap[difficulty];
        } else if (action === 'correct_guess') {
            const bonuses = [25, 10, 0];
            this.score += bonuses[3 - this.attempts];
        } else if (action === 'wrong_guess') {
            this.score -= 5;
        }

        this.score = Math.max(0, Math.min(100, this.score));
    }

    getScoreChange(difficulty, action) {
        if (action === 'flip') {
            const scoreMap = {
                'hard': -1,
                'medium': -2,
                'easy': -3
            };
            return scoreMap[difficulty];
        } else if (action === 'correct_guess') {
            const bonuses = [25, 10, 0];
            return bonuses[3 - this.attempts];
        } else if (action === 'wrong_guess') {
            return -5;
        }
        return 0;
    }

    logAction(action, scoreChange) {
        const logElement = document.getElementById('scoreLog');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        if (scoreChange > 0) {
            entry.classList.add('score-gain');
            entry.textContent = `${action}: +${scoreChange} points (${this.score})`;
        } else if (scoreChange < 0) {
            entry.classList.add('score-loss');
            entry.textContent = `${action}: ${scoreChange} points (${this.score})`;
        } else {
            entry.textContent = `${action}: ${scoreChange} points (${this.score})`;
        }
        
        logElement.appendChild(entry);
        logElement.scrollTop = logElement.scrollHeight;
    }

    setupGuessInput() {
        const input = document.getElementById('guessInput');
        const submitBtn = document.getElementById('submitGuess');

        input.addEventListener('input', (e) => {
            this.selectedConcept = e.target.value.trim();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.makeGuess();
            }
        });

        submitBtn.addEventListener('click', () => this.makeGuess());
    }


    makeGuess() {
        if (this.gameEnded || this.attempts <= 0 || !this.selectedConcept) return;

        const isCorrect = this.checkAnswerMatch(this.selectedConcept, this.gameData);
        
        if (isCorrect) {
            // Record the correct guess
            this.actionSequence.push({
                type: 'correct_guess',
                attempt: 4 - this.attempts,
                timestamp: Date.now()
            });
            
            const bonus = this.getScoreChange('', 'correct_guess');
            this.updateScore('', 'correct_guess');
            this.logAction(`Correct guess on attempt ${4 - this.attempts}`, bonus);
            this.showMessage(`Correct! The answer was ${this.gameData.answer}`, 'success');
            this.endGame(true);
        } else {
            // Record the wrong guess
            this.actionSequence.push({
                type: 'wrong_guess',
                guess: this.selectedConcept,
                attempt: 4 - this.attempts,
                timestamp: Date.now()
            });
            
            this.attempts--;
            this.updateScore('', 'wrong_guess');
            this.logAction(`Wrong guess: "${this.selectedConcept}"`, -5);
            
            if (this.attempts <= 0) {
                this.showMessage(`Game Over! The correct answer was ${this.gameData.answer}`, 'error');
                this.endGame(false);
            } else {
                this.showMessage(`Incorrect. ${this.attempts} attempts remaining.`, 'error');
            }
        }
        
        this.updateDisplay();
        document.getElementById('guessInput').value = '';
        this.selectedConcept = '';
    }

    checkAnswerMatch(userInput, gameData) {
        if (!userInput || !gameData) return false;
        
        // Normalize user input
        const normalizedInput = this.normalizeAnswer(userInput);
        
        // Check primary answer
        if (normalizedInput === this.normalizeAnswer(gameData.answer)) {
            return true;
        }
        
        // Check acceptable answers if they exist
        if (gameData.acceptable_answers && Array.isArray(gameData.acceptable_answers)) {
            for (const acceptableAnswer of gameData.acceptable_answers) {
                if (normalizedInput === this.normalizeAnswer(acceptableAnswer)) {
                    return true;
                }
            }
        }
        
        // Check fuzzy matching for typos
        if (this.isFuzzyMatch(normalizedInput, gameData)) {
            return true;
        }
        
        return false;
    }

    normalizeAnswer(answer) {
        if (!answer) return '';
        
        return answer
            .toLowerCase()
            .trim()
            // Remove punctuation
            .replace(/['\-\s]+/g, ' ')
            .replace(/[^\w\s]/g, '')
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }

    isFuzzyMatch(normalizedInput, gameData) {
        // Only check fuzzy matching if input is reasonable length
        if (normalizedInput.length < 3) return false;
        
        const targets = [gameData.answer];
        if (gameData.acceptable_answers) {
            targets.push(...gameData.acceptable_answers);
        }
        
        for (const target of targets) {
            const normalizedTarget = this.normalizeAnswer(target);
            
            // Check if input is very close (1-2 character difference)
            if (this.levenshteinDistance(normalizedInput, normalizedTarget) <= Math.max(1, Math.floor(normalizedTarget.length * 0.15))) {
                return true;
            }
            
            // Check if input contains the key part of the answer (for partial matches)
            if (this.isPartialMatch(normalizedInput, normalizedTarget)) {
                return true;
            }
        }
        
        return false;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    isPartialMatch(input, target) {
        // Check if input is a significant part of the target (organism vs disease name)
        const inputWords = input.split(' ').filter(word => word.length > 2);
        const targetWords = target.split(' ').filter(word => word.length > 2);
        
        if (inputWords.length === 0 || targetWords.length === 0) return false;
        
        // If input is just one significant word and it matches a word in target
        if (inputWords.length === 1 && targetWords.includes(inputWords[0])) {
            return true;
        }
        
        // Check if most significant words match
        const matchingWords = inputWords.filter(word => targetWords.includes(word));
        return matchingWords.length >= Math.min(inputWords.length, targetWords.length) * 0.7;
    }

    endGame(won) {
        console.log('Game ended. Won:', won);
        this.gameEnded = true;
        document.getElementById('guessInput').disabled = true;
        document.getElementById('submitGuess').disabled = true;
        
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.classList.add('game-ended');
        });
        
        // Add visual flourish
        this.addGameEndFlourish(won);
        
        // Show explanations after animations
        setTimeout(() => {
            if (won) {
                console.log('Calculating performance assessment...');
                const assessment = this.calculatePerformanceAssessment();
                this.showPerformanceAssessment(assessment);
            } else {
                console.log('Showing AUEC analysis for lost game...');
                try {
                    const auecData = this.calculateAUEC();
                    this.showAUECOnly(auecData);
                } catch (error) {
                    console.error('AUEC calculation failed for lost game:', error);
                }
            }
            this.showExplanations();
        }, won ? 3000 : 2000);
    }

    calculatePerformanceAssessment() {
        // Generate all possible winning paths
        const allPaths = this.generateAllWinningPaths();
        
        // Calculate user's path efficiency
        const userPath = this.getUserPath();
        const userEfficiency = this.calculatePathEfficiency(userPath);
        
        // Find percentile ranking
        const allEfficiencies = allPaths.map(path => this.calculatePathEfficiency(path));
        allEfficiencies.sort((a, b) => a - b); // Sort ascending (worst to best)
        
        const userRank = allEfficiencies.findIndex(efficiency => efficiency >= userEfficiency);
        const percentile = Math.round(((allEfficiencies.length - userRank - 1) / allEfficiencies.length) * 100);
        
        // Calculate additional metrics
        const tilesFlipped = this.flippedTiles.size;
        const attemptsUsed = 4 - this.attempts;
        const diagnosticSpeed = this.calculateDiagnosticSpeed(userPath);
        const riskAssessment = this.calculateRiskTolerance(userPath);
        
        return {
            score: this.score,
            percentile: percentile,
            efficiency: userEfficiency,
            tilesFlipped: tilesFlipped,
            attemptsUsed: attemptsUsed,
            diagnosticSpeed: diagnosticSpeed,
            riskAssessment: riskAssessment,
            totalPossiblePaths: allPaths.length,
            userPath: userPath,
            pathAnalysis: this.analyzeUserPath(userPath)
        };
    }

    generateAllWinningPaths() {
        const paths = [];
        
        // Generate all possible combinations of tiles that could lead to a win
        // For each attempt (1st, 2nd, 3rd), try all possible tile combinations
        
        for (let attempt = 1; attempt <= 3; attempt++) {
            // Try all possible combinations of 0 to 9 tiles
            for (let numTiles = 0; numTiles <= 9; numTiles++) {
                const combinations = this.generateTileCombinations(numTiles);
                combinations.forEach(tileSet => {
                    paths.push({
                        tiles: tileSet,
                        attempt: attempt,
                        numTiles: numTiles
                    });
                });
            }
        }
        
        return paths;
    }

    generateTileCombinations(numTiles) {
        if (numTiles === 0) return [[]];
        
        const allTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        const combinations = [];
        
        const generateCombos = (current, remaining, needed) => {
            if (needed === 0) {
                combinations.push([...current]);
                return;
            }
            
            for (let i = 0; i < remaining.length; i++) {
                const tile = remaining[i];
                const newCurrent = [...current, tile];
                const newRemaining = remaining.slice(i + 1);
                generateCombos(newCurrent, newRemaining, needed - 1);
            }
        };
        
        generateCombos([], allTiles, numTiles);
        return combinations;
    }

    calculatePathEfficiency(path) {
        let score = 25; // Base score
        
        // Subtract tile costs
        path.tiles.forEach(tileIndex => {
            const tile = this.gameData.tiles[tileIndex];
            if (tile.difficulty === 'easy') score -= 3;
            else if (tile.difficulty === 'medium') score -= 2;
            else if (tile.difficulty === 'hard') score -= 1;
        });
        
        // Add guess bonus
        const bonuses = [25, 10, 0];
        score += bonuses[path.attempt - 1];
        
        // Normalize to 0-100 range
        return Math.max(0, Math.min(100, score));
    }

    getUserPath() {
        return {
            tiles: Array.from(this.flippedTiles),
            attempt: 4 - this.attempts,
            numTiles: this.flippedTiles.size
        };
    }

    calculateDiagnosticSpeed(userPath) {
        // Classify based on tiles flipped before correct guess
        if (userPath.numTiles <= 2) return { 
            category: "Lightning Fast",
            reason: `Diagnosed with minimal evidence (${userPath.numTiles} tiles). Shows pattern recognition mastery.`
        };
        if (userPath.numTiles <= 4) return {
            category: "Quick", 
            reason: `Diagnosed efficiently (${userPath.numTiles} tiles). Good balance of speed and certainty.`
        };
        if (userPath.numTiles <= 6) return {
            category: "Methodical",
            reason: `Gathered moderate evidence (${userPath.numTiles} tiles). Systematic diagnostic approach.`
        };
        if (userPath.numTiles <= 8) return {
            category: "Thorough",
            reason: `Comprehensive evidence gathering (${userPath.numTiles} tiles). Cautious but complete approach.`
        };
        return {
            category: "Exhaustive",
            reason: `Revealed most/all tiles (${userPath.numTiles}/9). Very thorough, risk-averse approach.`
        };
    }

    calculateRiskTolerance(userPath) {
        // Analyze tile selection pattern
        if (userPath.numTiles === 0) {
            return {
                category: "Maximum Risk",
                reason: "Guessed without any evidence. Pure pattern recognition or lucky guess."
            };
        }
        
        const easyTiles = userPath.tiles.filter(idx => this.gameData.tiles[idx].difficulty === 'easy').length;
        const mediumTiles = userPath.tiles.filter(idx => this.gameData.tiles[idx].difficulty === 'medium').length;
        const hardTiles = userPath.tiles.filter(idx => this.gameData.tiles[idx].difficulty === 'hard').length;
        
        const easyRatio = easyTiles / userPath.numTiles;
        const hardRatio = hardTiles / userPath.numTiles;
        
        if (easyRatio >= 0.6) return {
            category: "Conservative",
            reason: `Prioritized easy tiles (${easyTiles}/${userPath.numTiles}). Focuses on high-value, pathognomonic clues.`
        };
        if (hardRatio >= 0.5) return {
            category: "Efficient",
            reason: `Emphasized hard tiles (${hardTiles}/${userPath.numTiles}). Values low-cost, technical details.`
        };
        return {
            category: "Balanced",
            reason: `Mixed tile selection (Easy: ${easyTiles}, Medium: ${mediumTiles}, Hard: ${hardTiles}). Systematic approach.`
        };
    }

    analyzeUserPath(userPath) {
        const analysis = [];
        
        // Analyze tile selection strategy
        const firstTile = userPath.tiles[0];
        if (firstTile !== undefined) {
            const firstDifficulty = this.gameData.tiles[firstTile].difficulty;
            if (firstDifficulty === 'easy') {
                analysis.push("✅ Started with easy tile - optimal strategy");
            } else if (firstDifficulty === 'hard') {
                analysis.push("⚠️ Started with hard tile - less efficient approach");
            } else {
                analysis.push("🔄 Started with medium tile - moderate approach");
            }
        }
        
        // Analyze attempt timing
        if (userPath.attempt === 1) {
            if (userPath.numTiles <= 3) {
                analysis.push("🎯 Expert-level rapid diagnosis");
            } else {
                analysis.push("⚡ Quick first attempt despite gathering evidence");
            }
        } else if (userPath.attempt === 2) {
            analysis.push("🤔 Took time to gather more evidence - prudent approach");
        } else {
            analysis.push("🔍 Used all attempts - thorough but cautious");
        }
        
        // Analyze efficiency
        const efficiency = this.calculatePathEfficiency(userPath);
        if (efficiency >= 90) {
            analysis.push("🏆 Near-perfect efficiency");
        } else if (efficiency >= 70) {
            analysis.push("✨ High efficiency");
        } else if (efficiency >= 50) {
            analysis.push("📊 Moderate efficiency");
        } else {
            analysis.push("🎓 Room for improvement in efficiency");
        }
        
        return analysis;
    }

    getAUECConfig(scheme = 'intuitive') {
        const schemes = {
            // Intuitive: Make hard tiles most valuable, easy tiles least efficient
            intuitive: {
                costWeights: { easy: 3, medium: 2, hard: 1, wrong: 5 },
                infoWeights: { easy: 1, medium: 2, hard: 3, wrong: 0 },
                description: "Hard tiles cheapest & most valuable (classic puzzle strategy)"
            },
            // Clinical: Hard tiles more expensive but much more informative  
            clinical: {
                costWeights: { easy: 1, medium: 2, hard: 3, wrong: 8 },
                infoWeights: { easy: 1, medium: 4, hard: 9, wrong: 0 },
                description: "Hard clues expensive but information-dense"
            }
        };
        
        const config = schemes[scheme] || schemes.intuitive;
        
        // Add computed efficiency ratios (info per cost)
        config.efficiency = {
            easy: config.infoWeights.easy / config.costWeights.easy,
            medium: config.infoWeights.medium / config.costWeights.medium,
            hard: config.infoWeights.hard / config.costWeights.hard
        };
        
        console.log(`AUEC Config: Easy=${config.efficiency.easy.toFixed(2)}, Medium=${config.efficiency.medium.toFixed(2)}, Hard=${config.efficiency.hard.toFixed(2)} info/cost`);
        
        return config;
    }

    calculateAUEC() {
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

            // Handle edge case: Failed games (no correct guess)
            const gameWon = this.actionSequence.some(action => action.type === 'correct_guess');
            if (!gameWon) {
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
                interpretation: this.generateAUECInterpretation(scoreA, scoreB, curve, area, gameWon)
            };
            
        } catch (error) {
            console.error('AUEC calculation failed:', error);
            return this.createFallbackAUEC(error.message);
        }
    }

    createFailedGameAUEC(auecConfig) {
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
            interpretation: {
                headline: "Game Not Completed - AUEC: 0%",
                explanation: "Since the puzzle was not solved correctly, no diagnostic efficiency can be measured. AUEC requires successful completion to evaluate your information-gathering strategy.",
                actionableAdvice: "Try again and focus on gathering key diagnostic clues before making your final guess.",
                tooltips: {
                    empirical: "Requires successful completion",
                    rectangular: "Requires successful completion"
                }
            }
        };
    }

    buildEfficiencyCurveFromSequence(auecConfig) {
        const curve = [{ x: 0, y: 0, action: 'start' }];
        let cumulativeCost = 0;
        let cumulativeInfo = 0;
        
        // Process actions in chronological order
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
                // Note: No info gain for wrong guesses - creates horizontal segment
                curve.push({
                    x: cumulativeCost,
                    y: cumulativeInfo,
                    action: 'wrong_guess'
                });
            } else if (action.type === 'correct_guess') {
                // Correct guess ends the curve - no additional cost or info
                curve.push({
                    x: cumulativeCost,
                    y: cumulativeInfo,
                    action: 'correct_guess'
                });
            }
        });
        
        return curve;
    }

    calculateTrueAUEC(curve) {
        let area = 0;
        
        for (let i = 1; i < curve.length; i++) {
            const prevPoint = curve[i-1];
            const currPoint = curve[i];
            
            // Only add area for VERTICAL segments (information gains)
            // Horizontal segments (wrong guesses) add no area
            if (currPoint.y > prevPoint.y) {
                // Vertical segment: use rectangle (not trapezoid)
                // Area = width * height = cost_increment * previous_info
                area += (currPoint.x - prevPoint.x) * prevPoint.y;
                
                // Add triangle for the information gain
                // Area = 0.5 * width * height_increment
                area += 0.5 * (currPoint.x - prevPoint.x) * (currPoint.y - prevPoint.y);
            }
            // Horizontal segments (currPoint.y === prevPoint.y) contribute 0 area
        }
        
        return area;
    }

    calculateEmpiricalScore(curve, auecConfig) {
        try {
            const userArea = this.calculateTrueAUEC(curve);
            console.log(`User curve: ${curve.length} points, final cost: ${curve[curve.length-1].x}, final info: ${curve[curve.length-1].y}, area: ${userArea.toFixed(2)}`);
            
            // Simple, intuitive scoring based on efficiency
            const finalCost = curve[curve.length - 1].x;
            const finalInfo = curve[curve.length - 1].y;
            
            if (finalInfo === 0) return 0; // No info = 0%
            
            // Calculate efficiency as info gained per unit cost
            const overallEfficiency = finalInfo / finalCost;
            
            // Theoretical maximum efficiency: all hard tiles (3 info / 1 cost = 3.0)
            const maxPossibleEfficiency = auecConfig.efficiency.hard;
            
            // Score as percentage of maximum possible efficiency
            const efficiencyScore = (overallEfficiency / maxPossibleEfficiency);
            
            // Pure efficiency score - no arbitrary bonuses
            const finalScore = efficiencyScore; // Already in 0-1 range
            
            console.log(`AUEC Score: ${overallEfficiency.toFixed(2)} ÷ ${maxPossibleEfficiency.toFixed(1)} = ${(finalScore * 100).toFixed(1)}% of perfect strategy`);
                
            return Math.max(0, Math.min(1, finalScore));
            
        } catch (error) {
            console.warn('Empirical calculation failed:', error);
            return 0.5; // Safe fallback
        }
    }
    
    calculateIdealArea(targetInfo, auecConfig) {
        // Ideal: get all info using only hard tiles in minimum moves
        const hardInfo = auecConfig.infoWeights.hard;
        const hardCost = auecConfig.costWeights.hard;
        const hardEfficiency = auecConfig.efficiency.hard;
        
        const tilesNeeded = Math.ceil(targetInfo / hardInfo);
        let area = 0;
        let cumulativeCost = 0;
        let cumulativeInfo = 0;
        
        for (let i = 0; i < tilesNeeded; i++) {
            const prevCost = cumulativeCost;
            const prevInfo = cumulativeInfo;
            
            cumulativeCost += hardCost;
            cumulativeInfo = Math.min(targetInfo, cumulativeInfo + hardInfo);
            
            // Rectangle area for this step
            area += (cumulativeCost - prevCost) * prevInfo;
            // Triangle area for info gain
            area += 0.5 * (cumulativeCost - prevCost) * (cumulativeInfo - prevInfo);
        }
        
        return area;
    }
    
    calculateWorstArea(targetInfo, auecConfig) {
        // Worst: get all info using only easy tiles
        const easyInfo = auecConfig.infoWeights.easy;
        const easyCost = auecConfig.costWeights.easy;
        
        const tilesNeeded = Math.ceil(targetInfo / easyInfo);
        let area = 0;
        let cumulativeCost = 0;
        let cumulativeInfo = 0;
        
        for (let i = 0; i < tilesNeeded; i++) {
            const prevCost = cumulativeCost;
            const prevInfo = cumulativeInfo;
            
            cumulativeCost += easyCost;
            cumulativeInfo = Math.min(targetInfo, cumulativeInfo + easyInfo);
            
            // Rectangle area for this step
            area += (cumulativeCost - prevCost) * prevInfo;
            // Triangle area for info gain
            area += 0.5 * (cumulativeCost - prevCost) * (cumulativeInfo - prevInfo);
        }
        
        return area;
    }

    computeAUECBounds(auecConfig, sampleSize = 100) {
        try {
            // Generate comprehensive sample of legal winning paths
            const samplePaths = this.generateSampleLegalPaths(auecConfig, sampleSize);
            const pathAreas = samplePaths.map(path => this.calculatePathAUEC(path, auecConfig));
            
            if (pathAreas.length === 0) {
                // Fallback bounds if path generation fails
                return { A_min: 0, A_max: 100 };
            }
            
            const A_min = Math.min(...pathAreas);
            const A_max = Math.max(...pathAreas);
            
            console.log(`AUEC bounds computed from ${pathAreas.length} paths:
                A_min=${A_min.toFixed(2)}, A_max=${A_max.toFixed(2)}
                Range: ${(A_max - A_min).toFixed(2)}
                Sample areas: [${pathAreas.slice(0, 5).map(a => a.toFixed(1)).join(', ')}...]`);
            
            return { A_min, A_max };
            
        } catch (error) {
            console.warn('AUEC bounds computation failed:', error);
            return { A_min: 0, A_max: 100 }; // Safe fallback
        }
    }

    generateSampleLegalPaths(auecConfig, sampleSize = 50) {
        const paths = [];
        const maxPaths = Math.min(sampleSize, 100); // Cap for performance
        
        // Generate strategic extreme paths first
        paths.push(...this.generateExtremePaths(auecConfig));
        
        // Fill remaining with random paths
        const remaining = maxPaths - paths.length;
        for (let i = 0; i < remaining; i++) {
            const path = this.generateRandomLegalPath(auecConfig);
            if (path.length > 0) {
                paths.push(path);
            }
        }
        
        return paths;
    }
    
    generateExtremePaths(auecConfig) {
        const extremePaths = [];
        
        // TRUE WORST: Just guess immediately (0 cost, 0 info - but this would be area 0)
        // Actually, let's do: 1 easy tile + 2 wrong guesses (terrible efficiency)
        const absoluteWorst = [
            { type: 'tile_flip', tileIndex: 0, difficulty: 'easy', timestamp: Date.now() },
            { type: 'wrong_guess', timestamp: Date.now() + 1 },
            { type: 'wrong_guess', timestamp: Date.now() + 2 },
            { type: 'correct_guess', timestamp: Date.now() + 3 }
        ];
        extremePaths.push(absoluteWorst);
        
        // VERY WORST: All tiles + 2 wrong guesses (maximum cost)
        const allTilesWorst = [];
        for (let i = 0; i < 9; i++) {
            allTilesWorst.push({
                type: 'tile_flip',
                tileIndex: i,
                difficulty: this.getTileDifficulty(i),
                timestamp: Date.now() + i
            });
        }
        allTilesWorst.push({ type: 'wrong_guess', timestamp: Date.now() + 9 });
        allTilesWorst.push({ type: 'wrong_guess', timestamp: Date.now() + 10 });
        allTilesWorst.push({ type: 'correct_guess', timestamp: Date.now() + 11 });
        extremePaths.push(allTilesWorst);
        
        // ABSOLUTE BEST: Just 1 hard tile (minimal cost, maximum efficiency)
        const absoluteBest = [
            { type: 'tile_flip', tileIndex: 5, difficulty: 'hard', timestamp: Date.now() },
            { type: 'correct_guess', timestamp: Date.now() + 1 }
        ];
        extremePaths.push(absoluteBest);
        
        // GOOD: 2 hard tiles
        const goodPath = [
            { type: 'tile_flip', tileIndex: 5, difficulty: 'hard', timestamp: Date.now() },
            { type: 'tile_flip', tileIndex: 6, difficulty: 'hard', timestamp: Date.now() + 1 },
            { type: 'correct_guess', timestamp: Date.now() + 2 }
        ];
        extremePaths.push(goodPath);
        
        // MEDIUM: Only medium tiles
        const mediumPath = [
            { type: 'tile_flip', tileIndex: 2, difficulty: 'medium', timestamp: Date.now() },
            { type: 'tile_flip', tileIndex: 3, difficulty: 'medium', timestamp: Date.now() + 1 },
            { type: 'correct_guess', timestamp: Date.now() + 2 }
        ];
        extremePaths.push(mediumPath);
        
        // BAD: Only easy tiles  
        const easyPath = [
            { type: 'tile_flip', tileIndex: 0, difficulty: 'easy', timestamp: Date.now() },
            { type: 'tile_flip', tileIndex: 1, difficulty: 'easy', timestamp: Date.now() + 1 },
            { type: 'correct_guess', timestamp: Date.now() + 2 }
        ];
        extremePaths.push(easyPath);
        
        // Debug: Calculate and log areas for extreme paths
        extremePaths.forEach((path, i) => {
            const curve = this.buildEfficiencyCurveFromPath(path, auecConfig);
            const area = this.calculateTrueAUEC(curve);
            const tiles = path.filter(a => a.type === 'tile_flip').length;
            const wrongs = path.filter(a => a.type === 'wrong_guess').length;
            console.log(`Extreme path ${i}: ${tiles} tiles, ${wrongs} wrongs → area ${area.toFixed(2)}`);
        });
        
        console.log(`Generated ${extremePaths.length} extreme paths for bounds computation`);
        return extremePaths;
    }
    
    generateRandomLegalPath(auecConfig) {
        const path = [];
        const availableTiles = [...Array(9).keys()]; // [0,1,2,3,4,5,6,7,8]
        const flippedTiles = new Set();
        
        // Random number of tiles to flip (1-8)
        const numTilesToFlip = Math.floor(Math.random() * 8) + 1;
        
        // Randomly select and flip tiles
        for (let i = 0; i < numTilesToFlip && availableTiles.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableTiles.length);
            const tileIndex = availableTiles.splice(randomIndex, 1)[0];
            
            flippedTiles.add(tileIndex);
            
            path.push({
                type: 'tile_flip',
                tileIndex: tileIndex,
                difficulty: this.getTileDifficulty(tileIndex),
                timestamp: Date.now() + i
            });
        }
        
        // Random number of wrong guesses (0-2)
        const numWrongGuesses = Math.floor(Math.random() * 3);
        for (let i = 0; i < numWrongGuesses; i++) {
            path.push({
                type: 'wrong_guess',
                timestamp: Date.now() + numTilesToFlip + i
            });
        }
        
        // Always end with correct guess
        path.push({
            type: 'correct_guess',
            timestamp: Date.now() + numTilesToFlip + numWrongGuesses
        });
        
        return path;
    }
    
    calculatePathAUEC(path, auecConfig) {
        const curve = this.buildEfficiencyCurveFromPath(path, auecConfig);
        const area = this.calculateTrueAUEC(curve);
        
        // Debug log for first few paths
        if (Math.random() < 0.1) { // Log ~10% of paths
            const tiles = path.filter(a => a.type === 'tile_flip').length;
            const wrongs = path.filter(a => a.type === 'wrong_guess').length;
            console.log(`Path debug: ${tiles} tiles, ${wrongs} wrongs → area ${area.toFixed(2)}`);
        }
        
        return area;
    }
    
    buildEfficiencyCurveFromPath(path, auecConfig) {
        const curve = [{ x: 0, y: 0, action: 'start' }];
        let cumulativeCost = 0;
        let cumulativeInfo = 0;
        
        for (const action of path) {
            if (action.type === 'tile_flip') {
                const cost = auecConfig.costWeights[action.difficulty] || 1;
                const info = auecConfig.infoWeights[action.difficulty] || 1;
                
                cumulativeCost += cost;
                cumulativeInfo += info;
                
                curve.push({
                    x: cumulativeCost,
                    y: cumulativeInfo,
                    action: `flip_${action.tileIndex}`,
                    difficulty: action.difficulty
                });
            } else if (action.type === 'wrong_guess') {
                const guessCost = auecConfig.costWeights.wrong || 5; // Use config wrong guess penalty
                cumulativeCost += guessCost;
                // No info gain from wrong guesses
                
                curve.push({
                    x: cumulativeCost,
                    y: cumulativeInfo,
                    action: 'wrong_guess'
                });
            }
            // Correct guess ends the path but doesn't add to curve
        }
        
        return curve;
    }
    
    getTileDifficulty(tileIndex) {
        // Based on the 3x3 grid layout: [0,1] = easy, [2,3,4] = medium, [5,6,7,8] = hard
        if (tileIndex <= 1) return 'easy';
        if (tileIndex <= 4) return 'medium';
        return 'hard';
    }

    calculateRectangularScore(area, curve) {
        // Simple area-based score for now (avoids circular dependency)
        const finalCost = curve[curve.length - 1].x;
        const finalInfo = curve[curve.length - 1].y;
        
        if (finalInfo === 0 || finalCost === 0) return 0;
        
        // Normalize area by a reasonable baseline
        const efficiency = finalInfo / finalCost;
        const maxEfficiency = 3.0; // Hard tile efficiency
        
        return Math.min(1.0, efficiency / maxEfficiency);
    }

    createFallbackAUEC(errorMessage) {
        const fallbackCurve = [
            { x: 0, y: 0, action: 'start' },
            { x: 1, y: 1, action: 'fallback' }
        ];
        
        return {
            curve: fallbackCurve,
            scoreA: 0,
            scoreB: 0,
            config: { costWeights: {}, infoWeights: {} },
            userSequence: [],
            interpretation: {
                headline: "AUEC Analysis Unavailable",
                explanation: `Unable to calculate AUEC: ${errorMessage}. This may be due to data loading issues.`,
                actionableAdvice: "Try refreshing the page and completing another puzzle.",
                tooltips: {
                    empirical: "Analysis unavailable",
                    rectangular: "Analysis unavailable"
                }
            }
        };
    }

    generateAUECInterpretation(empirical, rectangular, curve, area, gameWon) {
        if (!gameWon) {
            // This should be handled by createFailedGameAUEC, but just in case
            return {
                headline: "Game Not Completed - AUEC: 0%",
                explanation: "Diagnostic efficiency can only be measured for successfully completed puzzles.",
                actionableAdvice: "Try again and focus on gathering key diagnostic clues.",
                tooltips: {
                    empirical: "Requires successful completion",
                    rectangular: "Requires successful completion"
                }
            };
        }

        const finalCost = curve[curve.length - 1].x;
        const finalInfo = curve[curve.length - 1].y;
        
        // Handle edge case: no information gathered
        if (finalInfo === 0) {
            return {
                headline: "Lucky strike! No info gathered but nailed it first try.",
                explanation: "You went with pure intuition and got it right immediately. That's impressive pattern recognition, but be careful not to over-rely on luck in future puzzles.",
                category: "Lucky",
                actionableAdvice: "Try gathering at least 1-2 key clues to build confidence in your diagnoses."
            };
        }

        // Convert to percentages
        const empPercent = Math.round(empirical * 100);
        const rectPercent = Math.round(rectangular * 100);

        // Determine efficiency categories
        const getCategory = (score) => {
            if (score >= 80) return { label: "Excellent", desc: "Top-tier efficiency" };
            if (score >= 60) return { label: "Strong", desc: "Efficient" };
            if (score >= 30) return { label: "Moderate", desc: "Room to improve" };
            return { label: "Low", desc: "Needs refinement" };
        };

        const empCategory = getCategory(empPercent);
        const rectCategory = getCategory(rectPercent);

        // Generate headline
        const headline = `Efficiency: ${empPercent}% (Empirical), ${rectPercent}% (Rectangular) — ${empCategory.label}`;

        // Compare the two scores
        let comparison = "";
        const scoreDiff = Math.abs(empPercent - rectPercent);
        
        if (scoreDiff <= 15) {
            comparison = "Balanced performance—solid sequencing and resource use.";
        } else if (rectangular < empirical - 15) {
            comparison = "You did okay overall, but reordering your actions could boost efficiency.";
        } else if (rectangular > empirical + 15) {
            comparison = "Great sequencing with the tiles you used; even fewer tiles or guesses might push you higher versus all paths.";
        }

        // Generate explanation  
        let explanation = `Your AUEC score (${empPercent}%) measures diagnostic efficiency: how much information you gained per unit cost. `;
        explanation += `100% = perfect efficiency (only hard tiles), 0% = very inefficient play. `;
        explanation += `Hard tiles give 3x more info per cost than easy tiles, so they're the key to high scores. `;
        explanation += comparison;

        // Count wrong guesses from action sequence
        const wrongGuesses = this.actionSequence.filter(a => a.type === 'wrong_guess').length;
        const tilesFlipped = this.actionSequence.filter(a => a.type === 'tile_flip').length;

        // Generate actionable advice
        let actionableAdvice = "";
        
        if (wrongGuesses >= 2) {
            actionableAdvice = "Wrong guesses kill efficiency! Gather more evidence before committing to a diagnosis.";
        } else if (empPercent < 30) {
            actionableAdvice = "Focus on hard tiles first—they give 3x more info per cost (3.0 vs 1.0 for easy tiles).";
        } else if (empPercent >= 80) {
            actionableAdvice = "Excellent efficiency! You're mastering the art of strategic tile selection.";
        } else if (empPercent >= 50) {
            actionableAdvice = "Good strategy! Try using more hard tiles and fewer easy tiles to boost efficiency.";
        } else {
            actionableAdvice = "Remember: Hard tiles = highest efficiency, Easy tiles = lowest efficiency. Choose wisely!";
        }

        return {
            headline,
            explanation,
            category: empCategory.label,
            actionableAdvice,
            tooltips: {
                empirical: "Diagnostic efficiency score: 100% = perfect (only hard tiles), 0% = very inefficient. Hard tiles: 3.0 info/cost, Medium: 1.0, Easy: 0.33",
                rectangular: "Area under your efficiency curve compared to theoretical optimal path"
            }
        };
    }



    showPerformanceAssessment(assessment) {
        // Calculate AUEC before showing assessment
        console.log('Starting AUEC calculation...');
        let auecData;
        try {
            auecData = this.calculateAUEC();
            console.log('AUEC calculation successful:', auecData);
            
            // Ensure we have valid data
            if (!auecData.curve || auecData.curve.length === 0) {
                console.warn('Invalid AUEC curve, creating minimal data');
                auecData.curve = [
                    { x: 0, y: 0, action: 'start' },
                    { x: this.flippedTiles.size * 2, y: this.flippedTiles.size, action: 'end' }
                ];
            }
        } catch (error) {
            console.error('AUEC calculation failed:', error);
            // Fallback to simple data
            auecData = {
                scoreA: 0,
                scoreB: 0,
                curve: [{ x: 0, y: 0, action: 'start' }],
                config: { costWeights: {}, infoWeights: {} }
            };
        }
        
        // Generate the breakdown HTML separately to avoid context issues
        const calculationBreakdown = this.generateAUECCalculationBreakdown(auecData);
        
        const assessmentHTML = `
            <div class="performance-assessment">
                <h3>🩺 Diagnostic Performance Assessment</h3>
                
                <div class="assessment-score">
                    <div class="percentile-display">
                        <span class="percentile-number">${assessment.percentile}th</span>
                        <span class="percentile-label">Percentile</span>
                    </div>
                    <div class="assessment-subtitle">
                        You performed better than ${assessment.percentile}% of all possible approaches
                    </div>
                </div>
                
                <div class="assessment-metrics">
                    <div class="metric">
                        <span class="metric-label">Final Score:</span>
                        <span class="metric-value">${assessment.score}/100</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Diagnostic Speed:</span>
                        <span class="metric-value">${assessment.diagnosticSpeed.category}</span>
                        <span class="metric-reason">${assessment.diagnosticSpeed.reason}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Risk Profile:</span>
                        <span class="metric-value">${assessment.riskAssessment.category}</span>
                        <span class="metric-reason">${assessment.riskAssessment.reason}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Evidence Gathered:</span>
                        <span class="metric-value">${assessment.tilesFlipped}/9 tiles</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Attempts Used:</span>
                        <span class="metric-value">${assessment.attemptsUsed}/3</span>
                    </div>
                </div>
                
                <div class="path-analysis">
                    <h4>📋 Your Diagnostic Approach:</h4>
                    <ul>
                        ${assessment.pathAnalysis.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="assessment-footer">
                    <small>Analysis based on ${assessment.totalPossiblePaths.toLocaleString()} possible diagnostic pathways</small>
                </div>
            </div>
            
            <div class="auec-assessment">
                <h3>📈* Area Under the Efficiency Curve (AUEC) Analysis</h3>
                
                <div class="auec-headline">
                    <h4>${auecData.interpretation.headline}</h4>
                </div>
                
                <div class="auec-scores">
                    <div class="auec-metric">
                        <span class="auec-label" title="${auecData.interpretation.tooltips.empirical}">AUEC Score (Empirical):</span>
                        <span class="auec-value">${((auecData.scoreA || 0) * 100).toFixed(1)}%</span>
                        <span class="auec-description">Where you rank vs. all possible paths</span>
                    </div>
                    <div class="auec-metric">
                        <span class="auec-label" title="${auecData.interpretation.tooltips.rectangular}">AUEC Score (Rectangular):</span>
                        <span class="auec-value">${((auecData.scoreB || 0) * 100).toFixed(1)}%</span>
                        <span class="auec-description">Efficiency of your actual curve shape</span>
                    </div>
                </div>
                
                <div class="auec-plot" id="auecPlot">
                    <p style="color: #ccc; text-align: center; padding: 20px; margin: 0;">
                        Loading efficiency curve...
                    </p>
                </div>
                
                <div class="auec-interpretation">
                    <div class="auec-explanation">
                        <p>${auecData.interpretation.explanation}</p>
                    </div>
                    
                    ${calculationBreakdown}
                    
                    <div class="auec-advice">
                        <p><strong>💡 Next time:</strong> ${auecData.interpretation.actionableAdvice}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Insert assessment after game message, before explanations will be added
        const gameMessage = document.getElementById('gameMessage');
        const assessmentDiv = document.createElement('div');
        assessmentDiv.innerHTML = assessmentHTML;
        gameMessage.parentNode.insertBefore(assessmentDiv, gameMessage.nextSibling);
        
        // Render the AUEC plot after DOM insertion
        setTimeout(() => {
            try {
                this.renderFullAUECPlot(auecData);
            } catch (error) {
                console.error('AUEC plot rendering failed:', error);
                // Show fallback message
                const plotContainer = document.getElementById('auecPlot');
                if (plotContainer) {
                    plotContainer.innerHTML = '<p style="color: #f44336; text-align: center; padding: 20px;">Graph rendering failed. Check console for details.</p>';
                }
            }
        }, 500); // Increased delay
    }

    showAUECOnly(auecData) {
        
        // Ensure we have valid interpretation data
        if (!auecData.interpretation) {
            console.error('Missing interpretation data, creating fallback');
            auecData.interpretation = {
                headline: "AUEC Analysis Available",
                explanation: "Analysis of your efficiency curve is available.",
                actionableAdvice: "Continue playing to improve your diagnostic skills.",
                tooltips: {
                    empirical: "Ranking vs all possible paths",
                    rectangular: "Efficiency of your curve shape"
                }
            };
        }
        
        // Generate the breakdown HTML separately to avoid context issues
        const calculationBreakdown = this.generateAUECCalculationBreakdown(auecData);
        
        const auecHTML = `
            <div class="auec-assessment">
                <h3>📈* Area Under the Efficiency Curve (AUEC) Analysis</h3>
                
                <div class="auec-headline">
                    <h4>${auecData.interpretation.headline}</h4>
                </div>
                
                <div class="auec-scores">
                    <div class="auec-metric">
                        <span class="auec-label" title="${auecData.interpretation.tooltips.empirical}">AUEC Score (Empirical):</span>
                        <span class="auec-value">${((auecData.scoreA || 0) * 100).toFixed(1)}%</span>
                        <span class="auec-description">Where you rank vs. all possible paths</span>
                    </div>
                    <div class="auec-metric">
                        <span class="auec-label" title="${auecData.interpretation.tooltips.rectangular}">AUEC Score (Rectangular):</span>
                        <span class="auec-value">${((auecData.scoreB || 0) * 100).toFixed(1)}%</span>
                        <span class="auec-description">Efficiency of your actual curve shape</span>
                    </div>
                </div>
                
                <div class="auec-plot" id="auecPlot">
                    <p style="color: #ccc; text-align: center; padding: 20px; margin: 0;">
                        Loading efficiency curve...
                    </p>
                </div>
                
                <div class="auec-interpretation">
                    <div class="auec-explanation">
                        <p>${auecData.interpretation.explanation}</p>
                    </div>
                    
                    ${calculationBreakdown}
                    
                    <div class="auec-advice">
                        <p><strong>💡 Next time:</strong> ${auecData.interpretation.actionableAdvice}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Insert AUEC section after game message
        const gameMessage = document.getElementById('gameMessage');
        if (!gameMessage) {
            console.error('gameMessage element not found!');
            return;
        }
        
        const auecDiv = document.createElement('div');
        auecDiv.innerHTML = auecHTML;
        gameMessage.parentNode.insertBefore(auecDiv, gameMessage.nextSibling);
        
        // Render the AUEC plot after DOM insertion
        setTimeout(() => {
            try {
                this.renderFullAUECPlot(auecData);
            } catch (error) {
                console.error('AUEC plot rendering failed (lost game):', error);
                const plotContainer = document.getElementById('auecPlot');
                if (plotContainer) {
                    plotContainer.innerHTML = '<p style="color: #f44336; text-align: center; padding: 20px;">Graph rendering failed. Check console for details.</p>';
                }
            }
        }, 500); // Increased delay
    }

    renderFullAUECPlot(auecData) {
        const plotContainer = document.getElementById('auecPlot');
        if (!plotContainer) {
            console.error('auecPlot container not found');
            return;
        }
        
        const curve = auecData.curve;
        if (!curve || curve.length === 0) {
            plotContainer.innerHTML = '<p style="color: #ccc; text-align: center; padding: 40px; margin: 0;">No efficiency data available for this game.</p>';
            return;
        }
        
        
        // Set up SVG dimensions
        const margin = { top: 30, right: 30, bottom: 120, left: 70 };
        const width = 500 - margin.left - margin.right;
        const height = 350 - margin.top - margin.bottom;
        
        // Find data bounds and extend to maximum possible values
        const dataMaxX = Math.max(...curve.map(p => p.x), 1);
        const dataMaxY = Math.max(...curve.map(p => p.y), 1);
        
        // Calculate theoretical maximum values
        const config = auecData.config || this.getAUECConfig();
        const maxPossibleCost = 9 * 3 + 2 * 5; // All tiles + 2 wrong guesses = 37
        const maxPossibleInfo = 9 * 3; // All hard tiles = 27
        
        // Extend axes to show full range, but ensure data is visible
        const maxX = Math.max(dataMaxX + 2, Math.min(maxPossibleCost, dataMaxX * 2));
        const maxY = Math.max(dataMaxY + 1, Math.min(maxPossibleInfo, dataMaxY * 2));
        
        // Create scales
        const xScale = (x) => (x / maxX) * width;
        const yScale = (y) => height - (y / maxY) * height;
        
        // Generate tick marks
        const xTicks = this.generateTicks(0, maxX, 5);
        const yTicks = this.generateTicks(0, maxY, 5);
        
        // Create SVG
        const svg = `
            <svg width="${width + margin.left + margin.right}" 
                 height="${height + margin.top + margin.bottom}" 
                 style="background: rgba(10, 14, 22, 0.9); border-radius: 8px; border: 1px solid #333;">
                
                <g transform="translate(${margin.left}, ${margin.top})">
                    <!-- Grid lines -->
                    ${this.generateGridLines(width, height, xTicks, yTicks, xScale, yScale)}
                    
                    <!-- Axes -->
                    <line x1="0" y1="${height}" x2="${width}" y2="${height}" 
                          stroke="#fff" stroke-width="2"/>
                    <line x1="0" y1="0" x2="0" y2="${height}" 
                          stroke="#fff" stroke-width="2"/>
                    
                    <!-- Axis tick marks and labels -->
                    ${this.generateAxisLabels(xTicks, yTicks, width, height, xScale, yScale)}
                    
                    <!-- Efficiency curve (staircase) with area -->
                    ${this.generateStaircasePath(curve, xScale, yScale)}
                    
                    <!-- Data points -->
                    ${this.generateDataPoints(curve, xScale, yScale)}
                    
                    <!-- Axis titles -->
                    <text x="${width/2}" y="${height + 50}" 
                          text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">
                        Cost
                    </text>
                    
                    <text x="-${height/2}" y="-50" 
                          text-anchor="middle" fill="#fff" font-size="14" font-weight="bold"
                          transform="rotate(-90, -${height/2}, -50)">
                        Information
                    </text>
                    
                    <!-- Title -->
                    <text x="${width/2}" y="-10" 
                          text-anchor="middle" fill="#fff" font-size="16" font-weight="bold">
                        Efficiency Curve
                    </text>
                </g>
                
                <!-- Legend below the graph -->
                ${this.generateLegend(margin.left, height + margin.top + 70, width)}
            </svg>
        `;
        
        plotContainer.innerHTML = svg;
    }


    generateTicks(min, max, count) {
        const step = Math.max(1, Math.ceil((max - min) / (count - 1)));
        const ticks = [];
        for (let i = min; i <= max; i += step) {
            ticks.push(Math.round(i)); // Ensure integer values only
        }
        // Always include max if it's not already there
        if (ticks[ticks.length - 1] !== Math.round(max)) {
            ticks.push(Math.round(max));
        }
        return ticks;
    }

    generateGridLines(width, height, xTicks, yTicks, xScale, yScale) {
        let gridLines = '';
        
        // Vertical grid lines
        xTicks.forEach(tick => {
            const x = xScale(tick);
            gridLines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" 
                         stroke="#444" stroke-width="1" opacity="0.5"/>`;
        });
        
        // Horizontal grid lines
        yTicks.forEach(tick => {
            const y = yScale(tick);
            gridLines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" 
                         stroke="#444" stroke-width="1" opacity="0.5"/>`;
        });
        
        return gridLines;
    }

    generateAxisLabels(xTicks, yTicks, width, height, xScale, yScale) {
        let labels = '';
        
        // X-axis labels
        xTicks.forEach(tick => {
            const x = xScale(tick);
            labels += `
                <line x1="${x}" y1="${height}" x2="${x}" y2="${height + 5}" 
                      stroke="#fff" stroke-width="1"/>
                <text x="${x}" y="${height + 18}" 
                      text-anchor="middle" fill="#fff" font-size="11">
                    ${tick}
                </text>
            `;
        });
        
        // Y-axis labels
        yTicks.forEach(tick => {
            const y = yScale(tick);
            labels += `
                <line x1="0" y1="${y}" x2="-5" y2="${y}" 
                      stroke="#fff" stroke-width="1"/>
                <text x="-10" y="${y + 4}" 
                      text-anchor="end" fill="#fff" font-size="11">
                    ${tick}
                </text>
            `;
        });
        
        return labels;
    }

    generateStaircasePath(curve, xScale, yScale) {
        if (curve.length < 2) return '';
        
        // Add area under curve first (so it's behind the line)
        let areaPath = `<path d="M${xScale(curve[0].x)},${yScale(0)}`;
        areaPath += ` L${xScale(curve[0].x)},${yScale(curve[0].y)}`;
        
        for (let i = 1; i < curve.length; i++) {
            const prevPoint = curve[i-1];
            const currPoint = curve[i];
            areaPath += ` L${xScale(currPoint.x)},${yScale(prevPoint.y)}`;
            areaPath += ` L${xScale(currPoint.x)},${yScale(currPoint.y)}`;
        }
        
        const lastPoint = curve[curve.length - 1];
        areaPath += ` L${xScale(lastPoint.x)},${yScale(0)} Z"`;
        areaPath += ` fill="rgba(76, 175, 80, 0.15)" stroke="none"/>`;
        
        // Add the main efficiency curve line
        let path = `<path d="M${xScale(curve[0].x)},${yScale(curve[0].y)}`;
        
        for (let i = 1; i < curve.length; i++) {
            const prevPoint = curve[i-1];
            const currPoint = curve[i];
            
            // Create staircase effect: horizontal then vertical
            path += ` L${xScale(currPoint.x)},${yScale(prevPoint.y)}`;
            path += ` L${xScale(currPoint.x)},${yScale(currPoint.y)}`;
        }
        
        path += `" stroke="#4caf50" stroke-width="3" fill="none"/>`;
        
        return areaPath + path;
    }

    generateDataPoints(curve, xScale, yScale) {
        let points = '';
        
        curve.forEach((point, index) => {
            let color = '#ffeb3b';
            let label = '';
            let textColor = '#000';
            
            // Color code by action type
            if (point.action === 'start') {
                color = '#4caf50';
                label = 'Start';
                textColor = '#fff';
            } else if (point.action.includes('easy')) {
                color = '#fff59d';
                label = 'E';
                textColor = '#000';
            } else if (point.action.includes('medium')) {
                color = '#ffeb3b';
                label = 'M';
                textColor = '#000';
            } else if (point.action.includes('hard')) {
                color = '#ffc107';
                label = 'H';
                textColor = '#000';
            } else if (point.action === 'wrong_guess') {
                color = '#f44336';
                label = 'WG';
                textColor = '#fff';
            } else if (point.action === 'correct_guess') {
                color = '#4caf50';
                label = 'CG';
                textColor = '#fff';
            }
            
            const x = xScale(point.x);
            const y = yScale(point.y);
            
            points += `
                <circle cx="${x}" cy="${y}" r="7" fill="${color}" stroke="#fff" stroke-width="2"/>
                <text x="${x}" y="${y + 1}" text-anchor="middle" fill="${textColor}" 
                      font-size="9" font-weight="bold">${label}</text>
            `;
        });
        
        return points;
    }

    generateLegend(x, y, width) {
        const itemWidth = Math.floor(width / 5); // Distribute items across width
        
        return `
            <g transform="translate(${x}, ${y})">
                <text x="${width/2}" y="-10" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">Legend</text>
                
                <!-- Easy -->
                <g transform="translate(${itemWidth * 0}, 0)">
                    <circle cx="10" cy="5" r="6" fill="#fff59d" stroke="#fff" stroke-width="1"/>
                    <text x="10" y="8" text-anchor="middle" fill="#000" font-size="8" font-weight="bold">E</text>
                    <text x="10" y="20" text-anchor="middle" fill="#fff" font-size="10">Easy</text>
                </g>
                
                <!-- Medium -->
                <g transform="translate(${itemWidth * 1}, 0)">
                    <circle cx="10" cy="5" r="6" fill="#ffeb3b" stroke="#fff" stroke-width="1"/>
                    <text x="10" y="8" text-anchor="middle" fill="#000" font-size="8" font-weight="bold">M</text>
                    <text x="10" y="20" text-anchor="middle" fill="#fff" font-size="10">Medium</text>
                </g>
                
                <!-- Hard -->
                <g transform="translate(${itemWidth * 2}, 0)">
                    <circle cx="10" cy="5" r="6" fill="#ffc107" stroke="#fff" stroke-width="1"/>
                    <text x="10" y="8" text-anchor="middle" fill="#000" font-size="8" font-weight="bold">H</text>
                    <text x="10" y="20" text-anchor="middle" fill="#fff" font-size="10">Hard</text>
                </g>
                
                <!-- Wrong Guess -->
                <g transform="translate(${itemWidth * 3}, 0)">
                    <circle cx="10" cy="5" r="6" fill="#f44336" stroke="#fff" stroke-width="1"/>
                    <text x="10" y="8" text-anchor="middle" fill="#fff" font-size="7" font-weight="bold">WG</text>
                    <text x="10" y="20" text-anchor="middle" fill="#fff" font-size="10">Wrong</text>
                </g>
                
                <!-- Correct Guess -->
                <g transform="translate(${itemWidth * 4}, 0)">
                    <circle cx="10" cy="5" r="6" fill="#4caf50" stroke="#fff" stroke-width="1"/>
                    <text x="10" y="8" text-anchor="middle" fill="#fff" font-size="7" font-weight="bold">CG</text>
                    <text x="10" y="20" text-anchor="middle" fill="#fff" font-size="10">Correct</text>
                </g>
            </g>
        `;
    }

    addGameEndFlourish(won) {
        const container = document.querySelector('.container');
        const title = document.querySelector('h1');
        const gameMessage = document.getElementById('gameMessage');
        
        if (won) {
            // Celebration animations
            container.classList.add('game-celebration');
            title.classList.add('title-celebration');
            gameMessage.classList.add('message-success-big');
            
            // Add confetti
            this.createConfetti();
            
            // Remove celebration classes after animation
            setTimeout(() => {
                container.classList.remove('game-celebration');
            }, 1000);
        } else {
            // Sadness animations
            container.classList.add('game-sadness');
            title.classList.add('title-sadness');
            gameMessage.classList.add('message-error-big');
            
            // Remove sadness classes after animation
            setTimeout(() => {
                container.classList.remove('game-sadness');
            }, 1500);
        }
    }

    createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);
        
        // Create 50 confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confettiContainer.appendChild(confetti);
        }
        
        // Remove confetti after 5 seconds
        setTimeout(() => {
            document.body.removeChild(confettiContainer);
        }, 5000);
    }

    showExplanations() {
        const explanationsSection = document.createElement('div');
        explanationsSection.className = 'explanations-section';
        explanationsSection.innerHTML = `
            <h3>How Each Clue Relates to ${this.gameData.answer}</h3>
            <div class="explanations-grid" id="explanationsGrid"></div>
        `;
        
        const gameMessage = document.getElementById('gameMessage');
        gameMessage.parentNode.insertBefore(explanationsSection, gameMessage.nextSibling);
        
        const explanationsGrid = document.getElementById('explanationsGrid');
        
        this.gameData.tiles.forEach((tile, index) => {
            const explanationItem = document.createElement('div');
            explanationItem.className = `explanation-item difficulty-${tile.difficulty}`;
            
            const explanation = this.gameData.explanations ? 
                this.gameData.explanations[`tile_${index}`] : 
                `This ${tile.difficulty} clue "${tile.clue}" helps confirm the diagnosis.`;
            
            explanationItem.innerHTML = `
                <div class="explanation-header">
                    <div class="explanation-tile-preview difficulty-${tile.difficulty}">
                        <div class="tile-content">${tile.clue}</div>
                    </div>
                    <div class="explanation-content">
                        <div class="explanation-label">${tile.difficulty.charAt(0).toUpperCase() + tile.difficulty.slice(1)} Clue</div>
                        <div class="explanation-text">${explanation}</div>
                    </div>
                </div>
            `;
            
            explanationsGrid.appendChild(explanationItem);
        });
    }

    showMessage(text, type = '') {
        const messageEl = document.getElementById('gameMessage');
        messageEl.textContent = text;
        messageEl.className = `game-message ${type}`;
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('attempts').textContent = this.attempts;
    }

    updateLastModified() {
        // Try to get the last modified time from the server
        fetch('today.json', { method: 'HEAD' })
            .then(response => {
                const lastModified = response.headers.get('Last-Modified');
                if (lastModified) {
                    const date = new Date(lastModified);
                    const formattedDate = date.toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit', 
                        year: 'numeric'
                    });
                    const formattedTime = date.toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                    document.getElementById('lastUpdated').textContent = 
                        `Last updated ${formattedDate} ${formattedTime}`;
                } else {
                    // Fallback to using the date from the JSON data
                    if (this.gameData && this.gameData.date) {
                        const gameDate = new Date(this.gameData.date + 'T00:00:00');
                        const formattedDate = gameDate.toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric'
                        });
                        document.getElementById('lastUpdated').textContent = 
                            `Puzzle date ${formattedDate}`;
                    }
                }
            })
            .catch(() => {
                // If fetch fails, use the date from the JSON data
                if (this.gameData && this.gameData.date) {
                    const gameDate = new Date(this.gameData.date + 'T00:00:00');
                    const formattedDate = gameDate.toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric'
                    });
                    document.getElementById('lastUpdated').textContent = 
                        `Puzzle date ${formattedDate}`;
                } else {
                    document.getElementById('lastUpdated').textContent = 
                        'Last updated: Unknown';
                }
            });
    }

    generateAUECCalculationBreakdown(auecData) {
        const curve = auecData.curve;
        const finalCost = curve[curve.length - 1].x;
        const finalInfo = curve[curve.length - 1].y;
        const userArea = this.calculateTrueAUEC(curve);
        
        // Analyze the user's path
        const tiles = this.actionSequence.filter(a => a.type === 'tile_flip');
        const wrongGuesses = this.actionSequence.filter(a => a.type === 'wrong_guess').length;
        
        // Calculate efficiency breakdown by tile type
        const tileBreakdown = {
            easy: { count: 0, totalCost: 0, totalInfo: 0 },
            medium: { count: 0, totalCost: 0, totalInfo: 0 },
            hard: { count: 0, totalCost: 0, totalInfo: 0 }
        };
        
        const config = this.getAUECConfig();
        
        tiles.forEach(tile => {
            const diff = tile.difficulty;
            tileBreakdown[diff].count++;
            tileBreakdown[diff].totalCost += config.costWeights[diff];
            tileBreakdown[diff].totalInfo += config.infoWeights[diff];
        });
        
        // Calculate efficiency metrics
        const overallEfficiency = finalInfo / finalCost;
        const perfectStrategy = config.efficiency.hard; // 3.0 (only hard tiles)
        const worstStrategy = config.efficiency.easy; // 0.33 (only easy tiles)
        
        // Your efficiency as percentage of perfect strategy
        const efficiencyScore = Math.min(100, (overallEfficiency / perfectStrategy * 100));
        
        // Calculate theoretical bounds for comparison
        const perfectArea = this.calculateIdealArea(finalInfo, config);
        const worstArea = this.calculateWorstArea(finalInfo, config);
        
        return `
            <div class="auec-calculation-breakdown">
                <h5 style="color: #4caf50; margin: 15px 0 10px 0; font-size: 16px;">🧮 How Your Score Was Calculated</h5>
                
                <div class="calculation-section">
                    <h6 style="color: #ffeb3b; margin: 10px 0 5px 0;">📊 Your Diagnostic Path Analysis</h6>
                    <div style="background: rgba(20, 24, 32, 0.6); padding: 12px; border-radius: 6px; margin: 8px 0;">
                        ${this.generatePathStoryBreakdown(tileBreakdown, wrongGuesses, finalCost, finalInfo)}
                    </div>
                </div>

                <div class="calculation-section">
                    <h6 style="color: #ffeb3b; margin: 10px 0 5px 0;">⚡ Diagnostic Efficiency Analysis</h6>
                    <div style="background: rgba(20, 24, 32, 0.6); padding: 12px; border-radius: 6px; margin: 8px 0;">
                        <p style="margin: 4px 0; color: #ccc; font-size: 13px;">
                            <strong>Your Efficiency:</strong> ${finalInfo} info ÷ ${finalCost} cost = <span style="color: #4caf50;">${overallEfficiency.toFixed(2)} info/cost</span>
                        </p>
                        <p style="margin: 4px 0; color: #ccc; font-size: 13px;">
                            <strong>Perfect Strategy:</strong> Only hard tiles = <span style="color: #4caf50;">${perfectStrategy.toFixed(1)} info/cost</span> (best possible)
                        </p>
                        <p style="margin: 4px 0; color: #ccc; font-size: 13px;">
                            <strong>Worst Strategy:</strong> Only easy tiles = <span style="color: #f44336;">${worstStrategy.toFixed(2)} info/cost</span> (avoid this!)
                        </p>
                        <p style="margin: 4px 0; color: #ccc; font-size: 13px;">
                            <strong>Your Score:</strong> ${overallEfficiency.toFixed(2)} ÷ ${perfectStrategy.toFixed(1)} = <span style="color: #4caf50;">${efficiencyScore.toFixed(0)}% of perfect</span>
                        </p>
                    </div>
                </div>

                <div class="calculation-section">
                    <h6 style="color: #ffeb3b; margin: 10px 0 5px 0;">🎯 Strategy Examples</h6>
                    <div style="background: rgba(20, 24, 32, 0.6); padding: 12px; border-radius: 6px; margin: 8px 0;">
                        ${this.generateStrategyExamples(finalInfo, config, userArea, perfectArea, worstArea)}
                    </div>
                </div>

                <div class="calculation-section">
                    <h6 style="color: #ffeb3b; margin: 10px 0 5px 0;">📈 Your Curve Analysis</h6>
                    <div style="background: rgba(20, 24, 32, 0.6); padding: 12px; border-radius: 6px; margin: 8px 0;">
                        ${this.generateCurveInterpretation(curve, userArea, perfectArea)}
                    </div>
                </div>

                <div class="calculation-section">
                    <h6 style="color: #ffeb3b; margin: 10px 0 5px 0;">🏆 Final Score</h6>
                    <div style="background: rgba(20, 24, 32, 0.6); padding: 12px; border-radius: 6px; margin: 8px 0;">
                        <p style="margin: 6px 0 0 0; color: #4caf50; font-size: 16px; font-weight: bold; text-align: center;">
                            <strong>AUEC Score: ${efficiencyScore.toFixed(0)}% of Perfect Strategy</strong>
                        </p>
                        <p style="margin: 4px 0; color: #ccc; font-size: 12px; text-align: center; font-style: italic;">
                            (Pure diagnostic efficiency - no arbitrary bonuses)
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    generatePathStoryBreakdown(tileBreakdown, wrongGuesses, finalCost, finalInfo) {
        let story = "";
        const config = this.getAUECConfig();
        
        // Build the story of what happened
        const steps = [];
        
        if (tileBreakdown.hard.count > 0) {
            steps.push(`<span style="color: #4caf50;">${tileBreakdown.hard.count} hard tile${tileBreakdown.hard.count > 1 ? 's' : ''}</span> (${tileBreakdown.hard.totalInfo} info, ${tileBreakdown.hard.totalCost} cost)`);
        }
        if (tileBreakdown.medium.count > 0) {
            steps.push(`<span style="color: #ffeb3b;">${tileBreakdown.medium.count} medium tile${tileBreakdown.medium.count > 1 ? 's' : ''}</span> (${tileBreakdown.medium.totalInfo} info, ${tileBreakdown.medium.totalCost} cost)`);
        }
        if (tileBreakdown.easy.count > 0) {
            steps.push(`<span style="color: #ff9800;">${tileBreakdown.easy.count} easy tile${tileBreakdown.easy.count > 1 ? 's' : ''}</span> (${tileBreakdown.easy.totalInfo} info, ${tileBreakdown.easy.totalCost} cost)`);
        }
        if (wrongGuesses > 0) {
            steps.push(`<span style="color: #f44336;">${wrongGuesses} wrong guess${wrongGuesses > 1 ? 'es' : ''}</span> (0 info, ${wrongGuesses * config.costWeights.wrong} cost)`);
        }
        
        story = `<p style="margin: 4px 0; color: #ccc; font-size: 13px;">You used: ${steps.join(' + ')}</p>`;
        story += `<p style="margin: 4px 0; color: #ccc; font-size: 13px;"><strong>Total:</strong> ${finalInfo} information gained for ${finalCost} cost</p>`;
        
        return story;
    }

    generateStrategyExamples(finalInfo, config, userArea, perfectArea, worstArea) {
        // Calculate what perfect and worst strategies would look like for this amount of info
        const hardTilesNeeded = Math.ceil(finalInfo / config.infoWeights.hard);
        const perfectCost = hardTilesNeeded * config.costWeights.hard;
        const perfectEfficiency = config.efficiency.hard;
        
        const easyTilesNeeded = Math.ceil(finalInfo / config.infoWeights.easy);
        const worstCost = easyTilesNeeded * config.costWeights.easy;
        const worstEfficiency = config.efficiency.easy;
        
        return `
            <p style="margin: 4px 0; color: #4caf50; font-size: 13px;">
                <strong>🥇 Perfect Strategy:</strong> Use ${hardTilesNeeded} hard tile${hardTilesNeeded > 1 ? 's' : ''} → ${finalInfo} info for ${perfectCost} cost → ${perfectEfficiency.toFixed(1)} efficiency → Area: ${perfectArea.toFixed(1)}
            </p>
            <p style="margin: 4px 0; color: #f44336; font-size: 13px;">
                <strong>🥉 Worst Strategy:</strong> Use ${easyTilesNeeded} easy tile${easyTilesNeeded > 1 ? 's' : ''} → ${finalInfo} info for ${worstCost} cost → ${worstEfficiency.toFixed(2)} efficiency → Area: ${worstArea.toFixed(1)}
            </p>
            <p style="margin: 4px 0; color: #ffeb3b; font-size: 13px;">
                <strong>📊 Your Strategy:</strong> Mixed approach → ${finalInfo} info → Efficiency between ${worstEfficiency.toFixed(2)} and ${perfectEfficiency.toFixed(1)} → Area: ${userArea.toFixed(1)}
            </p>
        `;
    }

    generateCurveInterpretation(curve, userArea, perfectArea) {
        let interpretation = "";
        
        // Analyze curve shape
        const hasWrongGuesses = curve.some((point, i) => 
            i > 0 && point.y === curve[i-1].y && point.x > curve[i-1].x
        );
        
        const frontLoaded = this.isCurveFrontLoaded(curve);
        
        if (hasWrongGuesses) {
            interpretation += `<p style="margin: 4px 0; color: #f44336; font-size: 13px;">⚠️ <strong>Horizontal segments:</strong> Wrong guesses that added cost but no information</p>`;
        }
        
        if (frontLoaded) {
            interpretation += `<p style="margin: 4px 0; color: #4caf50; font-size: 13px;">📈 <strong>Front-loaded curve:</strong> You gained information early, creating a larger area</p>`;
        } else {
            interpretation += `<p style="margin: 4px 0; color: #ff9800; font-size: 13px;">📊 <strong>Back-loaded curve:</strong> Most info came later, smaller area under curve</p>`;
        }
        
        const areaRatio = userArea / idealArea;
        if (areaRatio >= 0.8) {
            interpretation += `<p style="margin: 4px 0; color: #4caf50; font-size: 13px;">🎯 <strong>Excellent timing:</strong> Your curve area is ${(areaRatio * 100).toFixed(0)}% of theoretical optimal</p>`;
        } else if (areaRatio >= 0.5) {
            interpretation += `<p style="margin: 4px 0; color: #ffeb3b; font-size: 13px;">⭐ <strong>Good timing:</strong> Your curve area is ${(areaRatio * 100).toFixed(0)}% of theoretical optimal</p>`;
        } else {
            interpretation += `<p style="margin: 4px 0; color: #ff9800; font-size: 13px;">🎲 <strong>Late information:</strong> Your curve area is ${(areaRatio * 100).toFixed(0)}% of optimal - try getting key info earlier</p>`;
        }
        
        return interpretation;
    }

    isCurveFrontLoaded(curve) {
        if (curve.length < 3) return false;
        
        const finalInfo = curve[curve.length - 1].y;
        const finalCost = curve[curve.length - 1].x;
        
        // Check if we got >50% of final info in first 50% of final cost
        const halfwayCost = finalCost / 2;
        let infoAtHalfway = 0;
        
        for (let point of curve) {
            if (point.x <= halfwayCost) {
                infoAtHalfway = point.y;
            } else {
                break;
            }
        }
        
        return infoAtHalfway >= (finalInfo * 0.5);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DifferentialGame();
});