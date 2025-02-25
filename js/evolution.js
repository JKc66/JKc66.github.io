// Evolve the population
function evolvePopulation() {
    if (!settings.geneticEnabled || creatures.length < 10) return;
    
    // Mark the start of a new generation
    generation++;
    
    // Process each team separately
    [TEAMS.RED, TEAMS.BLUE].forEach(team => {
        // Get living team members
        const teamMembers = creatures.filter(c => c.team === team && !c.deceased);
        if (teamMembers.length < 4) return; // Skip if too few members
        
        // Sort by fitness
        teamMembers.sort((a, b) => b.fitness - a.fitness);
        
        // Calculate how many creatures to keep as parents
        const parentCount = Math.max(3, Math.floor(teamMembers.length * settings.selectionPercentage));
        const parents = teamMembers.slice(0, parentCount);
        
        // Mark the top 2 as elite
        for (let i = 0; i < Math.min(2, parents.length); i++) {
            parents[i].isElite = true;
        }
        
        // Replace some of the worst performers
        const replacementCount = Math.floor(teamMembers.length * 0.15); // Replace 15%
        
        for (let i = 0; i < replacementCount; i++) {
            // Select two parents
            const parent1 = selectParent(parents);
            const parent2 = selectParent(parents);
            
            // Create a child
            const child = new Creature(null, null, team, parent1, parent2);
            
            // Replace worst member
            const worst = teamMembers[teamMembers.length - 1 - i];
            if (worst) {
                const index = creatures.indexOf(worst);
                if (index !== -1) {
                    creatures[index] = child;
                } else {
                    creatures.push(child);
                }
            } else {
                creatures.push(child);
            }
        }
    });
}

// Select a parent based on fitness (higher fitness = higher chance)
function selectParent(parents) {
    // Tournament selection
    const tournamentSize = Math.min(3, parents.length);
    let best = parents[Math.floor(Math.random() * parents.length)];
    
    for (let i = 0; i < tournamentSize - 1; i++) {
        const contender = parents[Math.floor(Math.random() * parents.length)];
        if (contender.fitness > best.fitness) {
            best = contender;
        }
    }
    
    return best;
}

// Initialize creatures and simulation
function init() {
    // Reset team stats
    teamStats = {
        [TEAMS.RED]: { count: 0, kills: 0, births: 0, score: 0 },
        [TEAMS.BLUE]: { count: 0, kills: 0, births: 0, score: 0 }
    };
    
    // Create initial creatures
    for (let i = 0; i < settings.initialCreatureCount; i++) {
        // Distribute teams evenly across the canvas
        let team;
        if (i < settings.initialCreatureCount / 2) {
            team = TEAMS.RED;
        } else {
            team = TEAMS.BLUE;
        }
        
        // Position creatures on their side of the canvas
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

// Export evolution functions
window.evolvePopulation = evolvePopulation;
window.selectParent = selectParent;
window.init = init; 