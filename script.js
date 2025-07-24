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
            "date": "2025-07-25",
            "answer": "Urosepsis",
            "tiles": [
                {
                    "difficulty": "easy",
                    "clue": "Elderly fever chills"
                },
                {
                    "difficulty": "medium", 
                    "clue": "MAP under 65 mmHg"
                },
                {
                    "difficulty": "hard",
                    "clue": "Nitrite+ urine"
                },
                {
                    "difficulty": "easy",
                    "clue": "Flank pain dysuria"
                },
                {
                    "difficulty": "medium",
                    "clue": "Lactate 3.5 mmol/L"
                },
                {
                    "difficulty": "hard", 
                    "clue": "Gram-neg bacilli"
                },
                {
                    "difficulty": "medium",
                    "clue": "WBC 18k with bands"
                },
                {
                    "difficulty": "hard",
                    "clue": "PCT 8 ug/L"
                },
                {
                    "difficulty": "hard",
                    "clue": "Creatinine 2.5↑"
                }
            ],
            "concepts": [
                "Urosepsis",
                "Septic Shock",
                "Pneumonia Sepsis",
                "Biliary Sepsis",
                "Intra-abdominal Sepsis",
                "Endocarditis",
                "Meningococcemia",
                "Necrotizing Fasciitis",
                "Toxic Shock Syndrome",
                "Catheter-related BSI",
                "Clostridioides difficile",
                "Influenza A",
                "Aspiration Pneumonitis",
                "Diabetic Ketoacidosis",
                "Pulmonary Embolism",
                "Acute Pancreatitis",
                "Upper GI Bleed",
                "Acute Coronary Syndrome",
                "Rhabdomyolysis",
                "Acute Kidney Injury"
            ]
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

        // Create jagged layout: 2-3-4 tiles per column
        const columns = [
            [0, 3],           // Column 1: 2 easy tiles
            [1, 4, 6],        // Column 2: 3 medium tiles  
            [2, 5, 7, 8]      // Column 3: 4 hard tiles
        ];

        columns.forEach(columnTiles => {
            const column = document.createElement('div');
            column.className = 'game-column';
            
            columnTiles.forEach(tileIndex => {
                const tile = this.gameData.tiles[tileIndex];
                const tileElement = document.createElement('div');
                tileElement.className = `tile difficulty-${tile.difficulty}`;
                tileElement.dataset.index = tileIndex;
                tileElement.innerHTML = `<div class="tile-content"></div>`;
                tileElement.addEventListener('click', () => this.flipTile(tileIndex));
                column.appendChild(tileElement);
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

        const isCorrect = this.selectedConcept.toLowerCase() === this.gameData.answer.toLowerCase();
        
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

    endGame(won) {
        this.gameEnded = true;
        document.getElementById('guessInput').disabled = true;
        document.getElementById('submitGuess').disabled = true;
        
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.classList.add('game-ended');
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
}

document.addEventListener('DOMContentLoaded', () => {
    new DifferentialGame();
});