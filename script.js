// Get the canvas element and its context
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Call resize on initial load and whenever window is resized
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Mouse/Touch position
const pointer = {
    x: null,
    y: null,
    radius: 150,
    active: false  // Track if pointer is currently active
};

// Check if device is mobile
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.matchMedia("(max-width: 768px)").matches);
};

// Team definitions
const TEAMS = {
    RED: 'red',
    BLUE: 'blue'
};

// Ability types
const ABILITIES = {
    SPEED: 'speed',
    STRENGTH: 'strength',
    RANGE: 'range',
    SHIELD: 'shield',
    HEAL: 'heal',
    REPRODUCE: 'reproduce'
};

// Settings based on device
const settings = {
    initialCreatureCount: isMobileDevice() ? 30 : 60,
    maxCreatures: isMobileDevice() ? 60 : 120,
    creatureBaseSize: isMobileDevice() ? 4 : 6,
    creatureMaxSpeed: 3,
    creatureBaseSpeed: isMobileDevice() ? 0.6 : 0.9,
    visionRadius: isMobileDevice() ? 100 : 150,
    interactionRadius: isMobileDevice() ? 80 : 120,
    glowEffect: true,
    trailEffect: true,
    trailLength: isMobileDevice() ? 2 : 4,
    
    // Team balance
    teamRatio: 0.5, // 50% red, 50% blue
    
    // Genetic algorithm settings
    geneticEnabled: true,
    evolutionRate: 0.01,          // How often evolution occurs (0-1)
    mutationRate: 0.2,            // Chance of mutation during reproduction (0-1)
    mutationAmount: 0.3,          // How much a mutation can change a property (0-1)
    selectionPercentage: 0.3,     // Top percentage of creatures to select as parents
    maxLifespan: 1500,            // Maximum ticks a creature can live
    fitnessDecay: 0.9995,         // How much fitness decays each frame to prevent stagnation
    
    // Combat settings
    combatEnabled: true,
    damageAmount: 0.8,            // Base damage amount on hit
    healAmount: 0.3,              // Base healing amount
    energyGainRate: 0.02,         // Energy gain per frame
    energyCostAttack: 0.5,        // Energy cost to attack
    energyCostSpecial: 0.8,       // Energy cost to use special ability
    
    // Display settings
    showStats: true,              // Show team stats
    showTeamScores: true,         // Show team scores
    showAbilities: true           // Show creature abilities
};

// Update pointer radius based on device
pointer.radius = settings.interactionRadius;

// Color definitions for teams
const teamColors = {
    [TEAMS.RED]: {
        base: '#FF3A3A',         // Base color
        glow: '#FF6B6B',         // Glow color
        trail: '#FF9999',        // Trail color
        elite: '#FFD700',        // Elite color (gold)
        shield: 'rgba(255, 100, 100, 0.3)',  // Shield color
        dead: '#8B0000'          // Dead color (dark red)
    },
    [TEAMS.BLUE]: {
        base: '#3A3AFF',         // Base color
        glow: '#6B6BFF',         // Glow color
        trail: '#9999FF',        // Trail color
        elite: '#00FFFF',        // Elite color (cyan)
        shield: 'rgba(100, 100, 255, 0.3)',  // Shield color
        dead: '#00008B'          // Dead color (dark blue)
    }
};

// Ability colors and icons
const abilityVisuals = {
    [ABILITIES.SPEED]: { color: '#FFFF00', icon: '⚡' },
    [ABILITIES.STRENGTH]: { color: '#FF4500', icon: '💪' },
    [ABILITIES.RANGE]: { color: '#9400D3', icon: '🔭' },
    [ABILITIES.SHIELD]: { color: '#00FFFF', icon: '🛡️' },
    [ABILITIES.HEAL]: { color: '#32CD32', icon: '❤️' },
    [ABILITIES.REPRODUCE]: { color: '#FF69B4', icon: '🧬' }
};

// Generation counter for the genetic algorithm
let generation = 1;
let evolutionTimer = 0;
let teamStats = {
    [TEAMS.RED]: { count: 0, kills: 0, births: 0, score: 0 },
    [TEAMS.BLUE]: { count: 0, kills: 0, births: 0, score: 0 }
};

// Update pointer position on mouse move
window.addEventListener('mousemove', function(event) {
    pointer.x = event.x;
    pointer.y = event.y;
    pointer.active = true;
});

// Add touch support
window.addEventListener('touchstart', function(event) {
    event.preventDefault();
    pointer.x = event.touches[0].clientX;
    pointer.y = event.touches[0].clientY;
    pointer.active = true;
});

window.addEventListener('touchmove', function(event) {
    event.preventDefault();
    pointer.x = event.touches[0].clientX;
    pointer.y = event.touches[0].clientY;
});

window.addEventListener('touchend', function() {
    pointer.active = false;
    // Don't reset coordinates to allow creatures to continue moving away
});

// Reset pointer active state when mouse leaves window
window.addEventListener('mouseleave', function() {
    pointer.active = false;
});

// Handle click/tap to add energy to nearby creatures of the dominating team
window.addEventListener('click', boostNearbyCreatures);
window.addEventListener('touchend', boostNearbyCreatures);

// Function to boost nearby creatures
function boostNearbyCreatures(event) {
    if (!pointer.x || !pointer.y) return;
    
    // Determine which team is currently dominating
    const redScore = teamStats[TEAMS.RED].score;
    const blueScore = teamStats[TEAMS.BLUE].score;
    const dominantTeam = redScore < blueScore ? TEAMS.BLUE : TEAMS.RED;
    
    // Boost creatures of the non-dominant team to balance the game
    const teamToBoost = redScore >= blueScore ? TEAMS.RED : TEAMS.BLUE;
    
    // Find nearby creatures of the team to boost
    let nearbyCreatures = creatures.filter(c => 
        c.team === teamToBoost && 
        Math.hypot(c.x - pointer.x, c.y - pointer.y) < settings.interactionRadius
    );
    
    // Boost them
    nearbyCreatures.forEach(creature => {
        creature.energy = Math.min(1, creature.energy + 0.5);
        creature.health = Math.min(1, creature.health + 0.2);
        
        // Create a visual effect for the boost
        createEnergyEffect(creature.x, creature.y, teamColors[teamToBoost].base);
    });
}

// Function to create energy boost visual effect
function createEnergyEffect(x, y, color) {
    // Create particles that expand outward
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const particle = {
            x: x,
            y: y,
            radius: 2,
            color: color,
            vx: Math.cos(angle) * 2,
            vy: Math.sin(angle) * 2,
            life: 20
        };
        
        energyEffects.push(particle);
    }
}

// Store energy effects
const energyEffects = [];

// Update and draw energy effects
function updateEnergyEffects() {
    for (let i = energyEffects.length - 1; i >= 0; i--) {
        const effect = energyEffects[i];
        
        // Update position
        effect.x += effect.vx;
        effect.y += effect.vy;
        
        // Reduce life
        effect.life--;
        
        // Remove if dead
        if (effect.life <= 0) {
            energyEffects.splice(i, 1);
            continue;
        }
        
        // Draw effect
        ctx.globalAlpha = effect.life / 20;
        ctx.fillStyle = effect.color;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Creature class for our advanced genetic entities
class Creature {
    constructor(x, y, team, parent1, parent2) {
        // Team assignment
        this.team = team || (Math.random() < settings.teamRatio ? TEAMS.RED : TEAMS.BLUE);
        
        // Combat stats
        this.health = 1.0;  // Full health (0-1)
        this.energy = 0.5;  // Starting energy (0-1)
        this.damage = 0.1;  // Base damage
        
        // Genetic algorithm properties
        this.fitness = 0;
        this.kills = 0;
        this.age = 0;
        this.generation = generation;
        this.isElite = false;
        this.deceased = false;  // Track if creature is dead
        this.victoryPoints = 0; // Points earned for team
        
        // Track interactions
        this.lastAttackTime = 0;
        this.lastSpecialTime = 0;
        this.target = null;
        
        // Abilities - each creature can have primary and secondary abilities
        this.abilities = {};
        this.abilityLevels = {};
        
        // If we have parents, inherit properties (genetic reproduction)
        if (parent1 && parent2 && settings.geneticEnabled) {
            // Inherit position from either parent with some randomness
            this.x = (Math.random() < 0.5 ? parent1.x : parent2.x) + (Math.random() * 60 - 30);
            this.y = (Math.random() < 0.5 ? parent1.y : parent2.y) + (Math.random() * 60 - 30);
            
            // Inherit combat stats with mutation
            this.damage = this.inheritWithMutation(parent1.damage, parent2.damage, 0.05, 0.3);
            
            // Inherit from either parent with potential mutation
            this.baseSize = this.inheritWithMutation(parent1.baseSize, parent2.baseSize, settings.creatureBaseSize * 0.5, settings.creatureBaseSize * 1.5);
            
            // Inherit speed genes with mutation
            const speedMultiplier = this.inheritWithMutation(
                parent1.speedMultiplier || 1, 
                parent2.speedMultiplier || 1, 
                0.7, 1.5
            );
            this.speedX = (Math.random() * 2 - 1) * settings.creatureBaseSpeed * speedMultiplier;
            this.speedY = (Math.random() * 2 - 1) * settings.creatureBaseSpeed * speedMultiplier;
            
            // Inherit trail length
            this.trailLength = Math.floor(this.inheritWithMutation(
                parent1.trailLength, parent2.trailLength, 1, settings.trailLength * 2
            ));
            
            // Inherit lifespan with mutation
            this.lifespan = this.inheritWithMutation(
                parent1.lifespan, parent2.lifespan, 
                settings.maxLifespan * 0.5, settings.maxLifespan * 1.5
            );
            
            // Inherit abilities from parents with mutation
            this.inheritAbilities(parent1, parent2);
            
            // Store the speed multiplier for future inheritance
            this.speedMultiplier = speedMultiplier;
        } else {
            // Random initialization for first generation
            this.x = x !== undefined ? x : Math.random() * canvas.width;
            this.y = y !== undefined ? y : Math.random() * canvas.height;
            this.baseSize = Math.random() * settings.creatureBaseSize + 2;
            this.speedX = (Math.random() * 2 - 1) * settings.creatureBaseSpeed;
            this.speedY = (Math.random() * 2 - 1) * settings.creatureBaseSpeed;
            this.trailLength = Math.floor(Math.random() * settings.trailLength) + 1;
            this.speedMultiplier = 1;
            this.lifespan = Math.random() * settings.maxLifespan + settings.maxLifespan / 2;
            
            // Randomly assign initial abilities
            this.randomizeAbilities();
        }
        
        this.size = this.baseSize;
        
        // For trail effect
        this.trail = [];
        
        // Add slight oscillation/pulsing
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = Math.random() * 0.04 + 0.01;
        this.glowSize = 0;
        
        // Increment team count
        teamStats[this.team].count++;
        
        // If born from parents, count as birth
        if (parent1 && parent2) {
            teamStats[this.team].births++;
        }
    }
    
    // Randomize initial abilities for new creatures
    randomizeAbilities() {
        // List of all possible abilities
        const allAbilities = Object.values(ABILITIES);
        
        // Assign 1-2 random abilities
        const numAbilities = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < numAbilities; i++) {
            const ability = allAbilities[Math.floor(Math.random() * allAbilities.length)];
            this.abilities[ability] = true;
            this.abilityLevels[ability] = Math.random() * 0.5 + 0.5; // 0.5-1.0 level
        }
    }
    
    // Inherit abilities from parents
    inheritAbilities(parent1, parent2) {
        // Get all unique abilities from both parents
        const parentAbilities = [...new Set([
            ...Object.keys(parent1.abilities).filter(a => parent1.abilities[a]),
            ...Object.keys(parent2.abilities).filter(a => parent2.abilities[a])
        ])];
        
        if (parentAbilities.length === 0) {
            // If parents have no abilities, randomize
            this.randomizeAbilities();
            return;
        }
        
        // Inherit 1-2 abilities from parents
        const numAbilities = Math.min(parentAbilities.length, Math.floor(Math.random() * 2) + 1);
        
        // Shuffle parent abilities to pick random ones
        for (let i = parentAbilities.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [parentAbilities[i], parentAbilities[j]] = [parentAbilities[j], parentAbilities[i]];
        }
        
        // Take the first numAbilities from shuffled array
        for (let i = 0; i < numAbilities; i++) {
            const ability = parentAbilities[i];
            this.abilities[ability] = true;
            
            // Inherit ability level with potential improvement
            const parentLevel = Math.max(
                parent1.abilityLevels[ability] || 0,
                parent2.abilityLevels[ability] || 0
            );
            
            // Potentially improve ability through mutation
            if (Math.random() < settings.mutationRate) {
                this.abilityLevels[ability] = Math.min(1.0, parentLevel + Math.random() * 0.2);
            } else {
                this.abilityLevels[ability] = parentLevel;
            }
        }
        
        // Chance to gain a completely new ability through mutation
        if (Math.random() < settings.mutationRate * 0.5 && Object.keys(this.abilities).length < 3) {
            const allAbilities = Object.values(ABILITIES);
            const newAbility = allAbilities[Math.floor(Math.random() * allAbilities.length)];
            if (!this.abilities[newAbility]) {
                this.abilities[newAbility] = true;
                this.abilityLevels[newAbility] = Math.random() * 0.5 + 0.3; // Start at lower level
            }
        }
    }
    
    // Helper method for genetic property inheritance with mutation
    inheritWithMutation(value1, value2, min, max) {
        // Choose one of the parent's values
        let value = Math.random() < 0.5 ? value1 : value2;
        
        // Apply mutation based on mutation rate
        if (Math.random() < settings.mutationRate) {
            value += (Math.random() * 2 - 1) * settings.mutationAmount * value;
        }
        
        // Ensure the value stays within reasonable bounds
        return Math.max(min, Math.min(max, value));
    }
    
    // Update creature position and handle interactions
    update(creatures) {
        // Skip update if deceased
        if (this.deceased) return false;
        
        // Increase age
        this.age++;
        
        // Apply fitness decay to prevent immortal creatures
        this.fitness *= settings.fitnessDecay;
        
        // Gain energy over time
        this.energy = Math.min(1.0, this.energy + settings.energyGainRate);
        
        // Speed boost from ability
        const speedMultiplier = this.abilities[ABILITIES.SPEED] ? 
                               1 + (this.abilityLevels[ABILITIES.SPEED] * 0.5) : 1;
        
        // Store previous position for trail
        if (settings.trailEffect) {
            this.trail.unshift({ x: this.x, y: this.y, size: this.size });
            if (this.trail.length > this.trailLength) {
                this.trail.pop();
            }
        }
        
        // Find nearest enemy and ally
        const nearestEnemy = this.findNearestEnemy(creatures);
        const nearestAlly = this.findNearestAlly(creatures);
        
        // Decide action based on health and surrounding creatures
        if (this.health < 0.3 && nearestAlly && this.abilities[ABILITIES.HEAL]) {
            // If low health and have heal ability, seek allies
            this.moveTowards(nearestAlly.x, nearestAlly.y, speedMultiplier);
        } else if (nearestEnemy) {
            // Target acquired, attack behavior
            const distanceToEnemy = Math.hypot(nearestEnemy.x - this.x, nearestEnemy.y - this.y);
            
            // Decide whether to engage or retreat based on health and enemy's health
            if (this.health > nearestEnemy.health * 0.8 || this.health > 0.7) {
                // Engage enemy
                this.target = nearestEnemy;
                
                const attackRange = this.abilities[ABILITIES.RANGE] ? 
                                   settings.interactionRadius * (1 + this.abilityLevels[ABILITIES.RANGE] * 0.5) : 
                                   settings.interactionRadius * 0.7;
                
                if (distanceToEnemy < attackRange) {
                    // Within attack range, try to attack
                    this.attack(nearestEnemy);
                } else {
                    // Move towards enemy
                    this.moveTowards(nearestEnemy.x, nearestEnemy.y, speedMultiplier);
                }
            } else {
                // Retreat from enemy
                this.moveAway(nearestEnemy.x, nearestEnemy.y, speedMultiplier);
            }
        } else {
            // No enemies nearby, explore or move to center if near edge
            if (this.isNearEdge()) {
                this.moveTowards(canvas.width / 2, canvas.height / 2, speedMultiplier);
            } else {
                // Random movement with slight wander
                this.speedX += (Math.random() * 2 - 1) * 0.05;
                this.speedY += (Math.random() * 2 - 1) * 0.05;
            }
        }
        
        // Update position
        this.x += this.speedX * speedMultiplier;
        this.y += this.speedY * speedMultiplier;
        
        // Gradually slow down creatures
        this.speedX *= 0.98;
        this.speedY *= 0.98;

        // Slight oscillation effect
        this.size = this.baseSize + Math.sin(this.angle) * 0.5;
        this.angle += this.angleSpeed;

        // Boundary checks with bounce
        if (this.x + this.size > canvas.width || this.x - this.size < 0) {
            this.speedX = -this.speedX * 0.9;
            this.fitness -= 0.2; // Penalty for hitting walls
            
            // Fix position if outside boundary
            if (this.x + this.size > canvas.width) {
                this.x = canvas.width - this.size;
            } else if (this.x - this.size < 0) {
                this.x = this.size;
            }
        }
        
        if (this.y + this.size > canvas.height || this.y - this.size < 0) {
            this.speedY = -this.speedY * 0.9;
            this.fitness -= 0.2; // Penalty for hitting walls
            
            // Fix position if outside boundary
            if (this.y + this.size > canvas.height) {
                this.y = canvas.height - this.size;
            } else if (this.y - this.size < 0) {
                this.y = this.size;
            }
        }

        // Pointer interaction
        if (pointer.x !== null && pointer.y !== null) {
            const dx = pointer.x - this.x;
            const dy = pointer.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
            if (distance < pointer.radius) {
                // Creature is within pointer radius
                this.fitness += 0.05; // Small reward for interacting with pointer
                
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
                const force = (pointer.radius - distance) / pointer.radius;
                const repelForce = pointer.active ? -0.8 : 0.3; // Repel when active, gently attract when inactive
            
            // Calculate movement based on force
                this.speedX += forceDirectionX * force * 0.4 * repelForce;
                this.speedY += forceDirectionY * force * 0.4 * repelForce;
            
            // Limit speed
                this.limitSpeed();
                
                // Increase size when near pointer
                this.size = this.baseSize + (force * 2);
                
                // Increase glow effect
                this.glowSize = force * 5;
            } else {
                // Return to original size
                if (this.size > this.baseSize) {
                    this.size -= 0.1;
                }
                
                // Reduce glow effect
                if (this.glowSize > 0) {
                    this.glowSize -= 0.1;
                }
            }
        } else {
            // Return to original size when no pointer
            if (this.size > this.baseSize) {
                this.size -= 0.1;
            }
            
            // Reduce glow effect
            if (this.glowSize > 0) {
                this.glowSize -= 0.1;
            }
        }
        
        // Special ability: Reproduction
        if (this.abilities[ABILITIES.REPRODUCE] && 
            Math.random() < 0.001 * this.abilityLevels[ABILITIES.REPRODUCE] && 
            creatures.length < settings.maxCreatures) {
            this.reproduce(creatures);
        }
        
        // Die if health reaches 0 or age exceeds lifespan
        if (this.health <= 0 || this.age >= this.lifespan) {
            this.deceased = true;
            teamStats[this.team].count--;
            return false;
        }
        
        return true;
    }
    
    // Find the nearest enemy creature
    findNearestEnemy(creatures) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const creature of creatures) {
            if (creature.team !== this.team && !creature.deceased) {
                const distance = Math.hypot(creature.x - this.x, creature.y - this.y);
                if (distance < settings.visionRadius && distance < minDistance) {
                    nearest = creature;
                    minDistance = distance;
                }
            }
        }
        
        return nearest;
    }
    
    // Find the nearest ally creature
    findNearestAlly(creatures) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const creature of creatures) {
            if (creature !== this && creature.team === this.team && !creature.deceased) {
                const distance = Math.hypot(creature.x - this.x, creature.y - this.y);
                if (distance < settings.visionRadius && distance < minDistance) {
                    nearest = creature;
                    minDistance = distance;
                }
            }
        }
        
        return nearest;
    }
    
    // Move towards a point
    moveTowards(targetX, targetY, speedMultiplier) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 0) {
            this.speedX += (dx / distance) * 0.1 * speedMultiplier;
            this.speedY += (dy / distance) * 0.1 * speedMultiplier;
            this.limitSpeed();
        }
    }
    
    // Move away from a point
    moveAway(targetX, targetY, speedMultiplier) {
        const dx = this.x - targetX;
        const dy = this.y - targetY;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 0) {
            this.speedX += (dx / distance) * 0.15 * speedMultiplier;
            this.speedY += (dy / distance) * 0.15 * speedMultiplier;
            this.limitSpeed();
        }
    }
    
    // Limit speed to maximum
    limitSpeed() {
        const speed = Math.hypot(this.speedX, this.speedY);
        if (speed > settings.creatureMaxSpeed) {
            this.speedX = (this.speedX / speed) * settings.creatureMaxSpeed;
            this.speedY = (this.speedY / speed) * settings.creatureMaxSpeed;
        }
    }
    
    // Check if creature is near the edge of the canvas
    isNearEdge() {
        const margin = 50;
        return (
            this.x < margin || 
            this.x > canvas.width - margin || 
            this.y < margin || 
            this.y > canvas.height - margin
        );
    }
    
    // Attack another creature
    attack(target) {
        // Check if enough energy and cooldown elapsed
        if (this.energy < settings.energyCostAttack || 
            this.age - this.lastAttackTime < 20) {
            return;
        }
        
        // Consume energy
        this.energy -= settings.energyCostAttack;
        this.lastAttackTime = this.age;
        
        // Calculate damage based on strength ability
        let damageAmount = this.damage * settings.damageAmount;
        if (this.abilities[ABILITIES.STRENGTH]) {
            damageAmount *= (1 + this.abilityLevels[ABILITIES.STRENGTH]);
        }
        
        // Check if target has shield ability
        if (target.abilities[ABILITIES.SHIELD] && target.energy > 0.2) {
            // Shield reduces damage based on ability level
            damageAmount *= (1 - target.abilityLevels[ABILITIES.SHIELD] * 0.5);
            target.energy -= 0.2; // Shield consumes energy
            
            // Visual effect for shield activation
            target.glowSize = 8;
        }
        
        // Apply damage
        target.health -= damageAmount;
        
        // Fitness and stats update
        this.fitness += 1.0;
        
        // If target dies, count as kill
        if (target.health <= 0) {
            this.kills++;
            this.fitness += 5.0;
            this.victoryPoints += 10;
            teamStats[this.team].kills++;
            teamStats[this.team].score += 10;
        }
        
        // Create attack visual effect
        this.createAttackEffect(target, damageAmount);
    }
    
    // Special ability: Healing
    heal(ally) {
        if (!this.abilities[ABILITIES.HEAL] || 
            this.energy < settings.energyCostSpecial || 
            this.age - this.lastSpecialTime < 30) {
            return;
        }
        
        // Consume energy
        this.energy -= settings.energyCostSpecial;
        this.lastSpecialTime = this.age;
        
        // Calculate healing amount based on ability level
        const healAmount = settings.healAmount * this.abilityLevels[ABILITIES.HEAL];
        
        // Apply healing
        ally.health = Math.min(1.0, ally.health + healAmount);
        
        // Fitness update
        this.fitness += 2.0;
        this.victoryPoints += 2;
        teamStats[this.team].score += 2;
        
        // Create heal visual effect
        this.createHealEffect(ally);
    }
    
    // Special ability: Reproduction
    reproduce(creatures) {
        if (creatures.length >= settings.maxCreatures || this.energy < 0.7) {
            return;
        }
        
        // Find nearby ally with good fitness
        const allies = creatures.filter(c => 
            c.team === this.team && 
            c !== this && 
            !c.deceased && 
            c.health > 0.5 &&
            Math.hypot(c.x - this.x, c.y - this.y) < settings.interactionRadius
        );
        
        if (allies.length > 0) {
            // Sort by fitness and pick the best ally
            allies.sort((a, b) => b.fitness - a.fitness);
            const partner = allies[0];
            
            // Create offspring
            const child = new Creature(this.x, this.y, this.team, this, partner);
            creatures.push(child);
            
            // Consume energy
            this.energy *= 0.7;
            
            // Fitness reward
            this.fitness += 3.0;
            this.victoryPoints += 5;
            teamStats[this.team].score += 5;
            
            // Create reproduction visual effect
            this.createReproductionEffect(partner, child);
        }
    }
    
    // Create attack visual effect
    createAttackEffect(target, damageAmount) {
        // Draw line from attacker to target
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = this.team === TEAMS.RED ? 'rgba(255,0,0,0.6)' : 'rgba(0,0,255,0.6)';
        ctx.lineWidth = damageAmount * 8;
        ctx.stroke();
        
        // Flash target
        target.glowSize = 5;
    }
    
    // Create heal visual effect
    createHealEffect(target) {
        // Draw healing aura
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,255,0,0.3)';
        ctx.fill();
        
        // Particles moving from healer to target
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = {
                x: this.x,
                y: this.y,
                targetX: target.x,
                targetY: target.y,
                progress: 0,
                speed: 0.05 + Math.random() * 0.05,
                color: '#32CD32'
            };
            
            healEffects.push(particle);
        }
    }
    
    // Create reproduction visual effect
    createReproductionEffect(partner, child) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(partner.x, partner.y);
        ctx.strokeStyle = this.team === TEAMS.RED ? 'rgba(255,150,150,0.6)' : 'rgba(150,150,255,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw circle at child position
        ctx.beginPath();
        ctx.arc(child.x, child.y, child.size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = this.team === TEAMS.RED ? 'rgba(255,200,200,0.5)' : 'rgba(200,200,255,0.5)';
        ctx.fill();
    }
    
    // Draw the creature
    draw() {
        const teamColor = teamColors[this.team];
        
        // Choose color based on status
        let creatureColor = this.deceased ? teamColor.dead : teamColor.base;
        
        // Elite creatures get special colors
        if (this.isElite) {
            creatureColor = teamColor.elite;
        }
        
        // Draw trail
        if (settings.trailEffect && this.trail.length > 1 && !this.deceased) {
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                const opacity = (this.trail.length - i) / this.trail.length;
                ctx.fillStyle = creatureColor + Math.floor(opacity * 99).toString(16).padStart(2, '0');
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.size * opacity * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw creature
        ctx.fillStyle = creatureColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw health bar
        this.drawHealthBar();
        
        // Add glow effect
        if (settings.glowEffect && (this.glowSize > 0 || this.isElite) && !this.deceased) {
            ctx.save();
            
            // Elite creatures glow more
            const glowSize = this.isElite ? 
                  this.size + 5 + (Math.sin(this.angle * 3) * 2) : 
                  this.size + this.glowSize;
                  
            ctx.globalAlpha = this.isElite ? 0.3 : 0.15;
            ctx.fillStyle = teamColor.glow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Shield visualization
        if (this.abilities[ABILITIES.SHIELD] && this.energy > 0.2 && !this.deceased) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(this.age * 0.05) * 0.1;
            ctx.strokeStyle = teamColor.shield;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw creature stats if elite
        if (this.isElite && !this.deceased) {
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = `${Math.max(8, this.size * 0.8)}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(Math.floor(this.fitness), this.x, this.y);
            ctx.restore();
        }
        
        // Draw ability icons
        if (settings.showAbilities && !this.deceased) {
            this.drawAbilityIndicators();
        }
    }
    
    // Draw health bar above creature
    drawHealthBar() {
        if (this.deceased) return;
        
        const barWidth = this.size * 2;
        const barHeight = 2;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - barHeight - 2;
        
        // Background bar (gray)
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health bar (color based on health percentage)
        let healthColor;
        if (this.health > 0.6) {
            healthColor = 'rgba(0,255,0,0.8)'; // Green
        } else if (this.health > 0.3) {
            healthColor = 'rgba(255,255,0,0.8)'; // Yellow
        } else {
            healthColor = 'rgba(255,0,0,0.8)'; // Red
        }
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * this.health, barHeight);
        
        // Energy bar below health
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY + barHeight + 1, barWidth, barHeight);
        
        ctx.fillStyle = 'rgba(0,127,255,0.8)'; // Blue for energy
        ctx.fillRect(barX, barY + barHeight + 1, barWidth * this.energy, barHeight);
    }
    
    // Draw indicators for creature abilities
    drawAbilityIndicators() {
        const abilityList = Object.keys(this.abilities).filter(a => this.abilities[a]);
        if (abilityList.length === 0) return;
        
        const angleStep = (Math.PI * 2) / abilityList.length;
        const radius = this.size + 7;
        
        for (let i = 0; i < abilityList.length; i++) {
            const ability = abilityList[i];
            const angle = this.angle + i * angleStep;
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius;
            
            // Draw ability indicator
            ctx.fillStyle = abilityVisuals[ability].color;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Create creature array
const creatures = [];
const healEffects = [];

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

// Update and draw heal effects
function updateHealEffects() {
    for (let i = healEffects.length - 1; i >= 0; i--) {
        const effect = healEffects[i];
        
        // Update progress
        effect.progress += effect.speed;
        
        // Remove if complete
        if (effect.progress >= 1) {
            healEffects.splice(i, 1);
            continue;
        }
        
        // Calculate current position
        const x = effect.x + (effect.targetX - effect.x) * effect.progress;
        const y = effect.y + (effect.targetY - effect.y) * effect.progress;
        
        // Draw effect
        ctx.globalAlpha = 1 - effect.progress;
        ctx.fillStyle = effect.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Draw team stats
function drawTeamStats() {
    if (!settings.showTeamScores) return;
    
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, 200, 90);
    
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    
    // Red team stats
    ctx.fillStyle = teamColors[TEAMS.RED].base;
    ctx.fillText(`Red Team - ${teamStats[TEAMS.RED].count} creatures`, 20, 30);
    ctx.fillText(`Score: ${teamStats[TEAMS.RED].score}`, 20, 50);
    ctx.fillText(`K/B: ${teamStats[TEAMS.RED].kills}/${teamStats[TEAMS.RED].births}`, 20, 70);
    
    // Blue team stats
    ctx.fillStyle = teamColors[TEAMS.BLUE].base;
    ctx.fillText(`Blue Team - ${teamStats[TEAMS.BLUE].count} creatures`, 20, 90);
    ctx.fillText(`Score: ${teamStats[TEAMS.BLUE].score}`, 120, 50);
    ctx.fillText(`K/B: ${teamStats[TEAMS.BLUE].kills}/${teamStats[TEAMS.BLUE].births}`, 120, 70);
    
    // Generation counter
    ctx.fillStyle = "white";
    ctx.fillText(`Generation: ${generation}`, 120, 30);
    
    ctx.restore();
}

// Animation loop
function animate() {
    // Apply a semi-transparent clear for trail effect
    ctx.fillStyle = 'rgba(15, 12, 41, 0.1)';
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
