// Draw team stats with improved design
function drawTeamStats() {
    if (!settings.showTeamScores) return;
    
    ctx.save();
    
    // Get canvas dimensions for responsive positioning
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Panel dimensions and positioning
    const panelWidth = Math.min(320, canvasWidth * 0.25);
    const panelHeight = 190; // Increased height to accommodate the enhanced score display
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
    const barHeight = 12; // Slightly taller bar
    const barY = panelY + padding * 2 + 20;
    const barWidth = panelWidth - padding * 2;
    
    // Background with better contrast
    ctx.fillStyle = 'rgba(20, 20, 40, 0.4)';
    roundedRect(ctx, panelX + padding, barY, barWidth, barHeight, barHeight/2);
    ctx.fill();
    
    // Add subtle border to the background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    roundedRect(ctx, panelX + padding, barY, barWidth, barHeight, barHeight/2);
    ctx.stroke();
    
    // Calculate proportional widths for a single bar
    const redProportion = redScore / totalScore;
    const redWidth = Math.max(Math.min(barWidth * redProportion, barWidth), 5);
    
    // Create clipping region for rounded corners on progress bar
    ctx.save();
    roundedRect(ctx, panelX + padding, barY, barWidth, barHeight, barHeight/2);
    ctx.clip();
    
    // Draw the blue background first (full width)
    ctx.fillStyle = teamColors[TEAMS.BLUE].base;
    ctx.fillRect(panelX + padding, barY, barWidth, barHeight);
    
    // Add glowing effect to blue side
    const blueGradient = ctx.createLinearGradient(
        panelX + padding, 
        barY, 
        panelX + padding + barWidth, 
        barY + barHeight
    );
    blueGradient.addColorStop(0, 'rgba(100, 100, 255, 0.7)');
    blueGradient.addColorStop(1, 'rgba(0, 0, 255, 0.5)');
    ctx.fillStyle = blueGradient;
    ctx.fillRect(panelX + padding, barY, barWidth, barHeight/2);
    
    // Then overlay the red part on top (from left)
    if (redProportion > 0) {
        ctx.fillStyle = teamColors[TEAMS.RED].base;
        ctx.fillRect(panelX + padding, barY, redWidth, barHeight);
        
        // Add glowing effect to red side
        const redGradient = ctx.createLinearGradient(
            panelX + padding, 
            barY, 
            panelX + padding + redWidth, 
            barY + barHeight
        );
        redGradient.addColorStop(0, 'rgba(255, 100, 100, 0.7)');
        redGradient.addColorStop(1, 'rgba(255, 0, 0, 0.5)');
        ctx.fillStyle = redGradient;
        ctx.fillRect(panelX + padding, barY, redWidth, barHeight/2);
    }
    
    // Draw dividing line where red meets blue (if red has any width)
    if (redProportion > 0 && redProportion < 1) {
        const dividerX = panelX + padding + redWidth;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(dividerX - 1, barY, 2, barHeight);
    }
    
    ctx.restore(); // Remove clipping region
    
    // Score labels with improved styling and better positioning
    ctx.font = 'bold 16px Arial'; // Larger font
    
    // Add score boxes for better visibility
    // Red score box
    const scoreBoxHeight = 20;
    const scoreBoxPadding = 8;
    
    // Draw red score with better visibility
    ctx.fillStyle = 'rgba(30, 30, 50, 0.7)';
    roundedRect(ctx, panelX + padding, barY + barHeight + 5, 40, scoreBoxHeight, 5);
    ctx.fill();
    ctx.strokeStyle = teamColors[TEAMS.RED].base;
    ctx.lineWidth = 1.5;
    roundedRect(ctx, panelX + padding, barY + barHeight + 5, 40, scoreBoxHeight, 5);
    ctx.stroke();
    
    // Draw red score text
    ctx.fillStyle = teamColors[TEAMS.RED].base;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${redScore}`, panelX + padding + 20, barY + barHeight + 15);
    
    // Draw blue score with better visibility
    ctx.fillStyle = 'rgba(30, 30, 50, 0.7)';
    roundedRect(ctx, panelX + panelWidth - padding - 40, barY + barHeight + 5, 40, scoreBoxHeight, 5);
    ctx.fill();
    ctx.strokeStyle = teamColors[TEAMS.BLUE].base;
    ctx.lineWidth = 1.5;
    roundedRect(ctx, panelX + panelWidth - padding - 40, barY + barHeight + 5, 40, scoreBoxHeight, 5);
    ctx.stroke();
    
    // Draw blue score text
    ctx.fillStyle = teamColors[TEAMS.BLUE].base;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${blueScore}`, panelX + panelWidth - padding - 20, barY + barHeight + 15);
    
    // Team sections vertical positions - adjusted for new score display
    const teamSectionY = barY + barHeight + 35; // Moved down to accommodate score boxes
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
window.drawTeamStats = drawTeamStats; 