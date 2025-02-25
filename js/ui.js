// Function to detect if pointer is over a tooltip area
function checkTooltipHover() {
    if (!pointer.hover.active || !settings.showTooltips) {
        pointer.hover.tooltip = null;
        return;
    }

    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const panelWidth = Math.min(320, canvasWidth * 0.25);
    const panelHeight = 180; // Updated to match the new panel height
    const panelX = canvasWidth - panelWidth - 15;
    const panelY = 15;
    const padding = 15;
    
    // Check if mouse is over the stats panel
    if (pointer.hover.x >= panelX && pointer.hover.x <= panelX + panelWidth &&
        pointer.hover.y >= panelY && pointer.hover.y <= panelY + panelHeight) {
        
        // Check specific regions within the panel
        const teamSectionY = panelY + padding * 2 + 50;
        const teamRowHeight = 22;
        
        // Generation info area
        if (pointer.hover.y < panelY + padding * 2 + 12) {
            pointer.hover.tooltip = tooltips.generation;
            return;
        }
        
        // Score bar area
        if (pointer.hover.y >= panelY + padding * 2 + 20 && 
            pointer.hover.y <= panelY + padding * 2 + 30) {
            pointer.hover.tooltip = tooltips.score;
            return;
        }
        
        // Red team header
        if (pointer.hover.x < panelX + panelWidth/2 && 
            pointer.hover.y >= teamSectionY - 14 && 
            pointer.hover.y <= teamSectionY) {
            pointer.hover.tooltip = tooltips.redTeam;
            return;
        }
        
        // Blue team header
        if (pointer.hover.x >= panelX + panelWidth/2 && 
            pointer.hover.y >= teamSectionY - 14 && 
            pointer.hover.y <= teamSectionY) {
            pointer.hover.tooltip = tooltips.blueTeam;
            return;
        }
        
        // Team stats - left side (Red)
        if (pointer.hover.x < panelX + panelWidth/2) {
            // Creatures count
            if (pointer.hover.y >= teamSectionY + teamRowHeight && 
                pointer.hover.y <= teamSectionY + teamRowHeight * 1.8) {
                pointer.hover.tooltip = tooltips.creatures;
                return;
            }
            
            // K/B Ratio
            if (pointer.hover.y >= teamSectionY + teamRowHeight * 2 && 
                pointer.hover.y <= teamSectionY + teamRowHeight * 2.8) {
                pointer.hover.tooltip = tooltips.kbRatio;
                return;
            }
            
            // Top ability
            if (pointer.hover.y >= teamSectionY + teamRowHeight * 3 && 
                pointer.hover.y <= teamSectionY + teamRowHeight * 3.8) {
                pointer.hover.tooltip = tooltips.topAbility;
                return;
            }
        }
        
        // Team stats - right side (Blue)
        else {
            // Creatures count
            if (pointer.hover.y >= teamSectionY + teamRowHeight && 
                pointer.hover.y <= teamSectionY + teamRowHeight * 1.8) {
                pointer.hover.tooltip = tooltips.creatures;
                return;
            }
            
            // K/B Ratio
            if (pointer.hover.y >= teamSectionY + teamRowHeight * 2 && 
                pointer.hover.y <= teamSectionY + teamRowHeight * 2.8) {
                pointer.hover.tooltip = tooltips.kbRatio;
                return;
            }
            
            // Top ability
            if (pointer.hover.y >= teamSectionY + teamRowHeight * 3 && 
                pointer.hover.y <= teamSectionY + teamRowHeight * 3.8) {
                pointer.hover.tooltip = tooltips.topAbility;
                return;
            }
        }
    }
    
    // No tooltip region matched
    pointer.hover.tooltip = null;
}

// Draw tooltip if active
function drawTooltip() {
    if (!pointer.hover.tooltip || !settings.showTooltips) return;
    
    ctx.save();
    
    // Set font and get text width
    ctx.font = '14px Arial';
    const textWidth = ctx.measureText(pointer.hover.tooltip).width;
    
    // Calculate tooltip position
    let x = pointer.hover.x + 15;
    let y = pointer.hover.y - 15;
    const padding = 8;
    const tooltipWidth = textWidth + padding * 2;
    const tooltipHeight = 30;
    
    // Ensure tooltip stays within canvas bounds
    if (x + tooltipWidth > canvas.width) {
        x = canvas.width - tooltipWidth - 5;
    }
    if (y - tooltipHeight < 0) {
        y = tooltipHeight + 5;
    }
    
    // Draw tooltip background with rounded corners
    ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
    roundedRect(ctx, x, y - tooltipHeight, tooltipWidth, tooltipHeight, 5);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    roundedRect(ctx, x, y - tooltipHeight, tooltipWidth, tooltipHeight, 5);
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(pointer.hover.tooltip, x + padding, y - tooltipHeight/2);
    
    // Draw info icon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x - 10, y - tooltipHeight/2, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(30, 30, 50, 1)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('i', x - 10, y - tooltipHeight/2 + 1);
    
    ctx.restore();
}

// Draw team stats with improved design
function drawTeamStats() {
    if (!settings.showTeamScores) return;
    
    ctx.save();
    
    // Get canvas dimensions for responsive positioning
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Panel dimensions and positioning
    const panelWidth = Math.min(320, canvasWidth * 0.25);
    const panelHeight = 180; // Reduced height since we're removing the tooltip
    const padding = 15;
    const cornerRadius = 10;
    
    // Position in top right with margin
    const panelX = canvasWidth - panelWidth - 15;
    const panelY = 15;
    
    // Get total score for progress bar calculations
    const redScore = teamStats[TEAMS.RED].score;
    const blueScore = teamStats[TEAMS.BLUE].score;
    const totalScore = Math.max(redScore + blueScore, 1); // Avoid division by zero
    
    // Timer calculation - approx. seconds since start
    const seconds = Math.floor(performance.now() / 1000) % 60;
    const minutes = Math.floor(performance.now() / 60000);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Draw main panel with rounded corners and improved style
    ctx.fillStyle = 'rgba(10, 10, 25, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    roundedRect(ctx, panelX, panelY, panelWidth, panelHeight, cornerRadius);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw border with team color gradient
    const gradient = ctx.createLinearGradient(panelX, panelY, panelX + panelWidth, panelY + panelHeight);
    gradient.addColorStop(0, teamColors[TEAMS.RED].base);
    gradient.addColorStop(1, teamColors[TEAMS.BLUE].base);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    roundedRect(ctx, panelX, panelY, panelWidth, panelHeight, cornerRadius);
    ctx.stroke();
    
    // Header section with improved typography
    ctx.fillStyle = 'white';
    ctx.font = '600 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`EVOLUTION STATS`, panelX + panelWidth/2, panelY + padding + 5);
    
    // Draw divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + padding, panelY + padding + 16);
    ctx.lineTo(panelX + panelWidth - padding, panelY + padding + 16);
    ctx.stroke();
    
    // Generation and time info
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(`Gen ${generation} • Time ${timeString}`, panelX + padding, panelY + padding * 2 + 12);
    
    // Draw progress bar for score comparison
    const barHeight = 10;
    const barY = panelY + padding * 2 + 20;
    const barWidth = panelWidth - padding * 2;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundedRect(ctx, panelX + padding, barY, barWidth, barHeight, barHeight/2);
    ctx.fill();
    
    // Red team progress
    const redWidth = Math.max(barWidth * (redScore / totalScore), 5);
    ctx.fillStyle = teamColors[TEAMS.RED].base;
    if (redWidth > 5) {
        ctx.beginPath();
        ctx.moveTo(panelX + padding + barHeight/2, barY);
        ctx.lineTo(panelX + padding + redWidth - barHeight/2, barY);
        ctx.arc(panelX + padding + redWidth - barHeight/2, barY + barHeight/2, barHeight/2, -Math.PI/2, Math.PI/2);
        ctx.lineTo(panelX + padding + barHeight/2, barY + barHeight);
        ctx.arc(panelX + padding + barHeight/2, barY + barHeight/2, barHeight/2, Math.PI/2, -Math.PI/2);
        ctx.fill();
    }
    
    // Blue team progress
    const blueWidth = Math.max(barWidth * (blueScore / totalScore), 5);
    ctx.fillStyle = teamColors[TEAMS.BLUE].base;
    if (blueWidth > 5) {
        ctx.beginPath();
        ctx.moveTo(panelX + padding + barWidth - barHeight/2, barY);
        ctx.lineTo(panelX + padding + barWidth - blueWidth + barHeight/2, barY);
        ctx.arc(panelX + padding + barWidth - blueWidth + barHeight/2, barY + barHeight/2, barHeight/2, -Math.PI/2, Math.PI * 3/2, true);
        ctx.lineTo(panelX + padding + barWidth - barHeight/2, barY + barHeight);
        ctx.arc(panelX + padding + barWidth - barHeight/2, barY + barHeight/2, barHeight/2, Math.PI/2, -Math.PI/2, true);
        ctx.fill();
    }
    
    // Score labels with improved styling
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = teamColors[TEAMS.RED].base;
    ctx.textAlign = 'left';
    ctx.fillText(`${redScore}`, panelX + padding, barY + barHeight + 15);
    
    ctx.fillStyle = teamColors[TEAMS.BLUE].base;
    ctx.textAlign = 'right';
    ctx.fillText(`${blueScore}`, panelX + panelWidth - padding, barY + barHeight + 15);
    
    // Team sections vertical positions
    const teamSectionY = barY + barHeight + 25;
    const teamRowHeight = 22;
    
    // Draw team logos in a better position
    const logoSize = 16;
    const redLogoX = panelX + padding;
    const blueLogoX = panelX + panelWidth - padding - logoSize;
    const logoY = teamSectionY - 8;
    
    // Team headers
    // Red team header
    ctx.fillStyle = teamColors[TEAMS.RED].base;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`RED TEAM`, panelX + padding + logoSize + 5, teamSectionY);
    
    // Draw red team logo/icon
    drawTeamLogo(ctx, TEAMS.RED, redLogoX, logoY, logoSize);
    
    // Blue team header
    ctx.fillStyle = teamColors[TEAMS.BLUE].base;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`BLUE TEAM`, panelX + panelWidth - padding - logoSize - 5, teamSectionY);
    
    // Draw blue team logo/icon
    drawTeamLogo(ctx, TEAMS.BLUE, blueLogoX, logoY, logoSize);
    
    // Stats area - create a clearer visual separation between team stats
    const redStatsX = panelX + padding;
    const blueStatsX = panelX + panelWidth - padding;
    const statsWidth = (panelWidth - padding * 3) / 2;
    
    // Add subtle background for each team's stats area
    ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
    roundedRect(ctx, redStatsX, teamSectionY + 5, statsWidth, teamRowHeight * 3, 5);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 255, 0.05)';
    roundedRect(ctx, blueStatsX - statsWidth, teamSectionY + 5, statsWidth, teamRowHeight * 3, 5);
    ctx.fill();
    
    // Red team stats with improved typography and icons
    ctx.font = '13px Arial';
    ctx.textAlign = 'left';
    
    // Creatures count with icon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(`🔮 Creatures: ${teamStats[TEAMS.RED].count}`, redStatsX + 5, teamSectionY + teamRowHeight);
    
    // K/B Ratio with icon
    ctx.fillText(`⚔️ K/B: ${teamStats[TEAMS.RED].kills}/${teamStats[TEAMS.RED].births}`, redStatsX + 5, teamSectionY + teamRowHeight * 2);
    
    // Calculate and show ability distribution for red team
    const redAbilityDistribution = getTeamAbilityDistribution(TEAMS.RED);
    const topRedAbility = getTopAbility(redAbilityDistribution);
    if (topRedAbility) {
        const abilityIcon = abilityVisuals[topRedAbility].icon;
        ctx.fillStyle = abilityVisuals[topRedAbility].color;
        ctx.fillText(`${abilityIcon} ${topRedAbility}`, redStatsX + 5, teamSectionY + teamRowHeight * 3);
    }
    
    // Blue team stats
    ctx.textAlign = 'right';
    
    // Creatures count with icon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(`🔮 Creatures: ${teamStats[TEAMS.BLUE].count}`, blueStatsX - 5, teamSectionY + teamRowHeight);
    
    // K/B Ratio with icon
    ctx.fillText(`⚔️ K/B: ${teamStats[TEAMS.BLUE].kills}/${teamStats[TEAMS.BLUE].births}`, blueStatsX - 5, teamSectionY + teamRowHeight * 2);
    
    // Calculate and show ability distribution for blue team
    const blueAbilityDistribution = getTeamAbilityDistribution(TEAMS.BLUE);
    const topBlueAbility = getTopAbility(blueAbilityDistribution);
    if (topBlueAbility) {
        const abilityIcon = abilityVisuals[topBlueAbility].icon;
        ctx.fillStyle = abilityVisuals[topBlueAbility].color;
        ctx.fillText(`${abilityIcon} ${topBlueAbility}`, blueStatsX - 5, teamSectionY + teamRowHeight * 3);
    }
    
    // Environment factors display - moved up from bottom
    ctx.fillStyle = 'rgba(200, 200, 255, 0.8)';
    ctx.font = 'italic 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Environment: ${Math.floor(environment.competitionLevel * 100)}% competition`, 
                panelX + panelWidth/2, panelY + panelHeight - padding);
    
    // Note: Removed the tooltip text at the bottom
    
    ctx.restore();
}

// Export UI functions
window.checkTooltipHover = checkTooltipHover;
window.drawTooltip = drawTooltip;
window.drawTeamStats = drawTeamStats; 