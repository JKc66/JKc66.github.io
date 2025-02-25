// Animation loop
function animate() {
    // Apply a semi-transparent clear for trail effect
    const trailOpacity = settings.trailEffect ? 0.1 : 1.0;
    ctx.fillStyle = `rgba(15, 12, 41, ${trailOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update genetic evolution
    evolutionTimer++;
    if (evolutionTimer > 500 && Math.random() < settings.evolutionRate * 5) { // Evolve periodically
        evolvePopulation();
        evolutionTimer = 0;
    }
    
    // Update creatures
    for (let i = 0; i < creatures.length; i++) {
        creatures[i].update(creatures);
    }
    
    // Remove deceased creatures and add new ones if needed
    for (let i = creatures.length - 1; i >= 0; i--) {
        if (creatures[i].deceased) {
            creatures.splice(i, 1);
        }
    }
    
    // Ensure minimum population for each team
    const minTeamSize = Math.max(5, settings.initialCreatureCount / 4);
    [TEAMS.RED, TEAMS.BLUE].forEach(team => {
        const teamCount = creatures.filter(c => c.team === team && !c.deceased).length;
        
        if (teamCount < minTeamSize) {
            const needToAdd = Math.min(3, minTeamSize - teamCount);
            for (let i = 0; i < needToAdd; i++) {
                let x, y;
                if (team === TEAMS.RED) {
                    x = Math.random() * (canvas.width / 3) + 50;
                } else {
                    x = canvas.width - Math.random() * (canvas.width / 3) - 50;
                }
                y = Math.random() * (canvas.height - 100) + 50;
                
                creatures.push(new Creature(x, y, team));
            }
        }
    });
    
    // Process healing between creatures
    creatures.forEach(creature => {
        if (creature.abilities[ABILITIES.HEAL] && !creature.deceased) {
            // Find nearby injured allies
            const injuredAlly = creatures.find(ally => 
                ally !== creature && 
                ally.team === creature.team && 
                !ally.deceased &&
                ally.health < 0.7 && 
                Math.hypot(ally.x - creature.x, ally.y - creature.y) < settings.interactionRadius * 0.7
            );
            
            if (injuredAlly) {
                creature.heal(injuredAlly);
            }
        }
    });
    
    // Draw creatures
    creatures.sort((a, b) => {
        // Draw deceased creatures first, then by size
        if (a.deceased !== b.deceased) return a.deceased ? -1 : 1;
        return a.size - b.size;
    }).forEach(creature => creature.draw());
    
    // Update and draw effects
    updateEnergyEffects();
    updateHealEffects();
    
    // Draw team stats
    drawTeamStats();

    
    requestAnimationFrame(animate);
}

// Initialize and start animation
init();
animate(); 