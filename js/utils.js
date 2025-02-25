// Helper function to draw rounded rectangles
function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

// Function to draw team logo/icon
function drawTeamLogo(ctx, team, x, y, size) {
    ctx.save();
    
    if (team === TEAMS.RED) {
        // Draw red team logo (flame/fire shape)
        ctx.fillStyle = teamColors[team].base;
        ctx.beginPath();
        
        // Flame shape
        ctx.moveTo(x, y + size);
        ctx.bezierCurveTo(
            x - size/2, y + size/2,
            x - size/3, y,
            x, y
        );
        ctx.bezierCurveTo(
            x + size/3, y + size/3,
            x + size/2, y,
            x + size, y + size/2
        );
        ctx.bezierCurveTo(
            x + size/2, y + size,
            x + size/3, y + size*0.8,
            x, y + size
        );
        
        ctx.fill();
    } else {
        // Draw blue team logo (shield/defense shape)
        ctx.fillStyle = teamColors[team].base;
        ctx.beginPath();
        
        // Shield shape
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size, y + size*0.6);
        ctx.bezierCurveTo(
            x + size*0.8, y + size*0.8,
            x + size*0.5, y + size,
            x + size*0.5, y + size
        );
        ctx.bezierCurveTo(
            x + size*0.5, y + size,
            x + size*0.2, y + size*0.8,
            x, y + size*0.6
        );
        ctx.closePath();
        
        ctx.fill();
    }
    
    ctx.restore();
}

// Function to calculate ability distribution for a team
function getTeamAbilityDistribution(team) {
    const teamCreatures = creatures.filter(c => c.team === team && !c.deceased);
    const distribution = {};
    
    // Initialize all abilities with zero count
    Object.values(ABILITIES).forEach(ability => {
        distribution[ability] = 0;
    });
    
    // Count abilities
    teamCreatures.forEach(creature => {
        Object.keys(creature.abilities).forEach(ability => {
            if (creature.abilities[ability]) {
                distribution[ability] = (distribution[ability] || 0) + 1;
            }
        });
    });
    
    return distribution;
}

// Function to get the most common ability in a distribution
function getTopAbility(distribution) {
    let topAbility = null;
    let maxCount = 0;
    
    Object.entries(distribution).forEach(([ability, count]) => {
        if (count > maxCount) {
            maxCount = count;
            topAbility = ability;
        }
    });
    
    return topAbility;
}

// Export functions
window.roundedRect = roundedRect;
window.drawTeamLogo = drawTeamLogo;
window.getTeamAbilityDistribution = getTeamAbilityDistribution;
window.getTopAbility = getTopAbility; 