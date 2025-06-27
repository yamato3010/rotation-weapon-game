let score = 0;
let enemiesDefeated = 0;
let powerUpThreshold = 5;
let playerLevel = 1;
let gamePaused = false;
let gameOver = false; 
let isInvincible = false; 

let canvas; // Declare globally
let ctx;    // Declare globally

let player; // Declare player globally

// Weapons (now an array)
let weapons = [];


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
const weaponEnemySpawnThreshold = 100; // Score threshold to start spawning weapon enemies

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

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

document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    canvas.width = 800;
    canvas.height = 600;

    // Initialize player after canvas is defined
    player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: 30,
        speed: 5,
        dx: 0,
        dy: 0,
        attackPower: 1,
        color: 'blue'
    };

    // Initial weapon (call after player is defined)
    addWeapon();

    // グローバル変数に代入
    scoreDisplay = document.getElementById('score');
    enemiesDefeatedForPowerUpDisplay = document.getElementById('enemiesDefeatedForPowerUp');
    powerUpThresholdDisplay = document.getElementById('powerUpThreshold');
    playerLevelDisplay = document.getElementById('playerLevel');
    powerUpSelectionDiv = document.getElementById('powerUpSelection');
    invincibleModeCheckbox = document.getElementById('invincibleMode');
    gameOverScreen = document.getElementById('gameOverScreen');
    finalScoreDisplay = document.getElementById('finalScore');
    restartButton = document.getElementById('restartButton');

    upgradeSpeedBtn = document.getElementById('upgradeSpeed');
    upgradeAttackBtn = document.getElementById('upgradeAttack');
    upgradeRotationBtn = document.getElementById('upgradeRotation');
    upgradeLengthBtn = document.getElementById('upgradeLength');
    upgradeWeaponsBtn = document.getElementById('upgradeWeapons');

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
    // upgradeAttackBtn.addEventListener('click', () => applyUpgrade('attack'));
    upgradeRotationBtn.addEventListener('click', () => applyUpgrade('rotation'));
    upgradeLengthBtn.addEventListener('click', () => applyUpgrade('length'));
    upgradeWeaponsBtn.addEventListener('click', () => applyUpgrade('weapons'));

    // Define functions that use these elements within this scope or pass them as arguments
    function updateStatsDisplay() {
        scoreDisplay.textContent = score;
        enemiesDefeatedForPowerUpDisplay.textContent = enemiesDefeated;
        powerUpThresholdDisplay.textContent = powerUpThreshold;
        playerLevelDisplay.textContent = playerLevel;
    }

    function drawGameOver() {
        gameOverScreen.classList.remove('hidden');
        finalScoreDisplay.textContent = score;
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
        addWeapon(); 

        enemies = [];
        lastEnemySpawnTime = 0;

        invincibleModeCheckbox.checked = false;
        gameOverScreen.classList.add('hidden');
        updateStatsDisplay();
        gameLoop(0); 
    }

    // Initial call to start the game loop
    updateStatsDisplay(); 
    gameLoop(0); 
});

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

        // Draw enemy weapons if it has any
        if (enemy.weapons && enemy.weapons.length > 0) {
            enemy.weapons.forEach(enemyWeapon => {
                ctx.save();
                ctx.translate(enemy.x, enemy.y);
                ctx.rotate(enemyWeapon.angle);
                ctx.fillStyle = enemyWeapon.color;
                ctx.fillRect(enemy.size / 2, -3, enemyWeapon.length, 6); 
                ctx.restore();
            });
        }
    });
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

        // Update enemy weapon angles
        if (enemy.weapons && enemy.weapons.length > 0) {
            enemy.weapons.forEach(enemyWeapon => {
                enemyWeapon.angle += enemyWeapon.rotationSpeed;
                if (enemyWeapon.angle > Math.PI * 2) {
                    enemyWeapon.angle -= Math.PI * 2;
                }
            });
        }

        // Check for player-enemy collision
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (!isInvincible && distance < (player.size / 2) + (enemy.size / 2)) { 
            gameOver = true; 
            return; 
        }

        let enemyHit = false; 
        weapons.forEach(playerWeapon => {
            if (enemyHit) return; 

            const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));

            // Player Weapon's radial range from player's center
            const playerWeaponInnerRadius = player.size / 2; 
            const playerWeaponOuterRadius = player.size / 2 + playerWeapon.length;

            // Check if enemy's radial position overlaps with player weapon's radial range
            const radialOverlap = (dist + enemy.size / 2 > playerWeaponInnerRadius) && (dist - enemy.size / 2 < playerWeaponOuterRadius);

            if (radialOverlap) {
                const enemyAngleFromPlayer = Math.atan2(enemy.y - player.y, enemy.x - player.x);

                const effectivePlayerWeaponThickness = player.size + enemy.size; 
                const averagePlayerWeaponDistance = player.size / 2 + playerWeapon.length / 2; 
                const playerWeaponAngularWidth = Math.atan2(effectivePlayerWeaponThickness / 2, averagePlayerWeaponDistance);

                const minPlayerWeaponAngle = playerWeapon.angle - playerWeaponAngularWidth / 2;
                const maxPlayerWeaponAngle = playerWeapon.angle + playerWeaponAngularWidth / 2;

                const normalizeAngle = (angle) => {
                    while (angle < 0) angle += Math.PI * 2;
                    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
                    return angle;
                };

                const normalizedEnemyAngle = normalizeAngle(enemyAngleFromPlayer);
                const normalizedMinPlayerWeaponAngle = normalizeAngle(minPlayerWeaponAngle);
                const normalizedMaxPlayerWeaponAngle = normalizeAngle(maxPlayerWeaponAngle);

                let hit = false;
                if (normalizedMinPlayerWeaponAngle <= normalizedMaxPlayerWeaponAngle) {
                    if (normalizedEnemyAngle >= normalizedMinPlayerWeaponAngle && normalizedEnemyAngle <= normalizedMaxPlayerWeaponAngle) {
                        hit = true;
                    }
                } else {
                    if (normalizedEnemyAngle >= normalizedMinPlayerWeaponAngle || normalizedEnemyAngle <= normalizedMaxPlayerWeaponAngle) {
                        hit = true;
                    }
                }

                if (hit) {
                    enemy.health -= playerWeapon.damage * player.attackPower;
                    if (enemy.health <= 0) {
                        score += enemy.scoreValue;
                        enemiesDefeated++;
                        checkPowerUp();
                        enemyHit = true; 
                    }
                }
            }
        });

        // Check for player weapon vs enemy weapon collision
        if (enemy.weapons && enemy.weapons.length > 0) {
            weapons.forEach(playerWeapon => {
                enemy.weapons.forEach(enemyWeapon => {
                    // Calculate player weapon tip position
                    const playerWeaponTipX = player.x + Math.cos(playerWeapon.angle) * (player.size / 2 + playerWeapon.length);
                    const playerWeaponTipY = player.y + Math.sin(playerWeapon.angle) * (player.size / 2 + playerWeapon.length);

                    // Calculate enemy weapon tip position
                    const enemyWeaponTipX = enemy.x + Math.cos(enemyWeapon.angle) * (enemy.size / 2 + enemyWeapon.length);
                    const enemyWeaponTipY = enemy.y + Math.sin(enemyWeapon.angle) * (enemy.size / 2 + enemyWeapon.length);

                    // Simple distance check between weapon tips (can be improved for more accurate collision)
                    const weaponCollisionDistance = Math.sqrt(
                        Math.pow(playerWeaponTipX - enemyWeaponTipX, 2) +
                        Math.pow(playerWeaponTipY - enemyWeaponTipY, 2)
                    );

                    // If weapon tips are close enough, consider it a collision
                    if (weaponCollisionDistance < 30) { 
                        playerWeapon.rotationSpeed *= -1; 
                        enemyWeapon.rotationSpeed *= -1; 
                    }
                });
            });
        }

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

    const newEnemy = { x, y, size, speed, health, scoreValue, color, weapons: [] }; 

    let numEnemyWeapons = 0;
    if (score >= 1000) {
        numEnemyWeapons = 4;
    } else if (score >= 600) {
        numEnemyWeapons = 3;
    } else if (score >= 300) {
        numEnemyWeapons = 2;
    } else if (score >= weaponEnemySpawnThreshold) {
        numEnemyWeapons = 1;
    }

    if (numEnemyWeapons > 0 && Math.random() < 0.5) { 
        const angleIncrement = (Math.PI * 2) / numEnemyWeapons;
        for (let i = 0; i < numEnemyWeapons; i++) {
            newEnemy.weapons.push({
                angle: angleIncrement * i, 
                rotationSpeed: (Math.random() > 0.5 ? 0.03 : -0.03), 
                length: 30,
                color: 'purple'
            });
        }
    }

    enemies.push(newEnemy);
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
            weapons.forEach(w => {
                const increment = 0.05;
                if (w.rotationSpeed < 0) {
                    w.rotationSpeed -= increment;
                } else {
                    w.rotationSpeed += increment;
                }
            });
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

// These functions need to be defined within the DOMContentLoaded scope or passed the elements
// as arguments, as they use the element references.
let scoreDisplay, enemiesDefeatedForPowerUpDisplay, powerUpThresholdDisplay, playerLevelDisplay;
let powerUpSelectionDiv, invincibleModeCheckbox, gameOverScreen, finalScoreDisplay, restartButton;
let upgradeSpeedBtn, upgradeAttackBtn, upgradeRotationBtn, upgradeLengthBtn, upgradeWeaponsBtn;

function updateStatsDisplay() {
    scoreDisplay.textContent = score;
    enemiesDefeatedForPowerUpDisplay.textContent = enemiesDefeated;
    powerUpThresholdDisplay.textContent = powerUpThreshold;
    playerLevelDisplay.textContent = playerLevel;
}

function drawGameOver() {
    gameOverScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = score;
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
    addWeapon(); 

    enemies = [];
    lastEnemySpawnTime = 0;

    invincibleModeCheckbox.checked = false;
    gameOverScreen.classList.add('hidden');
    updateStatsDisplay();
    gameLoop(0); 
}