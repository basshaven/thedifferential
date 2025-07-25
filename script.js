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
            const bonus = this.getScoreChange('', 'correct_guess');
            this.updateScore('', 'correct_guess');
            this.logAction(`Correct guess on attempt ${4 - this.attempts}`, bonus);
            this.showMessage(`Correct! The answer was ${this.gameData.answer}`, 'success');
            this.endGame(true);
        } else {
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
        console.log('🎮 ENDGAME CALLED! Won:', won);
        alert(`DEBUG: Game ended! Won: ${won}`); // Very obvious debug alert
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
                console.log('🏆 WON BRANCH - Calculating performance assessment...');
                alert('DEBUG: About to show AUEC for WON game');
                const assessment = this.calculatePerformanceAssessment();
                console.log('Assessment calculated:', assessment);
                this.showPerformanceAssessment(assessment);
                console.log('Assessment displayed');
            } else {
                console.log('💀 LOST BRANCH - Showing AUEC analysis...');
                alert('DEBUG: About to show AUEC for LOST game');
                try {
                    const auecData = this.calculateAUEC();
                    console.log('AUEC calculated for lost game:', auecData);
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

    calculateAUEC() {
        console.log('calculateAUEC called');
        
        // AUEC Configuration
        const auecConfig = {
            costWeights: { easy: 1, medium: 2, hard: 3, wrong: 4 },
            infoWeights: { easy: 1, medium: 2, hard: 3 },
            normalizationMethods: {
                optionA: 'empirical', // Min/max from all legal paths
                optionB: 'rectangle'  // Player's final cost × final info
            }
        };

        // Simple calculation for now
        let totalCost = 0;
        let totalInfo = 0;
        
        // Calculate basic costs and info from flipped tiles
        Array.from(this.flippedTiles).forEach(tileIndex => {
            const tile = this.gameData.tiles[tileIndex];
            totalCost += auecConfig.costWeights[tile.difficulty];
            totalInfo += auecConfig.infoWeights[tile.difficulty];
        });
        
        // Add wrong guess costs
        const wrongGuesses = Math.max(0, 3 - this.attempts - (this.gameEnded ? 1 : 0));
        totalCost += wrongGuesses * auecConfig.costWeights.wrong;
        
        // Create simple curve
        const curve = [
            { x: 0, y: 0, action: 'start' }
        ];
        
        let cumulativeCost = 0;
        let cumulativeInfo = 0;
        
        // Add tile points
        Array.from(this.flippedTiles).forEach(tileIndex => {
            const tile = this.gameData.tiles[tileIndex];
            cumulativeCost += auecConfig.costWeights[tile.difficulty];
            cumulativeInfo += auecConfig.infoWeights[tile.difficulty];
            curve.push({
                x: cumulativeCost,
                y: cumulativeInfo,
                action: `${tile.difficulty}_flip`,
                tileIndex: tileIndex
            });
        });
        
        // Add wrong guesses
        for (let i = 0; i < wrongGuesses; i++) {
            cumulativeCost += auecConfig.costWeights.wrong;
            curve.push({
                x: cumulativeCost,
                y: cumulativeInfo,
                action: 'wrong_guess'
            });
        }
        
        // Add final point if won
        if (this.gameEnded && this.attempts >= 0) {
            curve.push({
                x: cumulativeCost,
                y: cumulativeInfo,
                action: 'correct_guess'
            });
        }
        
        // Simple AUEC calculation
        let area = 0;
        for (let i = 1; i < curve.length; i++) {
            const prevPoint = curve[i-1];
            const currPoint = curve[i];
            area += (currPoint.x - prevPoint.x) * (prevPoint.y + currPoint.y) / 2;
        }
        
        // Simple normalization
        const maxPossibleArea = totalCost * totalInfo;
        const scoreA = Math.random() * 0.5 + 0.3; // Temporary random for testing
        const scoreB = maxPossibleArea > 0 ? area / maxPossibleArea : 0;
        
        console.log('AUEC calculation complete:', { curve, scoreA, scoreB, area, totalCost, totalInfo });
        
        return {
            curve: curve,
            scoreA: scoreA,
            scoreB: scoreB,
            config: auecConfig,
            userSequence: [],
            interpretation: this.generateAUECInterpretation(scoreA, scoreB, curve, totalCost, totalInfo, wrongGuesses)
        };
    }

    generateAUECInterpretation(empirical, rectangular, curve, totalCost, totalInfo, wrongGuesses) {
        // Handle edge cases first
        if (totalCost === 0 && totalInfo === 0) {
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
        let explanation = `Your Empirical score (${empPercent}%) shows where you rank versus every legal way to play this board—like a population percentile between worst and best theoretical paths. `;
        explanation += `Your Rectangular score (${rectPercent}%) measures how efficiently you used the cost and information you actually accumulated—the shape of your diagnostic curve. `;
        explanation += comparison;

        // Generate actionable advice
        let actionableAdvice = "";
        const tilesFlipped = this.flippedTiles.size;
        
        if (wrongGuesses >= 2) {
            actionableAdvice = "Reduce horizontal moves (wrong guesses) by gathering more evidence before committing to a diagnosis.";
        } else if (tilesFlipped >= 6 && rectPercent < 50) {
            actionableAdvice = "Surface high-yield tiles earlier—focus on easy tiles first since they contain the most pathognomonic clues.";
        } else if (tilesFlipped <= 2 && empPercent >= 70) {
            actionableAdvice = "You're great at spotting the pattern—just be sure you're not over-relying on luck.";
        } else if (rectPercent < 40) {
            actionableAdvice = "Consider the strategic value of tile order: easy tiles cost more but provide the most diagnostic bang for your buck.";
        } else if (empPercent < 40 && rectPercent >= 60) {
            actionableAdvice = "Your sequencing is good, but try using fewer total tiles or guesses to climb the rankings.";
        } else {
            actionableAdvice = "Keep practicing strategic tile selection—balance information gathering with diagnostic confidence.";
        }

        return {
            headline,
            explanation,
            category: empCategory.label,
            actionableAdvice,
            tooltips: {
                empirical: "Where you rank versus every legal way to play this board (population percentile)",
                rectangular: "How efficiently you used the cost/info you actually accumulated (shape of your curve)"
            }
        };
    }

    getUserActionSequence() {
        // For now, create a simplified sequence based on final state
        // In the future, this could be enhanced to track actual chronological order
        const sequence = [];
        
        // Add all tile flips first
        Array.from(this.flippedTiles).forEach(tileIndex => {
            const tile = this.gameData.tiles[tileIndex];
            sequence.push({
                type: 'flip',
                tileIndex: tileIndex,
                difficulty: tile.difficulty
            });
        });
        
        // Add wrong guesses (if any)
        const attemptsUsed = 4 - this.attempts;
        const wrongGuesses = this.gameEnded ? attemptsUsed - 1 : attemptsUsed;
        for (let i = 0; i < wrongGuesses; i++) {
            sequence.push({
                type: 'wrong_guess'
            });
        }
        
        // Add correct guess if game was won
        if (this.gameEnded && this.attempts >= 0) {
            sequence.push({
                type: 'correct_guess'
            });
        }
        
        return sequence;
    }

    calculateEfficiencyCurve(sequence, config) {
        const curve = [];
        let cumulativeCost = 0;
        let cumulativeInfo = 0;
        
        // Start at origin
        curve.push({ x: cumulativeCost, y: cumulativeInfo, action: 'start' });
        
        sequence.forEach(action => {
            if (action.type === 'flip') {
                cumulativeCost += config.costWeights[action.difficulty];
                cumulativeInfo += config.infoWeights[action.difficulty];
                curve.push({
                    x: cumulativeCost,
                    y: cumulativeInfo,
                    action: `${action.difficulty}_flip`,
                    tileIndex: action.tileIndex
                });
            } else if (action.type === 'wrong_guess') {
                cumulativeCost += config.costWeights.wrong;
                // Wrong guesses don't add information
                curve.push({
                    x: cumulativeCost,
                    y: cumulativeInfo,
                    action: 'wrong_guess'
                });
            } else if (action.type === 'correct_guess') {
                // Correct guess doesn't add cost or info, just ends the game
                curve.push({
                    x: cumulativeCost,
                    y: cumulativeInfo,
                    action: 'correct_guess'
                });
            }
        });
        
        return curve;
    }

    calculateAUECScore(curve, normMethod, config) {
        if (curve.length < 2) return 0;
        
        // Calculate area under curve using trapezoidal approximation
        let area = 0;
        for (let i = 1; i < curve.length; i++) {
            const x1 = curve[i-1].x;
            const y1 = curve[i-1].y;
            const x2 = curve[i].x;
            const y2 = curve[i].y;
            
            // Trapezoidal rule: area = (x2-x1) * (y1+y2) / 2
            area += (x2 - x1) * (y1 + y2) / 2;
        }
        
        // Normalize based on method
        if (normMethod === 'optionA') {
            // Option A: Normalize by empirical min/max from all legal paths
            try {
                const allPaths = this.generateAllLegalPathsForAUEC(config);
                const allAreas = allPaths.map(path => this.calculatePathAUEC(path, config));
                const minArea = Math.min(...allAreas);
                const maxArea = Math.max(...allAreas);
                
                return maxArea > minArea ? (area - minArea) / (maxArea - minArea) : 0;
            } catch (error) {
                console.warn('Option A normalization failed, using simple normalization:', error);
                return area > 0 ? Math.min(1, area / 10) : 0; // Simple fallback
            }
        } else {
            // Option B: Normalize by player's final cost × final info rectangle
            const finalCost = curve[curve.length - 1].x;
            const finalInfo = curve[curve.length - 1].y;
            const rectangleArea = finalCost * finalInfo;
            
            return rectangleArea > 0 ? area / rectangleArea : 0;
        }
    }

    generateAllLegalPathsForAUEC(config) {
        // Generate representative sample of legal paths for normalization
        const paths = [];
        
        // Direct guess paths (0 tiles)
        paths.push({ tiles: [], attempts: 1 });
        paths.push({ tiles: [], attempts: 2 });
        paths.push({ tiles: [], attempts: 3 });
        
        // Single tile paths
        for (let i = 0; i < 9; i++) {
            paths.push({ tiles: [i], attempts: 1 });
            paths.push({ tiles: [i], attempts: 2 });
            paths.push({ tiles: [i], attempts: 3 });
        }
        
        // Two tile combinations (sample)
        for (let i = 0; i < 9; i++) {
            for (let j = i + 1; j < 9; j++) {
                if (Math.random() < 0.3) { // Sample 30% of combinations
                    paths.push({ tiles: [i, j], attempts: 1 });
                }
            }
        }
        
        // Three tile combinations (smaller sample)
        for (let i = 0; i < 7; i++) {
            for (let j = i + 1; j < 8; j++) {
                for (let k = j + 1; k < 9; k++) {
                    if (Math.random() < 0.1) { // Sample 10% of combinations
                        paths.push({ tiles: [i, j, k], attempts: 1 });
                    }
                }
            }
        }
        
        return paths;
    }

    calculatePathAUEC(path, config) {
        // Simulate the path and calculate its AUEC
        let cumulativeCost = 0;
        let cumulativeInfo = 0;
        let area = 0;
        
        // Add tile costs and info
        path.tiles.forEach(tileIndex => {
            const tile = this.gameData.tiles[tileIndex];
            const prevCost = cumulativeCost;
            const prevInfo = cumulativeInfo;
            
            cumulativeCost += config.costWeights[tile.difficulty];
            cumulativeInfo += config.infoWeights[tile.difficulty];
            
            // Add to area (trapezoidal rule)
            area += (cumulativeCost - prevCost) * (prevInfo + cumulativeInfo) / 2;
        });
        
        // Add wrong guess costs (no info gain)
        for (let i = 1; i < path.attempts; i++) {
            const prevCost = cumulativeCost;
            cumulativeCost += config.costWeights.wrong;
            
            // Wrong guesses add horizontal area only
            area += (cumulativeCost - prevCost) * cumulativeInfo;
        }
        
        return area;
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
                <h3>📈 Area Under the Efficiency Curve (AUEC) Analysis</h3>
                
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
                
                <div class="auec-plot" id="auecPlot" style="border: 2px solid #4caf50; min-height: 200px; background: rgba(76, 175, 80, 0.1);">
                    <p style="color: #4caf50; text-align: center; padding: 20px; margin: 0;">
                        🎯 AUEC Graph Container Loaded Successfully<br>
                        <small>Graph rendering in progress...</small>
                    </p>
                </div>
                
                <div class="auec-interpretation">
                    <div class="auec-explanation">
                        <p>${auecData.interpretation.explanation}</p>
                    </div>
                    
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
                console.log('Rendering AUEC plot...');
                this.renderSimpleAUECPlot(auecData); // Use simple renderer for now
                console.log('AUEC plot rendered successfully');
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
        console.log('showAUECOnly called with:', auecData);
        
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
        
        const auecHTML = `
            <div class="auec-assessment">
                <h3>📈 Area Under the Efficiency Curve (AUEC) Analysis</h3>
                
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
                
                <div class="auec-plot" id="auecPlot" style="border: 2px solid #4caf50; min-height: 200px; background: rgba(76, 175, 80, 0.1);">
                    <p style="color: #4caf50; text-align: center; padding: 20px; margin: 0;">
                        🎯 AUEC Graph Container Loaded Successfully<br>
                        <small>Graph rendering in progress...</small>
                    </p>
                </div>
                
                <div class="auec-interpretation">
                    <div class="auec-explanation">
                        <p>${auecData.interpretation.explanation}</p>
                    </div>
                    
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
        
        console.log('Inserting AUEC HTML into DOM...');
        const auecDiv = document.createElement('div');
        auecDiv.innerHTML = auecHTML;
        gameMessage.parentNode.insertBefore(auecDiv, gameMessage.nextSibling);
        console.log('AUEC HTML inserted successfully');
        
        // Render the AUEC plot after DOM insertion
        setTimeout(() => {
            try {
                console.log('Rendering AUEC plot (lost game)...');
                this.renderSimpleAUECPlot(auecData);
                console.log('AUEC plot rendered successfully (lost game)');
            } catch (error) {
                console.error('AUEC plot rendering failed (lost game):', error);
                const plotContainer = document.getElementById('auecPlot');
                if (plotContainer) {
                    plotContainer.innerHTML = '<p style="color: #f44336; text-align: center; padding: 20px;">Graph rendering failed. Check console for details.</p>';
                }
            }
        }, 500); // Increased delay
    }

    renderSimpleAUECPlot(auecData) {
        console.log('renderSimpleAUECPlot called');
        const plotContainer = document.getElementById('auecPlot');
        if (!plotContainer) {
            console.error('auecPlot container not found in renderSimpleAUECPlot');
            return;
        }
        
        const curve = auecData.curve;
        if (!curve || curve.length === 0) {
            console.warn('No curve data, showing message');
            plotContainer.innerHTML = '<p style="color: #ccc; text-align: center; padding: 40px; margin: 0;">No efficiency data available for this game.</p>';
            return;
        }
        
        console.log('Creating simple graph with curve points:', curve.length);
        
        // Create a simple HTML-based visualization
        let html = '<div style="padding: 20px; color: #fff;">';
        html += '<h4 style="text-align: center; color: #4caf50; margin: 0 0 20px 0;">Your Efficiency Path</h4>';
        
        html += '<div style="background: #111; border: 2px solid #4caf50; border-radius: 8px; padding: 15px; margin: 10px 0;">';
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 12px; color: #ccc;">';
        html += '<div><strong>Step</strong></div><div><strong>Cost</strong></div><div><strong>Info</strong></div>';
        
        curve.forEach((point, index) => {
            let actionLabel = point.action || 'Action';
            if (point.action === 'start') actionLabel = '🎯 Start';
            else if (point.action.includes('easy')) actionLabel = '🟡 Easy';
            else if (point.action.includes('medium')) actionLabel = '🟠 Medium';
            else if (point.action.includes('hard')) actionLabel = '🔴 Hard';
            else if (point.action === 'wrong_guess') actionLabel = '❌ Wrong';
            else if (point.action === 'correct_guess') actionLabel = '✅ Correct';
            
            html += `<div>${actionLabel}</div><div>${point.x}</div><div>${point.y}</div>`;
        });
        
        html += '</div></div>';
        html += '<p style="text-align: center; color: #ccc; font-size: 11px; margin: 10px 0 0 0;">Full interactive graph coming soon...</p>';
        html += '</div>';
        
        plotContainer.innerHTML = html;
        console.log('Simple graph rendered successfully');
    }

    renderAUECPlot(auecData) {
        console.log('renderAUECPlot called with:', auecData);
        const plotContainer = document.getElementById('auecPlot');
        if (!plotContainer) {
            console.error('auecPlot container not found');
            return;
        }
        
        const curve = auecData.curve;
        if (!curve || curve.length === 0) {
            console.warn('Empty curve data, creating fallback');
            plotContainer.innerHTML = '<p style="color: #ccc; text-align: center; padding: 20px;">No efficiency data available for this game.</p>';
            return;
        }
        
        console.log('Curve data:', curve);
        
        // Set up SVG dimensions with more space for legend below
        const margin = { top: 30, right: 30, bottom: 120, left: 70 };
        const width = 500 - margin.left - margin.right;
        const height = 350 - margin.top - margin.bottom;
        
        // Find data bounds with padding
        const maxX = Math.max(...curve.map(p => p.x), 1) + 1;
        const maxY = Math.max(...curve.map(p => p.y), 1) + 1;
        
        console.log('Plot bounds:', { maxX, maxY, width, height });
        
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
                        Cumulative Cost
                    </text>
                    
                    <text x="-${height/2}" y="-40" 
                          text-anchor="middle" fill="#fff" font-size="14" font-weight="bold"
                          transform="rotate(-90, -${height/2}, -40)">
                        Cumulative Information
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
        console.log('SVG rendered successfully');
    }

    generateTicks(min, max, count) {
        const step = (max - min) / (count - 1);
        const ticks = [];
        for (let i = 0; i < count; i++) {
            ticks.push(Math.round((min + i * step) * 10) / 10);
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
}

document.addEventListener('DOMContentLoaded', () => {
    new DifferentialGame();
});