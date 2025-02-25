// Controls & UI Interaction for Genetic Evolution Simulation
document.addEventListener('DOMContentLoaded', () => {
    // Get UI Elements
    const controlPanel = document.getElementById('controlPanel');
    const infoPanel = document.getElementById('infoPanel');
    const infoToggle = document.getElementById('infoToggle');
    const closeInfo = document.getElementById('closeInfo');
    const settingsToggle = document.getElementById('settingsToggle');
    const evolutionRateSlider = document.getElementById('evolutionRate');
    const initialCountSlider = document.getElementById('initialCount');
    const showStatsToggle = document.getElementById('showStats');
    const glowEffectToggle = document.getElementById('glowEffect');
    const resetBtn = document.getElementById('resetBtn');
    const balanceBtn = document.getElementById('balanceBtn');
    
    // Get toggle slider elements and labels within toggle groups
    const toggleSliders = document.querySelectorAll('.toggle-slider');
    const toggleLabels = document.querySelectorAll('.control-group.toggle label');
    
    // Add click event listeners to toggle sliders
    toggleSliders.forEach(slider => {
        slider.addEventListener('click', function() {
            // Find the associated input checkbox (previous sibling)
            const checkbox = this.previousElementSibling;
            if (checkbox && checkbox.type === 'checkbox') {
                // Toggle the checkbox state
                checkbox.checked = !checkbox.checked;
                
                // Dispatch a change event to trigger the event handlers
                const event = new Event('change');
                checkbox.dispatchEvent(event);
            }
        });
    });
    
    // Add click event listeners to toggle labels
    toggleLabels.forEach(label => {
        label.addEventListener('click', function() {
            const inputId = this.getAttribute('for');
            if (inputId) {
                const checkbox = document.getElementById(inputId);
                if (checkbox && checkbox.type === 'checkbox') {
                    // Toggle the checkbox state
                    checkbox.checked = !checkbox.checked;
                    
                    // Dispatch a change event to trigger the event handlers
                    const event = new Event('change');
                    checkbox.dispatchEvent(event);
                }
            }
        });
    });
    
    // Initialize sliders with current values from settings
    evolutionRateSlider.value = settings.evolutionRate;
    initialCountSlider.value = settings.initialCreatureCount;
    showStatsToggle.checked = settings.showTeamScores;
    glowEffectToggle.checked = settings.glowEffect;
    
    // Settings Panel Toggle
    settingsToggle.addEventListener('click', () => {
        controlPanel.classList.toggle('hidden');
        // Add animation effect to the settings icon
        if (controlPanel.classList.contains('hidden')) {
            settingsToggle.style.transform = 'rotate(0deg)';
        } else {
            settingsToggle.style.transform = 'rotate(45deg)';
        }
    });
    
    // Info Panel Toggle
    infoToggle.addEventListener('click', () => {
        infoPanel.classList.toggle('active');
    });
    
    closeInfo.addEventListener('click', () => {
        infoPanel.classList.remove('active');
    });
    
    // Evolution Rate Control
    evolutionRateSlider.addEventListener('input', (e) => {
        settings.evolutionRate = parseFloat(e.target.value);
    });
    
    // Initial Count Control
    initialCountSlider.addEventListener('input', (e) => {
        settings.initialCreatureCount = parseInt(e.target.value);
        settings.maxCreatures = settings.initialCreatureCount * 2;
    });
    
    // Show Stats Toggle
    showStatsToggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        
        // Update both local and window settings objects
        settings.showTeamScores = isChecked;
        settings.showStats = isChecked;
        window.settings.showTeamScores = isChecked;
        window.settings.showStats = isChecked;
        
        // Log the change for debugging
        console.log(`Stats toggle changed to: ${isChecked}`);
        
        // Force immediate update of UI visibility
        if (!isChecked) {
            // Clear any existing stats display by forcing a full redraw
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });
    
    // Glow Effect Toggle
    glowEffectToggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        
        // Update both local and window settings objects
        settings.glowEffect = isChecked;
        settings.trailEffect = isChecked;
        window.settings.glowEffect = isChecked;
        window.settings.trailEffect = isChecked;
        
        // Log the change for debugging
        console.log(`Glow effects toggle changed to: ${isChecked}`);
        
        // Update all existing creatures' trail data if turning off trails
        if (!isChecked) {
            creatures.forEach(creature => {
                if (creature.trail) {
                    creature.trail = [];
                }
            });
            // Force a clean redraw
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });
    
    // Reset Simulation
    resetBtn.addEventListener('click', () => {
        // Clear existing creatures
        creatures.length = 0;
        
        // Reset team stats
        teamStats = {
            [TEAMS.RED]: { count: 0, kills: 0, births: 0, score: 0 },
            [TEAMS.BLUE]: { count: 0, kills: 0, births: 0, score: 0 }
        };
        
        // Reset generation counter
        generation = 1;
        
        // Initialize new population
        init();
        
        // Add visual feedback for button press
        animateButtonPress(resetBtn);
    });
    
    // Balance Teams
    balanceBtn.addEventListener('click', () => {
        balanceTeams();
        animateButtonPress(balanceBtn);
    });
    
    // Helper function to balance teams
    function balanceTeams() {
        const redCount = creatures.filter(c => c.team === TEAMS.RED && !c.deceased).length;
        const blueCount = creatures.filter(c => c.team === TEAMS.BLUE && !c.deceased).length;
        
        // Determine which team has fewer creatures
        const weakerTeam = redCount < blueCount ? TEAMS.RED : TEAMS.BLUE;
        const strongerTeam = weakerTeam === TEAMS.RED ? TEAMS.BLUE : TEAMS.RED;
        
        const difference = Math.abs(redCount - blueCount);
        
        // If difference is significant, add creatures to weaker team
        if (difference > 5) {
            const countToAdd = Math.min(Math.ceil(difference / 2), 10);
            
            for (let i = 0; i < countToAdd; i++) {
                let x, y;
                if (weakerTeam === TEAMS.RED) {
                    x = Math.random() * (canvas.width / 3) + 50;
                } else {
                    x = canvas.width - Math.random() * (canvas.width / 3) - 50;
                }
                y = Math.random() * (canvas.height - 100) + 50;
                
                // Create elite creature for the weaker team
                const newCreature = new Creature(x, y, weakerTeam);
                newCreature.isElite = true;
                
                // Give it slightly better stats
                for (const ability in ABILITIES) {
                    if (Math.random() < 0.5) {
                        newCreature.abilities[ABILITIES[ability]] = true;
                    }
                }
                
                creatures.push(newCreature);
                
                // Create energy burst effect
                createEnergyEffect(x, y, teamColors[weakerTeam].base);
            }
        }
    }
    
    // UI feedback for button press
    function animateButtonPress(button) {
        button.style.transform = 'scale(0.95)';
        button.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.backgroundColor = '';
        }, 200);
    }
    
    // Mobile detection for controlPanel position
    function adjustForMobile() {
        if (isMobileDevice()) {
            controlPanel.classList.add('mobile');
        } else {
            controlPanel.classList.remove('mobile');
        }
    }
    
    // Call initially and on window resize
    adjustForMobile();
    window.addEventListener('resize', adjustForMobile);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'i': // Toggle info panel
                infoPanel.classList.toggle('active');
                break;
            case 's': // Toggle settings panel
                settingsToggle.click();
                break;
            case 'r': // Reset simulation
                resetBtn.click();
                break;
            case 'b': // Balance teams
                balanceBtn.click();
                break;
            case 'h': // Toggle stats
                showStatsToggle.checked = !showStatsToggle.checked;
                const event = new Event('change');
                showStatsToggle.dispatchEvent(event);
                break;
            case 'g': // Toggle glow effects
                glowEffectToggle.checked = !glowEffectToggle.checked;
                const glowEvent = new Event('change');
                glowEffectToggle.dispatchEvent(glowEvent);
                break;
        }
    });
    
    // Make sure the initial state is applied
    window.setTimeout(() => {
        // Force initial settings values to match checkbox state
        const showStatsInitialState = showStatsToggle.checked;
        const glowEffectsInitialState = glowEffectToggle.checked;
        
        // Update both local and window settings
        settings.showTeamScores = showStatsInitialState;
        settings.showStats = showStatsInitialState;
        window.settings.showTeamScores = showStatsInitialState;
        window.settings.showStats = showStatsInitialState;
        
        settings.glowEffect = glowEffectsInitialState;
        settings.trailEffect = glowEffectsInitialState;
        window.settings.glowEffect = glowEffectsInitialState;
        window.settings.trailEffect = glowEffectsInitialState;
        
        console.log('Initial toggle states:');
        console.log(`- Show Stats: ${showStatsInitialState}`);
        console.log(`- Glow Effects: ${glowEffectsInitialState}`);
        
        // Trigger change events to ensure handlers run
        showStatsToggle.dispatchEvent(new Event('change'));
        glowEffectToggle.dispatchEvent(new Event('change'));
        
        // Make sure settings panel starts hidden
        controlPanel.classList.add('hidden');
    }, 100);
});

// Ensure controls.js is loaded after all other scripts
console.log("Controls initialized"); 