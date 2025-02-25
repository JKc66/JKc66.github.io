// Create creature array
const creatures = [];

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

// Export creature class and array
window.Creature = Creature;
window.creatures = creatures; 