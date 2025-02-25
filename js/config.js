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
    showAbilities: true,          // Show creature abilities
    showTooltips: false           // Show tooltips - disabled by default
};

// Tooltip definitions
const tooltips = {
    redTeam: "Red Team: Focuses on aggressive tactics and territorial control.",
    blueTeam: "Blue Team: Specializes in defensive strategies and adaptive evolution.",
    generation: "Generation: Represents the current evolutionary cycle. Higher generations have more refined abilities.",
    score: "Score: Calculated from kills, successful reproduction, and territory control.",
    creatures: "Creature Count: The number of active organisms in this team.",
    kbRatio: "Kill/Birth Ratio: Shows team's combat vs reproduction balance.",
    topAbility: "Top Ability: The most common genetic trait in this team.",
    boost: "Boost: Click/tap near creatures to boost the team that's falling behind."
};

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

// Global state
let generation = 1;
let evolutionTimer = 0;
let teamStats = {
    [TEAMS.RED]: { count: 0, kills: 0, births: 0, score: 0 },
    [TEAMS.BLUE]: { count: 0, kills: 0, births: 0, score: 0 }
};

// Environment state
const environment = {
    competitionLevel: 0.5 // Initial competition level
};

// Export variables to make them available to other modules
window.TEAMS = TEAMS;
window.ABILITIES = ABILITIES;
window.settings = settings;
window.tooltips = tooltips;
window.teamColors = teamColors;
window.abilityVisuals = abilityVisuals;
window.generation = generation;
window.evolutionTimer = evolutionTimer;
window.teamStats = teamStats;
window.environment = environment;
window.isMobileDevice = isMobileDevice; 