   // Performance optimized cube management
   class CubeManager {
    constructor() {
        this.placedCubes = [];
        this.container = document.getElementById('shapeContainer');
        this.isInitialized = false;
        this.resizeTimeout = null;
        this.boundInitialize = this.initialize.bind(this);
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('load', this.boundInitialize);
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.updateCubePositions();
            }, 250);
        });
    }

    createCubeFaces() {
        const fragment = document.createDocumentFragment();
        ['front', 'back', 'right', 'left', 'top', 'bottom'].forEach(face => {
            const div = document.createElement('div');
            div.className = `cube-face face-${face}`;
            fragment.appendChild(div);
        });
        return fragment;
    }

    createCube() {
        const cube = document.createElement('div');
        cube.className = 'cube';
        cube.appendChild(this.createCubeFaces());
        return cube;
    }

    getRandomPosition(min, max) {
        return min + Math.random() * (max - min);
    }

    getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    calculateDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isPositionValid(x, y, scale, viewportWidth, viewportHeight) {
        // Get base cube size
        const baseCubeSize = window.innerWidth < 768 ? 80 : 120;
        const cubeSize = baseCubeSize * scale;
        
        // Check viewport boundaries with padding
        const padding = 20;
        if (x - cubeSize/2 < padding || 
            x + cubeSize/2 > viewportWidth - padding || 
            y - cubeSize/2 < padding || 
            y + cubeSize/2 > viewportHeight - padding) {
            return false;
        }

        // Check distance from other cubes
        const minDistance = baseCubeSize * 1.2; // 20% extra space between cubes
        return this.placedCubes.every(cube => {
            const distance = this.calculateDistance(x, y, cube.x, cube.y);
            const requiredDistance = minDistance * (scale + cube.scale) / 2;
            return distance >= requiredDistance;
        });
    }

    findValidPosition(scale, viewportWidth, viewportHeight) {
        const maxAttempts = 100; // Increased attempts
        const padding = 20;
        const baseCubeSize = window.innerWidth < 768 ? 80 : 120;
        const effectiveWidth = viewportWidth - padding * 2;
        const effectiveHeight = viewportHeight - padding * 2;
        
        // Grid-based positioning attempt first
        const gridSize = baseCubeSize * 1.5; // Grid cells are 1.5x cube size
        const cols = Math.floor(effectiveWidth / gridSize);
        const rows = Math.floor(effectiveHeight / gridSize);
        
        for (let i = 0; i < maxAttempts; i++) {
            // Try grid-based position first
            const col = Math.floor(Math.random() * cols);
            const row = Math.floor(Math.random() * rows);
            const x = padding + col * gridSize + gridSize/2;
            const y = padding + row * gridSize + gridSize/2;
            
            if (this.isPositionValid(x, y, scale, viewportWidth, viewportHeight)) {
                return { x, y };
            }
            
            // If grid position fails, try random position
            const randX = this.getRandomPosition(padding + baseCubeSize/2, viewportWidth - padding - baseCubeSize/2);
            const randY = this.getRandomPosition(padding + baseCubeSize/2, viewportHeight - padding - baseCubeSize/2);
            
            if (this.isPositionValid(randX, randY, scale, viewportWidth, viewportHeight)) {
                return { x: randX, y: randY };
            }
        }
        
        // If no valid position found, try to find the position furthest from all other cubes
        let bestPosition = null;
        let maxMinDistance = 0;
        
        for (let x = padding; x < viewportWidth - padding; x += gridSize) {
            for (let y = padding; y < viewportHeight - padding; y += gridSize) {
                let minDistance = Infinity;
                for (const cube of this.placedCubes) {
                    const distance = this.calculateDistance(x, y, cube.x, cube.y);
                    minDistance = Math.min(minDistance, distance);
                }
                if (minDistance > maxMinDistance) {
                    maxMinDistance = minDistance;
                    bestPosition = { x, y };
                }
            }
        }
        
        return bestPosition || { 
            x: viewportWidth / 2, 
            y: viewportHeight / 2 
        };
    }

    updateCubePositions() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        this.placedCubes.forEach(cube => {
            const position = this.findValidPosition(cube.scale, viewportWidth, viewportHeight);
            cube.element.style.left = `${(position.x / viewportWidth) * 100}%`;
            cube.element.style.top = `${(position.y / viewportHeight) * 100}%`;
            cube.x = position.x;
            cube.y = position.y;
        });
    }

    initialize() {
        if (this.isInitialized) return;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate maximum number of cubes based on viewport size
        const baseCubeSize = viewportWidth < 768 ? 80 : 120;
        const gridSize = baseCubeSize * 1.5;
        const maxCols = Math.floor(viewportWidth / gridSize);
        const maxRows = Math.floor(viewportHeight / gridSize);
        const maxCubes = Math.min(Math.floor((maxCols * maxRows) / 2), viewportWidth < 768 ? 6 : 8);

        this.container.innerHTML = '';
        this.placedCubes = [];

        for (let i = 0; i < maxCubes; i++) {
            const cube = this.createCube();
            const scale = this.getRandomFloat(0.4, 1);
            const position = this.findValidPosition(scale, viewportWidth, viewportHeight);
            
            if (!position) continue; // Skip if no valid position found
            
            cube.style.left = `${(position.x / viewportWidth) * 100}%`;
            cube.style.top = `${(position.y / viewportHeight) * 100}%`;
            cube.style.transform = `scale(${scale})`;
            
            // Randomize animation
            const duration = this.getRandomFloat(30, 40);
            cube.style.animationDuration = `${duration}s`;
            cube.style.animationDirection = Math.random() > 0.5 ? 'reverse' : 'normal';
            
            // Random initial rotation for variety
            const rotX = this.getRandomPosition(0, 360);
            const rotY = this.getRandomPosition(0, 360);
            const rotZ = this.getRandomPosition(0, 360);
            cube.style.transform += ` rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
            
            this.placedCubes.push({
                element: cube,
                x: position.x,
                y: position.y,
                scale: scale
            });
            
            this.container.appendChild(cube);
        }

        this.isInitialized = true;
    }
}

// Initialize the cube manager
const cubeManager = new CubeManager();