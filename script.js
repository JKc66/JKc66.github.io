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
    trailLength: isMobileDevice() ? 3 : 5
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

// Select a random color palette
const activePalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

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
    constructor(x, y) {
        // If x and y are provided, use them; otherwise, use random position
        this.x = x !== undefined ? x : Math.random() * canvas.width;
        this.y = y !== undefined ? y : Math.random() * canvas.height;
        this.size = Math.random() * settings.particleBaseSize + 1;
        this.baseSize = this.size;
        this.speedX = (Math.random() * 2 - 1) * settings.particleBaseSpeed;
        this.speedY = (Math.random() * 2 - 1) * settings.particleBaseSpeed;
        this.color = this.getRandomColor();
        
        // For trail effect
        this.trail = [];
        this.trailLength = Math.floor(Math.random() * settings.trailLength) + 1;
        
        // Add slight oscillation/pulsing
        this.angle = Math.random() * Math.PI * 2;
        this.angleSpeed = Math.random() * 0.04 + 0.01;
        this.glowSize = 0;
    }

    // Generate random colors from the active palette
    getRandomColor() {
        return activePalette[Math.floor(Math.random() * activePalette.length)];
    }

    // Update particle position and handle boundary checks
    update() {
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

        // Boundary checks with bounce
        if (this.x + this.size > canvas.width || this.x - this.size < 0) {
            this.speedX = -this.speedX * 0.9;
            
            // Fix position if outside boundary
            if (this.x + this.size > canvas.width) {
                this.x = canvas.width - this.size;
            } else if (this.x - this.size < 0) {
                this.x = this.size;
            }
        }
        
        if (this.y + this.size > canvas.height || this.y - this.size < 0) {
            this.speedY = -this.speedY * 0.9;
            
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
    }

    // Draw the particle
    draw() {
        // Draw trail
        if (settings.trailEffect && this.trail.length > 1) {
            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                const opacity = (this.trail.length - i) / this.trail.length;
                ctx.fillStyle = this.color + Math.floor(opacity * 99).toString(16).padStart(2, '0');
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.size * opacity, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw particle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        if (settings.glowEffect && this.glowSize > 0) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + this.glowSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// Create particle array
const particles = [];

function init() {
    for (let i = 0; i < settings.particleCount; i++) {
        particles.push(new Particle());
    }
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
                // Set opacity based on distance
                const opacity = 1 - (distance / maxDistance);
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
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
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    
    connectParticles();
    requestAnimationFrame(animate);
}

// Initialize and start animation
init();
animate();
