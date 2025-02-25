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

// Settings based on device
const settings = {
    particleCount: isMobileDevice() ? 60 : 120,
    particleBaseSize: isMobileDevice() ? 2 : 3,
    particleAddedSize: isMobileDevice() ? 3 : 5,
    particleMaxSpeed: 4,
    particleBaseSpeed: isMobileDevice() ? 0.8 : 1,
    connectionDistance: isMobileDevice() ? 100 : 150,
    interactionRadius: isMobileDevice() ? 120 : 180,
    glowEffect: true,
    trailEffect: true,
    trailLength: isMobileDevice() ? 3 : 5,
    // Genetic algorithm settings
    geneticEnabled: true,
    evolutionRate: 0.01,          // How often evolution occurs (0-1)
    mutationRate: 0.2,            // Chance of mutation during reproduction (0-1)
    mutationAmount: 0.3,          // How much a mutation can change a property (0-1)
    selectionPercentage: 0.3,     // Top percentage of particles to select as parents
    maxLifespan: 1000,            // Maximum ticks a particle can live
    fitnessDecay: 0.995           // How much fitness decays each frame to prevent stagnation
};

// Update pointer radius based on device
pointer.radius = settings.interactionRadius;

// Color palettes - we'll use these for a more cohesive look
const colorPalettes = [
    // Neon glow palette
    ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3a0ca3', '#3f37c9', '#4361ee', '#4895ef', '#4cc9f0'],
    // Sunset palette
    ['#ff7b00', '#ff8800', '#ff9500', '#ffa200', '#ffaa00', '#ffb700', '#ffc300', '#ffd000', '#ffdd00', '#ffea00'],
    // Ocean palette
    ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8']
];

// Elite particles will get a special color
const eliteColors = ['#FFD700', '#FFFAA0', '#FFFFFF']; // Gold, light gold, white

// Select a random color palette
const activePalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

// Generation counter for the genetic algorithm
let generation = 1;
let evolutionTimer = 0;

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
    // Don't reset coordinates to allow particles to continue moving away
});

// Reset pointer active state when mouse leaves window
window.addEventListener('mouseleave', function() {
    pointer.active = false;
});

// Handle click/tap to create additional particles
window.addEventListener('click', createParticlesAtPointer);
window.addEventListener('touchend', createParticlesAtPointer);

// Function to create particles at current pointer position
function createParticlesAtPointer(event) {
    if (!pointer.x || !pointer.y) return;
    
    // Add 5-10 new particles at the pointer position
    const newParticleCount = isMobileDevice() ? 5 : 10;
    for (let i = 0; i < newParticleCount; i++) {
        if (particles.length < settings.particleCount * 1.5) { // Limit max particles
            const newParticle = new Particle(pointer.x, pointer.y);
            // Give the new particle a velocity away from the pointer
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            newParticle.speedX = Math.cos(angle) * speed;
            newParticle.speedY = Math.sin(angle) * speed;
            particles.push(newParticle);
        }
    }
}

// Particle class
class Particle {
    constructor(x, y, parent1, parent2) {
        // Genetic algorithm properties
        this.fitness = 0;
        this.connections = 0;
        this.interactionsWithPointer = 0;
        this.age = 0;
        this.lifespan = Math.random() * settings.maxLifespan + settings.maxLifespan / 2;
        this.generation = generation;
        this.isElite = false;
        
        // If we have parents, inherit properties (genetic reproduction)
        if (parent1 && parent2 && settings.geneticEnabled) {
            // Inherit position from either parent with some randomness
            this.x = (Math.random() < 0.5 ? parent1.x : parent2.x) + (Math.random() * 40 - 20);
            this.y = (Math.random() < 0.5 ? parent1.y : parent2.y) + (Math.random() * 40 - 20);
            
            // Inherit from either parent with potential mutation
            this.baseSize = this.inheritWithMutation(parent1.baseSize, parent2.baseSize, 0.5, 5);
            
            // Inherit speed genes with mutation
            const speedMultiplier = this.inheritWithMutation(
                parent1.speedMultiplier || 1, 
                parent2.speedMultiplier || 1, 
                0.5, 2
            );
            this.speedX = (Math.random() * 2 - 1) * settings.particleBaseSpeed * speedMultiplier;
            this.speedY = (Math.random() * 2 - 1) * settings.particleBaseSpeed * speedMultiplier;
            
            // Inherit trail length
            this.trailLength = Math.floor(this.inheritWithMutation(
                parent1.trailLength, parent2.trailLength, 1, settings.trailLength * 2
            ));
            
            // Inherit color with a chance of mutation
            if (Math.random() < settings.mutationRate) {
                this.color = this.getRandomColor();
            } else {
                this.color = Math.random() < 0.5 ? parent1.color : parent2.color;
            }
            
            // Inherit lifespan with mutation
            this.lifespan = this.inheritWithMutation(
                parent1.lifespan, parent2.lifespan, 
                settings.maxLifespan * 0.3, settings.maxLifespan * 1.5
            );
            
            // Store the speed multiplier for future inheritance
            this.speedMultiplier = speedMultiplier;
        } else {
            // Random initialization for first generation
            this.x = x !== undefined ? x : Math.random() * canvas.width;
            this.y = y !== undefined ? y : Math.random() * canvas.height;
            this.baseSize = Math.random() * settings.particleBaseSize + 1;
            this.speedX = (Math.random() * 2 - 1) * settings.particleBaseSpeed;
            this.speedY = (Math.random() * 2 - 1) * settings.particleBaseSpeed;
            this.color = this.getRandomColor();
            this.trailLength = Math.floor(Math.random() * settings.trailLength) + 1;
            this.speedMultiplier = 1;
        }
        
        this.size = this.baseSize;
        
        // For trail effect
        this.trail = [];
        
        // Add slight oscillation/pulsing
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = Math.random() * 0.04 + 0.01;
        this.glowSize = 0;
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

    // Generate random colors from the active palette
    getRandomColor() {
        return activePalette[Math.floor(Math.random() * activePalette.length)];
    }

    // Update particle position and handle boundary checks
    update() {
        // Increase age
        this.age++;
        
        // Apply fitness decay to prevent immortal particles
        this.fitness *= settings.fitnessDecay;
        
        // Store previous position for trail
        if (settings.trailEffect) {
            this.trail.unshift({ x: this.x, y: this.y, size: this.size });
            if (this.trail.length > this.trailLength) {
                this.trail.pop();
            }
        }
        
        // Update position
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Gradually slow down particles
        this.speedX *= 0.99;
        this.speedY *= 0.99;

        // Slight oscillation effect
        this.size = this.baseSize + Math.sin(this.angle) * 0.5;
        this.angle += this.angleSpeed;

        // Boundary checks with bounce and fitness penalty
        if (this.x + this.size > canvas.width || this.x - this.size < 0) {
            this.speedX = -this.speedX * 0.9;
            this.fitness -= 0.5; // Penalty for hitting walls
            
            // Fix position if outside boundary
            if (this.x + this.size > canvas.width) {
                this.x = canvas.width - this.size;
            } else if (this.x - this.size < 0) {
                this.x = this.size;
            }
        }
        
        if (this.y + this.size > canvas.height || this.y - this.size < 0) {
            this.speedY = -this.speedY * 0.9;
            this.fitness -= 0.5; // Penalty for hitting walls
            
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
                // Particle is within pointer radius
                this.interactionsWithPointer++;
                this.fitness += 0.1; // Reward for interacting with pointer
                
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (pointer.radius - distance) / pointer.radius;
                const repelForce = pointer.active ? -1 : 0.5; // Repel when active, gently attract when inactive
                
                // Calculate movement based on force
                this.speedX += forceDirectionX * force * 0.6 * repelForce;
                this.speedY += forceDirectionY * force * 0.6 * repelForce;
                
                // Limit speed
                this.speedX = Math.min(Math.max(this.speedX, -settings.particleMaxSpeed), settings.particleMaxSpeed);
                this.speedY = Math.min(Math.max(this.speedY, -settings.particleMaxSpeed), settings.particleMaxSpeed);
                
                // Increase size when near pointer
                this.size = this.baseSize + (force * settings.particleAddedSize);
                
                // Increase glow effect
                this.glowSize = force * 10;
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
        
        // Die of old age
        return this.age < this.lifespan;
    }

    // Draw the particle
    draw() {
        // Choose color based on fitness for genetic display
        let particleColor = this.color;
        
        // Elite particles get special colors
        if (this.isElite) {
            const eliteIndex = Math.min(
                Math.floor(this.fitness / 50), 
                eliteColors.length - 1
            );
            particleColor = eliteColors[eliteIndex];
        }
        
        // Draw trail
        if (settings.trailEffect && this.trail.length > 1) {
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                const opacity = (this.trail.length - i) / this.trail.length;
                ctx.fillStyle = particleColor + Math.floor(opacity * 99).toString(16).padStart(2, '0');
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.size * opacity, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw particle
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        if (settings.glowEffect && (this.glowSize > 0 || this.isElite)) {
            ctx.save();
            
            // Elite particles glow more
            const glowSize = this.isElite ? 
                  this.size + 5 + (Math.sin(this.angle * 3) * 2) : 
                  this.size + this.glowSize;
                  
            ctx.globalAlpha = this.isElite ? 0.3 : 0.15;
            ctx.fillStyle = particleColor;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Draw generation number or fitness for elite particles
        if (this.isElite && this.fitness > 30) {
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = `${Math.max(8, this.size * 1.2)}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(Math.floor(this.fitness), this.x, this.y);
            ctx.restore();
        }
    }
    
    // Record a connection with another particle - used for fitness
    recordConnection() {
        this.connections++;
        this.fitness += 0.05; // Small fitness reward for connections
    }
}

// Create particle array
const particles = [];

function init() {
    for (let i = 0; i < settings.particleCount; i++) {
        particles.push(new Particle());
    }
}

// Evolve the population
function evolvePopulation() {
    if (!settings.geneticEnabled || particles.length < 10) return;
    
    // Mark the start of a new generation
    generation++;
    
    // Sort particles by fitness
    particles.sort((a, b) => b.fitness - a.fitness);
    
    // Calculate how many particles to keep as parents
    const parentCount = Math.max(5, Math.floor(particles.length * settings.selectionPercentage));
    const parents = particles.slice(0, parentCount);
    
    // Mark the top 3 particles as elite
    for (let i = 0; i < Math.min(3, parents.length); i++) {
        parents[i].isElite = true;
    }
    
    // Replace the bottom performing particles
    const replacementCount = Math.floor(particles.length * 0.2); // Replace 20%
    
    // Keep elite particles and replace others
    for (let i = 0; i < replacementCount; i++) {
        // Select two parents from the top performers using fitness proportionate selection
        const parent1 = selectParent(parents);
        const parent2 = selectParent(parents);
        
        // Create a child through reproduction
        const child = new Particle(null, null, parent1, parent2);
        
        // Replace one of the worst particles with the new child
        const replaceIndex = particles.length - 1 - i;
        if (replaceIndex >= 0) {
            particles[replaceIndex] = child;
        }
    }
}

// Select a parent based on fitness (higher fitness = higher chance)
function selectParent(parents) {
    // Simple tournament selection
    const tournamentSize = Math.min(5, parents.length);
    let best = parents[Math.floor(Math.random() * parents.length)];
    
    for (let i = 0; i < tournamentSize - 1; i++) {
        const contender = parents[Math.floor(Math.random() * parents.length)];
        if (contender.fitness > best.fitness) {
            best = contender;
        }
    }
    
    return best;
}

// Connect particles with lines if they're close enough
function connectParticles() {
    const maxDistance = settings.connectionDistance;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < maxDistance) {
                // Record connection for both particles (for genetic fitness)
                particles[i].recordConnection();
                particles[j].recordConnection();
                
                // Set opacity based on distance
                const opacity = 1 - (distance / maxDistance);
                
                // Lines between elite particles are more visible
                const lineOpacity = (particles[i].isElite || particles[j].isElite) ? 
                      opacity * 0.7 : opacity * 0.3;
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
                ctx.lineWidth = opacity * 1.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

// Animation loop
function animate() {
    // Apply a semi-transparent clear for trail effect
    ctx.fillStyle = 'rgba(15, 12, 41, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update genetic evolution
    evolutionTimer++;
    if (evolutionTimer > 200 && Math.random() < settings.evolutionRate * 10) { // Evolve every ~200 frames or by chance
        evolvePopulation();
        evolutionTimer = 0;
    }
    
    // Filter out dead particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const isAlive = particles[i].update();
        if (!isAlive) {
            particles.splice(i, 1);
        }
    }
    
    // Add new particles if population drops
    if (particles.length < settings.particleCount * 0.7) {
        const newCount = Math.min(5, settings.particleCount - particles.length);
        for (let i = 0; i < newCount; i++) {
            particles.push(new Particle());
        }
    }
    
    // Draw particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
    }
    
    // Connect particles
    connectParticles();
    
    // Display info about genetic algorithm
    if (settings.geneticEnabled) {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Generation: ${generation}`, 20, 30);
        
        // Show the top 3 fitness scores
        if (particles.length > 0) {
            const topFitness = [...particles].sort((a, b) => b.fitness - a.fitness).slice(0, 3);
            for (let i = 0; i < topFitness.length; i++) {
                ctx.fillText(`Top ${i+1}: ${Math.floor(topFitness[i].fitness)}`, 20, 60 + i * 25);
            }
        }
        ctx.restore();
    }
    
    requestAnimationFrame(animate);
}

// Initialize and start animation
init();
animate();
