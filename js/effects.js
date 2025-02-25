// Store energy effects
const energyEffects = [];

// Store healing effects
const healEffects = [];

// Store death effects
const deathEffects = [];

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

// Create death effect when a creature dies
function createDeathEffect(x, y, color, size) {
    // Create explosion particles
    const particleCount = Math.floor(size * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        const radius = Math.random() * (size/2) + 1;
        const life = Math.random() * 30 + 20;
        
        const particle = {
            x: x,
            y: y,
            radius: radius,
            color: color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1.0,
            life: life,
            maxLife: life,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        };
        
        deathEffects.push(particle);
    }
}

// Update and draw death effects
function updateDeathEffects() {
    for (let i = deathEffects.length - 1; i >= 0; i--) {
        const effect = deathEffects[i];
        
        // Update position
        effect.x += effect.vx;
        effect.y += effect.vy;
        
        // Update rotation
        effect.rotation += effect.rotationSpeed;
        
        // Reduce life
        effect.life--;
        
        // Calculate alpha based on remaining life
        effect.alpha = effect.life / effect.maxLife;
        
        // Remove if dead
        if (effect.life <= 0) {
            deathEffects.splice(i, 1);
            continue;
        }
        
        // Draw effect
        ctx.save();
        ctx.globalAlpha = effect.alpha;
        ctx.fillStyle = effect.color;
        ctx.translate(effect.x, effect.y);
        ctx.rotate(effect.rotation);
        
        // Draw a more interesting shape instead of circle
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
            const angle = (p / 5) * Math.PI * 2;
            const r = effect.radius;
            if (p === 0) {
                ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
            } else {
                ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
            }
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// Export effects-related variables and functions
window.energyEffects = energyEffects;
window.healEffects = healEffects;
window.deathEffects = deathEffects;
window.createEnergyEffect = createEnergyEffect;
window.updateEnergyEffects = updateEnergyEffects;
window.updateHealEffects = updateHealEffects;
window.createDeathEffect = createDeathEffect;
window.updateDeathEffects = updateDeathEffects; 