// Get the canvas element and its context
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Mouse/Touch position
const pointer = {
    x: null,
    y: null,
    radius: 150,
    active: false,  // Track if pointer is currently active
    hover: {
        active: false,
        tooltip: null
    }
};

// Update pointer radius based on device
pointer.radius = settings.interactionRadius;

// Call resize on initial load and whenever window is resized
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Only track mouse position but don't set active flag for creature avoidance
window.addEventListener('mousemove', function(event) {
    pointer.x = event.x;
    pointer.y = event.y;

    // Check for tooltip hover
    pointer.hover.x = event.x;
    pointer.hover.y = event.y;
    pointer.hover.active = true;
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
    // Check for tooltip hover on mobile
    pointer.hover.x = event.touches[0].clientX;
    pointer.hover.y = event.touches[0].clientY;
    pointer.hover.active = true;
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

// Export canvas-related variables
window.canvas = canvas;
window.ctx = ctx;
window.pointer = pointer;
window.boostNearbyCreatures = boostNearbyCreatures; 