// Store energy effects
const energyEffects = [];

// Store healing effects
const healEffects = [];

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

// Export effects-related variables and functions
window.energyEffects = energyEffects;
window.healEffects = healEffects;
window.createEnergyEffect = createEnergyEffect;
window.updateEnergyEffects = updateEnergyEffects;
window.updateHealEffects = updateHealEffects; 