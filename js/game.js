/**
 * Core game mechanics for The Differential
 * Handles game state, data loading, board setup, and user interactions
 */

class DifferentialGame {
    constructor() {
        this.gameData = null;
        this.attempts = 3;
        this.flippedTiles = new Set();
        this.gameEnded = false;
        this.selectedConcept = '';
        this.concepts = [];
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
        
        // Create 3 columns for different difficulties
        const difficulties = ['easy', 'medium', 'hard'];
        const tilesPerColumn = [2, 3, 4];
        
        let tileIndex = 0;
        
        difficulties.forEach((difficulty, colIndex) => {
            const column = document.createElement('div');
            column.className = 'game-column';
            
            for (let i = 0; i < tilesPerColumn[colIndex]; i++) {
                const tile = this.gameData.tiles[tileIndex];
                if (tile) {
                    const tileElement = document.createElement('div');
                    tileElement.className = `tile difficulty-${tile.difficulty}`;
                    tileElement.dataset.index = tileIndex;
                    tileElement.innerHTML = `<div class="tile-content"></div>`;
                    tileElement.addEventListener('click', () => this.flipTile(tileIndex));
                    column.appendChild(tileElement);
                }
                tileIndex++;
            }
            
            gameBoard.appendChild(column);
        });
    }

    flipTile(index) {
        if (this.flippedTiles.has(index) || this.gameEnded) return;
        
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
            
        }
        this.updateDisplay();
    }

    setupGuessInput() {
        const input = document.getElementById('guessInput');
        const submitBtn = document.getElementById('submitGuess');

        input.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            submitBtn.disabled = value.length === 0;
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !submitBtn.disabled) {
                this.makeGuess();
            }
        });

        submitBtn.addEventListener('click', () => {
            if (!submitBtn.disabled) {
                this.makeGuess();
            }
        });

        // Set up autocomplete
        input.addEventListener('input', (e) => {
            this.selectedConcept = e.target.value;
        });
    }

    makeGuess() {
        if (this.gameEnded || this.attempts <= 0) return;
        
        const userInput = this.selectedConcept.trim();
        if (!userInput) return;
        
        const isCorrect = this.checkAnswerMatch(userInput, this.gameData);
        
        if (isCorrect) {
            // Record the correct guess
            this.actionSequence.push({
                type: 'correct_guess',
                guess: this.selectedConcept,
                attempt: 4 - this.attempts,
                timestamp: Date.now()
            });
            
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
        if (!userInput || !gameData?.acceptable_answers) return false;
        
        const normalizedInput = this.normalizeAnswer(userInput);
        
        // First check: exact match after normalization
        for (const answer of gameData.acceptable_answers) {
            const normalizedAnswer = this.normalizeAnswer(answer);
            if (normalizedInput === normalizedAnswer) {
                return true;
            }
        }
        
        // Second check: fuzzy matching for typos
        if (this.isFuzzyMatch(normalizedInput, gameData)) {
            return true;
        }
        
        // Third check: partial matching
        for (const answer of gameData.acceptable_answers) {
            if (this.isPartialMatch(normalizedInput, this.normalizeAnswer(answer))) {
                return true;
            }
        }
        
        return false;
    }

    normalizeAnswer(answer) {
        if (!answer) return '';
        
        return answer
            .toLowerCase()
            .replace(/['']/g, '')  // Remove apostrophes and smart quotes
            .replace(/[^\w\s]/g, '') // Remove punctuation except spaces
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();
    }

    isFuzzyMatch(normalizedInput, gameData) {
        const threshold = Math.min(3, Math.floor(normalizedInput.length * 0.15));
        
        for (const answer of gameData.acceptable_answers) {
            const normalizedAnswer = this.normalizeAnswer(answer);
            const distance = this.levenshteinDistance(normalizedInput, normalizedAnswer);
            
            if (distance <= threshold && normalizedInput.length >= 4) {
                return true;
            }
        }
        
        return false;
    }

    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i++) {
            matrix[0][i] = i;
        }
        
        for (let j = 0; j <= str2.length; j++) {
            matrix[j][0] = j;
        }
        
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,     // deletion
                    matrix[j - 1][i] + 1,     // insertion
                    matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    isPartialMatch(input, target) {
        if (input.length < 4) return false;
        
        // Check if input is a substring of target or vice versa
        return target.includes(input) || input.includes(target);
    }

    endGame(won) {
        this.gameEnded = true;
        
        // Gray out remaining tiles
        document.querySelectorAll('.tile:not(.flipped)').forEach(tile => {
            tile.classList.add('game-ended');
        });
        
        // Disable input
        document.getElementById('guessInput').disabled = true;
        document.getElementById('submitGuess').disabled = true;
        
        // Add visual flourish
        this.addGameEndFlourish(won);
        
        // Show AUEC analysis after a delay
        setTimeout(() => {
            console.log('Showing AUEC analysis...');
            try {
                const auecData = this.calculateAUEC();
                this.showAUECOnly(auecData);
            } catch (error) {
                console.error('AUEC calculation failed:', error);
            }
            this.showExplanations();
        }, won ? 3000 : 2000);
    }

    updateDisplay() {
        document.getElementById('attempts').textContent = this.attempts;
    }

    updateLastModified() {
        // Try to get the last modified time from the server
        fetch('today.json', { method: 'HEAD' })
            .then(response => {
                const lastModified = response.headers.get('last-modified');
                if (lastModified) {
                    const date = new Date(lastModified);
                    const options = { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    };
                    document.getElementById('lastUpdated').textContent = 
                        `Last updated: ${date.toLocaleDateString('en-US', options)}`;
                } else {
                    // Fallback to using the date from the puzzle data
                    if (this.gameData?.date) {
                        const puzzleDate = new Date(this.gameData.date);
                        document.getElementById('lastUpdated').textContent = 
                            `Puzzle date: ${puzzleDate.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })}`;
                    }
                }
            })
            .catch(error => {
                console.log('Could not fetch last modified time:', error);
                // Fallback to using the date from the puzzle data
                if (this.gameData?.date) {
                    const puzzleDate = new Date(this.gameData.date);
                    document.getElementById('lastUpdated').textContent = 
                        `Puzzle date: ${puzzleDate.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })}`;
                }
            });
    }
}