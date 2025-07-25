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
                console.log('Assessment calculated:', assessment);
                this.showPerformanceAssessment(assessment);
                console.log('Assessment displayed');
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

    showPerformanceAssessment(assessment) {
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
        `;
        
        // Insert assessment after game message, before explanations will be added
        const gameMessage = document.getElementById('gameMessage');
        const assessmentDiv = document.createElement('div');
        assessmentDiv.innerHTML = assessmentHTML;
        gameMessage.parentNode.insertBefore(assessmentDiv, gameMessage.nextSibling);
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