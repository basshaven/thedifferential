/**
 * User Interface Module for The Differential
 * Handles all UI interactions, visualizations, and display methods
 */

// Extend DifferentialGame with UI methods
DifferentialGame.prototype.showMessage = function(text, type = '') {
    const messageEl = document.getElementById('gameMessage');
    messageEl.textContent = text;
    messageEl.className = `game-message ${type}`;
};

DifferentialGame.prototype.showAUECOnly = function(auecData) {
    
    // Ensure we have valid interpretation data
    if (!auecData.interpretation) {
        console.error('Missing interpretation data, creating fallback');
        auecData.interpretation = {
            headline: "AUEC Analysis Available",
            explanation: "Analysis of your efficiency curve is available.",
            advice: "Continue playing to improve your diagnostic skills.",
            tooltips: {
                empirical: "Ranking vs all possible paths",
                rectangular: "Efficiency of your curve shape"
            }
        };
    }
    
    // Generate the breakdown HTML separately to avoid context issues
    console.log('Generating AUEC calculation breakdown...');
    const calculationBreakdown = this.generateAUECCalculationBreakdown(auecData);
    console.log('Breakdown generated:', calculationBreakdown.substring(0, 100) + '...');
    
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
                    <p><strong>💡 Next time:</strong> ${auecData.interpretation.advice}</p>
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
            console.error('AUEC plot rendering failed:', error);
            const plotContainer = document.getElementById('auecPlot');
            if (plotContainer) {
                plotContainer.innerHTML = '<p style="color: #f44336; text-align: center; padding: 20px;">Graph rendering failed. Check console for details.</p>';
            }
        }
    }, 500); // Increased delay
};

DifferentialGame.prototype.renderFullAUECPlot = function(auecData) {
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
    
    
    // Set up SVG dimensions with 1:1 aspect ratio
    const margin = { top: 30, right: 30, bottom: 120, left: 70 };
    const plotSize = 400; // Square plot area for 1:1 aspect ratio
    const width = plotSize;
    const height = plotSize;
    
    // Calculate theoretical maximum values (always use full limits)
    const config = auecData.config || this.getAUECConfig();
    const maxPossibleCost = 9 * 3 + 2 * 5; // All tiles + 2 wrong guesses = 37
    const maxPossibleInfo = 9 * 3; // All hard tiles = 27
    
    // Always use full axis limits for consistency
    const maxX = maxPossibleCost;
    const maxY = maxPossibleInfo;
    
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
                <text x="-${height/2}" y="-40" 
                      text-anchor="middle" fill="#fff" font-size="14" font-weight="bold"
                      transform="rotate(-90, -${height/2}, -40)">
                    Information
                </text>
                
                <!-- Plot title -->
                <text x="${width/2}" y="-10" 
                      text-anchor="middle" fill="#4caf50" font-size="16" font-weight="bold">
                    Diagnostic Efficiency Curve
                </text>
                
                <!-- Legend -->
                ${this.generateLegend(10, height + 65, width - 20)}
            </g>
        </svg>
    `;
    
    plotContainer.innerHTML = svg;
};

DifferentialGame.prototype.generateTicks = function(min, max, count) {
    const step = (max - min) / (count - 1);
    const ticks = [];
    for (let i = 0; i < count; i++) {
        ticks.push(Math.round(min + i * step));
    }
    return ticks;
};

DifferentialGame.prototype.generateGridLines = function(width, height, xTicks, yTicks, xScale, yScale) {
    let gridLines = '';
    
    // Vertical grid lines
    xTicks.forEach(tick => {
        const x = xScale(tick);
        gridLines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#333" stroke-width="0.5"/>`;
    });
    
    // Horizontal grid lines
    yTicks.forEach(tick => {
        const y = yScale(tick);
        gridLines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#333" stroke-width="0.5"/>`;
    });
    
    return gridLines;
};

DifferentialGame.prototype.generateAxisLabels = function(xTicks, yTicks, width, height, xScale, yScale) {
    let labels = '';
    
    // X-axis labels
    xTicks.forEach(tick => {
        const x = xScale(tick);
        labels += `<text x="${x}" y="${height + 15}" text-anchor="middle" fill="#fff" font-size="12">${tick}</text>`;
        labels += `<line x1="${x}" y1="${height}" x2="${x}" y2="${height + 5}" stroke="#fff" stroke-width="1"/>`;
    });
    
    // Y-axis labels  
    yTicks.forEach(tick => {
        const y = yScale(tick);
        labels += `<text x="-10" y="${y + 4}" text-anchor="end" fill="#fff" font-size="12">${tick}</text>`;
        labels += `<line x1="0" y1="${y}" x2="-5" y2="${y}" stroke="#fff" stroke-width="1"/>`;
    });
    
    return labels;
};

DifferentialGame.prototype.generateStaircasePath = function(curve, xScale, yScale) {
    if (!curve || curve.length < 2) return '';
    
    let pathData = `M ${xScale(curve[0].x)} ${yScale(curve[0].y)}`;
    let areaPath = `M ${xScale(curve[0].x)} ${yScale(0)} L ${xScale(curve[0].x)} ${yScale(curve[0].y)}`;
    
    for (let i = 1; i < curve.length; i++) {
        const prevPoint = curve[i - 1];
        const currPoint = curve[i];
        
        // Horizontal line to new x position
        pathData += ` L ${xScale(currPoint.x)} ${yScale(prevPoint.y)}`;
        areaPath += ` L ${xScale(currPoint.x)} ${yScale(prevPoint.y)}`;
        
        // Vertical line to new y position  
        pathData += ` L ${xScale(currPoint.x)} ${yScale(currPoint.y)}`;
        areaPath += ` L ${xScale(currPoint.x)} ${yScale(currPoint.y)}`;
    }
    
    // Close area path
    const lastPoint = curve[curve.length - 1];
    areaPath += ` L ${xScale(lastPoint.x)} ${yScale(0)} Z`;
    
    return `
        <!-- Area under curve -->
        <path d="${areaPath}" fill="rgba(76, 175, 80, 0.2)" stroke="none"/>
        <!-- Efficiency curve -->
        <path d="${pathData}" fill="none" stroke="#4caf50" stroke-width="3"/>
    `;
};

DifferentialGame.prototype.generateDataPoints = function(curve, xScale, yScale) {
    if (!curve) return '';
    
    let points = '';
    
    curve.forEach((point, index) => {
        if (index === 0) return; // Skip start point
        
        const x = xScale(point.x);
        const y = yScale(point.y);
        
        // Choose color and style based on action type
        let color = '#4caf50';
        let size = 4;
        
        if (point.action.includes('easy')) {
            color = '#fff59d';
        } else if (point.action.includes('medium')) {
            color = '#ffeb3b';
        } else if (point.action.includes('hard')) {
            color = '#ffc107';
        } else if (point.action === 'wrong_guess') {
            color = '#f44336';
            size = 5;
        } else if (point.action === 'correct_guess') {
            color = '#4caf50';
            size = 6;
        }
        
        points += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" stroke="#000" stroke-width="1"/>`;
    });
    
    return points;
};

DifferentialGame.prototype.generateLegend = function(x, y, width) {
    const legendItems = [
        { color: '#fff59d', label: 'Easy tiles', symbol: '●' },
        { color: '#ffeb3b', label: 'Medium tiles', symbol: '●' },
        { color: '#ffc107', label: 'Hard tiles', symbol: '●' },
        { color: '#f44336', label: 'Wrong guess', symbol: '●' },
        { color: '#4caf50', label: 'Correct guess', symbol: '●' }
    ];
    
    const itemWidth = width / legendItems.length;
    let legend = '';
    
    legendItems.forEach((item, index) => {
        const itemX = x + index * itemWidth;
        legend += `
            <circle cx="${itemX + 8}" cy="${y + 8}" r="4" fill="${item.color}" stroke="#000" stroke-width="1"/>
            <text x="${itemX + 18}" y="${y + 12}" fill="#fff" font-size="10">${item.label}</text>
        `;
    });
    
    return legend;
};

DifferentialGame.prototype.addGameEndFlourish = function(won) {
    const container = document.querySelector('.container');
    const title = document.querySelector('h1');
    
    if (won) {
        // Success animations
        container.classList.add('game-celebration');
        title.classList.add('title-celebration');
        this.createConfetti();
        
        // Enhanced success message
        setTimeout(() => {
            const messageEl = document.getElementById('gameMessage');
            messageEl.classList.add('message-success-big');
        }, 500);
        
    } else {
        // Failure animations
        container.classList.add('game-sadness');
        title.classList.add('title-sadness');
        
        // Enhanced failure message
        setTimeout(() => {
            const messageEl = document.getElementById('gameMessage');
            messageEl.classList.add('message-error-big');
        }, 500);
    }
    
    // Remove animation classes after animation completes
    setTimeout(() => {
        container.classList.remove('game-celebration', 'game-sadness');
        title.classList.remove('title-celebration', 'title-sadness');
    }, 3000);
};

DifferentialGame.prototype.createConfetti = function() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    // Create multiple confetti pieces
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confettiContainer.appendChild(confetti);
    }
    
    // Remove confetti after animation
    setTimeout(() => {
        document.body.removeChild(confettiContainer);
    }, 5000);
};

DifferentialGame.prototype.showExplanations = function() {
    setTimeout(() => {
        // Check if explanations section already exists
        if (document.querySelector('.explanations-section')) {
            return;
        }
        
        const explanationsHTML = `
            <div class="explanations-section">
                <h3>Understanding the Clues</h3>
                <div class="explanations-grid">
                    ${this.gameData.tiles.map((tile, index) => {
                        const isFlipped = this.flippedTiles.has(index);
                        const explanation = this.gameData.explanations[`tile_${index}`];
                        
                        if (!isFlipped) {
                            return ''; // Don't show explanations for unflipped tiles
                        }
                        
                        return `
                            <div class="explanation-item difficulty-${tile.difficulty}">
                                <div class="explanation-header">
                                    <div class="explanation-tile-preview difficulty-${tile.difficulty}">
                                        ${tile.clue}
                                    </div>
                                    <div class="explanation-content">
                                        <div class="explanation-label">${tile.difficulty.toUpperCase()} TILE</div>
                                        <div class="explanation-text">${explanation}</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        // Insert explanations after the AUEC section
        const auecSection = document.querySelector('.auec-assessment');
        if (auecSection) {
            const explanationsDiv = document.createElement('div');
            explanationsDiv.innerHTML = explanationsHTML;
            auecSection.parentNode.insertBefore(explanationsDiv, auecSection.nextSibling);
        } else {
            // Fallback: insert after game message
            const gameMessage = document.getElementById('gameMessage');
            if (gameMessage) {
                const explanationsDiv = document.createElement('div');
                explanationsDiv.innerHTML = explanationsHTML;
                gameMessage.parentNode.insertBefore(explanationsDiv, gameMessage.nextSibling);
            }
        }
    }, 6000); // Show explanations after AUEC analysis
};