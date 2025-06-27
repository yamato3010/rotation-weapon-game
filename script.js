const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const scoreDisplay = document.getElementById('score');
const enemiesDefeatedForPowerUpDisplay = document.getElementById('enemiesDefeatedForPowerUp');
const powerUpThresholdDisplay = document.getElementById('powerUpThreshold');
const playerLevelDisplay = document.getElementById('playerLevel');
const powerUpSelectionDiv = document.getElementById('powerUpSelection');
const invincibleModeCheckbox = document.getElementById('invincibleMode');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

const upgradeSpeedBtn = document.getElementById('upgradeSpeed');
const upgradeAttackBtn = document.getElementById('upgradeAttack');
const upgradeRotationBtn = document.getElementById('upgradeRotation');
const upgradeLengthBtn = document.getElementById('upgradeLength');
const upgradeWeaponsBtn = document.getElementById('upgradeWeapons');

let score = 0;
let enemiesDefeated = 0;
let powerUpThreshold = 5;
let playerLevel = 1;
let gamePaused = false;
let gameOver = false; 
let isInvincible = false; 

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 30,
    speed: 5,
    dx: 0,
    dy: 0,
    attackPower: 1,
    color: 'blue'
};

// Weapons (now an array)
let weapons = [];

// Initial weapon
addWeapon();

function addWeapon() {
    const newWeapon = {
        angle: 0, 
        rotationSpeed: weapons.length > 0 ? weapons[0].rotationSpeed : 0.05, 
        length: weapons.length > 0 ? weapons[0].length : 50,          
        damage: 1,           
        color: weapons.length > 0 ? weapons[0].color : 'gray' 
    };
    weapons.push(newWeapon);
    updateWeaponAngles();
}

function updateWeaponAngles() {
    const angleIncrement = (Math.PI * 2) / weapons.length;
    weapons.forEach((w, index) => {
        w.angle = angleIncrement * index; 
    });
}

// Enemies
let enemies = [];
const enemySpawnInterval = 1000; 
let lastEnemySpawnTime = 0;

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Invincible mode checkbox listener
invincibleModeCheckbox.addEventListener('change', (e) => {
    isInvincible = e.target.checked;
});

// Restart button listener
restartButton.addEventListener('click', () => {
    resetGame();
});

// Power-up selection event listeners
upgradeSpeedBtn.addEventListener('click', () => applyUpgrade('speed'));
upgradeAttackBtn.addEventListener('click', () => applyUpgrade('attack'));
upgradeRotationBtn.addEventListener('click', () => applyUpgrade('rotation'));
upgradeLengthBtn.addEventListener('click', () => applyUpgrade('length'));
upgradeWeaponsBtn.addEventListener('click', () => applyUpgrade('weapons'));

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

function drawWeapon() {
    weapons.forEach(weapon => {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(weapon.angle);
        ctx.fillStyle = weapon.color;
        ctx.fillRect(player.size / 2, -5, weapon.length, 10); 
        ctx.restore();
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
    });
}

function drawGameOver() {
    gameOverScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = score;
}

function updatePlayer() {
    player.dx = 0;
    player.dy = 0;

    if (keys['w'] || keys['ArrowUp']) player.dy = -player.speed;
    if (keys['s'] || keys['ArrowDown']) player.dy = player.speed;
    if (keys['a'] || keys['ArrowLeft']) player.dx = -player.speed;
    if (keys['d'] || keys['ArrowRight']) player.dx = player.speed;

    // Normalize diagonal movement
    if (player.dx !== 0 && player.dy !== 0) {
        const magnitude = Math.sqrt(player.dx * player.dx + player.dy * player.dy);
        player.dx = (player.dx / magnitude) * player.speed;
        player.dy = (player.dy / magnitude) * player.speed;
    }

    player.x += player.dx;
    player.y += player.dy;

    // Keep player within bounds
    if (player.x - player.size / 2 < 0) player.x = player.size / 2;
    if (player.x + player.size / 2 > canvas.width) player.x = canvas.width - player.size / 2;
    if (player.y - player.size / 2 < 0) player.y = player.size / 2;
    if (player.y + player.size / 2 > canvas.height) player.y = canvas.height - player.size / 2;
}

function updateWeapon(deltaTime) {
    weapons.forEach(weapon => {
        weapon.angle += weapon.rotationSpeed; 
        if (weapon.angle > Math.PI * 2) {
            weapon.angle -= Math.PI * 2;
        }
    });
}

function updateEnemies(deltaTime) {
    // Spawn new enemies
    if (performance.now() - lastEnemySpawnTime > enemySpawnInterval && !gamePaused) {
        spawnEnemy();
        lastEnemySpawnTime = performance.now();
    }

    const aliveEnemies = [];
    enemies.forEach(enemy => {
        // Move towards player
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angleToPlayer) * enemy.speed;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed;

        // Check for player-enemy collision
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (!isInvincible && distance < (player.size / 2) + (enemy.size / 2)) { 
            gameOver = true; 
            return; 
        }

        let enemyHit = false; 
        weapons.forEach(weapon => {
            if (enemyHit) return; 

            const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));

            // Weapon's radial range from player's center
            const weaponInnerRadius = player.size / 2; 
            const weaponOuterRadius = player.size / 2 + weapon.length;

            // Check if enemy's radial position overlaps with weapon's radial range
            const radialOverlap = (dist + enemy.size / 2 > weaponInnerRadius) && (dist - enemy.size / 2 < weaponOuterRadius);

            if (radialOverlap) {
                const enemyAngleFromPlayer = Math.atan2(enemy.y - player.y, enemy.x - player.x);

                // Calculate the angular width of the weapon's effective hit area
                // Consider the weapon's thickness (10) and the enemy's diameter (enemy.size)
                const effectiveWeaponThickness = 10 + enemy.size; 
                const averageWeaponDistance = player.size / 2 + weapon.length / 2; 
                const weaponAngularWidth = Math.atan2(effectiveWeaponThickness / 2, averageWeaponDistance);

                const minWeaponAngle = weapon.angle - weaponAngularWidth / 2;
                const maxWeaponAngle = weapon.angle + weaponAngularWidth / 2;

                const normalizeAngle = (angle) => {
                    while (angle < 0) angle += Math.PI * 2;
                    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
                    return angle;
                };

                const normalizedEnemyAngle = normalizeAngle(enemyAngleFromPlayer);
                const normalizedMinWeaponAngle = normalizeAngle(minWeaponAngle);
                const normalizedMaxWeaponAngle = normalizeAngle(maxWeaponAngle);

                let hit = false;
                if (normalizedMinWeaponAngle <= normalizedMaxWeaponAngle) {
                    if (normalizedEnemyAngle >= normalizedMinWeaponAngle && normalizedEnemyAngle <= normalizedMaxWeaponAngle) {
                        hit = true;
                    }
                } else {
                    if (normalizedEnemyAngle >= normalizedMinWeaponAngle || normalizedEnemyAngle <= normalizedMaxWeaponAngle) {
                        hit = true;
                    }
                }

                if (hit) {
                    enemy.health -= weapon.damage * player.attackPower;
                    if (enemy.health <= 0) {
                        score += enemy.scoreValue;
                        enemiesDefeated++;
                        checkPowerUp();
                        enemyHit = true; 
                    }
                }
            }
        });

        if (!enemyHit || enemy.health > 0) { 
            aliveEnemies.push(enemy);
        }
    });
    enemies = aliveEnemies; 
}

function spawnEnemy() {
    const size = 20 + Math.random() * 20;
    const speed = 1 + Math.random() * 2;
    const health = 1 + Math.floor(Math.random() * 3);
    const scoreValue = 10;
    const color = 'red';

    let x, y;
    const side = Math.floor(Math.random() * 4); 
    switch (side) {
        case 0: 
            x = Math.random() * canvas.width;
            y = -size;
            break;
        case 1: 
            x = canvas.width + size;
            y = Math.random() * canvas.height;
            break;
        case 2: 
            x = Math.random() * canvas.width;
            y = canvas.height + size;
            break;
        case 3: 
            x = -size;
            y = Math.random() * canvas.height;
            break;
    }

    enemies.push({ x, y, size, speed, health, scoreValue, color });
}

function checkPowerUp() {
    if (enemiesDefeated >= powerUpThreshold) {
        gamePaused = true;
        powerUpSelectionDiv.classList.remove('hidden');
        enemiesDefeated = 0; 
        powerUpThreshold += 5; 
        updateStatsDisplay();
    }
}

function applyUpgrade(type) {
    playerLevel++;
    switch (type) {
        case 'speed':
            player.speed += 1;
            break;
        case 'attack':
            player.attackPower += 0.2;
            break;
        case 'rotation':
            weapons.forEach(w => w.rotationSpeed += 0.03);
            break;
        case 'length':
            weapons.forEach(w => w.length += 10);
            break;
        case 'weapons':
            addWeapon();
            break;
    }

    const colors = ['gray', 'orange', 'yellow', 'green', 'cyan', 'purple', 'white'];
    weapons.forEach(w => {
        w.color = colors[Math.min(playerLevel - 1, colors.length - 1)];
    });

    powerUpSelectionDiv.classList.add('hidden');
    gamePaused = false;
    updateStatsDisplay();
    console.log('Player Leveled Up! Level: ' + playerLevel + ', Upgrade: ' + type);
}

function updateStatsDisplay() {
    scoreDisplay.textContent = score;
    enemiesDefeatedForPowerUpDisplay.textContent = enemiesDefeated;
    powerUpThresholdDisplay.textContent = powerUpThreshold;
    playerLevelDisplay.textContent = playerLevel;
}

function resetGame() {
    score = 0;
    enemiesDefeated = 0;
    powerUpThreshold = 5;
    playerLevel = 1;
    gamePaused = false;
    gameOver = false;
    isInvincible = false;

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speed = 5;
    player.attackPower = 1;

    weapons = [];
    addWeapon(); // Add initial weapon

    enemies = [];
    lastEnemySpawnTime = 0;

    invincibleModeCheckbox.checked = false;
    gameOverScreen.classList.add('hidden');
    updateStatsDisplay();
    gameLoop(0); // Restart the game loop
}

let lastTime = 0;
function gameLoop(currentTime) {
    if (gameOver) {
        drawGameOver();
        return; 
    }

    if (!gamePaused) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        updatePlayer();
        updateWeapon(deltaTime);
        updateEnemies(deltaTime);
        updateStatsDisplay();

        drawPlayer();
        drawWeapon();
        drawEnemies();
    }

    requestAnimationFrame(gameLoop);
}

// Initial call to start the game loop
updateStatsDisplay(); 
gameLoop(0);