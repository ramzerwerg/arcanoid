class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.currentLevel = data.level || 0;
        this.score = data.score || 0;
        this.lives = data.lives || 3;
    }

    create() {
        // Включить отладочную отрисовку физики
        const { width, height } = this.game.config;
        this._soundCooldowns = {};
        this._gameEndTriggered = false;


        // Курсоры для управления
        this.cursors = this.input.keyboard?.createCursorKeys();

        // Создаем ракетку и мяч (теперь это обёртки, а не GameObjects)
        this.paddle = new Paddle(this, width / 2, height - 100);
        this.ball = new Ball(this, width / 2, height - 120);

        // Создаем кирпичи
        this.createBricks();

        // ⚠️ Коллизии: передаём .sprite, так как физика висит на спрайте
        this.physics.add.collider(this.ball.sprite, this.paddle.sprite, this.handlePaddleHit, null, this);
        this.physics.add.collider(this.ball.sprite, this.bricks, this.handleBrickHit, null, this);

        // Текст счета и жизней
        this.scoreText = this.add.text(20, 20, `Счет: ${this.score}`, {
            font: '24px Arial',
            color: '#ffffff'
        });

        this.livesText = this.add.text(width - 20, 20, `Жизни: ${this.lives}`, {
            font: '24px Arial',
            color: '#ffffff'
        }).setOrigin(1, 0);

        this.levelText = this.add.text(width / 2, 20, `Уровень: ${this.currentLevel + 1}`, {
            font: '24px Arial',
            color: '#ffffff'
        }).setOrigin(0.5, 0);

        // Текст для запуска мяча
        this.launchText = this.add.text(width / 2, height / 2, 'Нажми для запуска', {
            font: '32px Arial',
            color: '#00d9ff'
        }).setOrigin(0.5);

        // Запуск мяча по клику
        this.input.on('pointerdown', () => {
            if (!this.ball.isLaunched) {
                this.ball.launch();
                this.launchText?.destroy();
            }
        });

        // Частицы для эффектов (если текстура 'ball' загрузилась)
        try {
            this.particles = this.add.particles(0, 0, 'ball', {
                speed: 100,
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                emitting: false
            });
        } catch (e) {
            // Если частицы не работают — просто пропускаем
            this.particles = null;
        }
    }

    createBricks() {
        // ⚠️ Сначала создаём группу!
        this.bricks = this.physics.add.group();
        
        const levelData = LEVELS[this.currentLevel];
        
        if (!levelData) {
            // Уровни кончились - победа
            this._gameEndTriggered = true;
            this.scene.start('GameOver', { win: true, score: this.score });
            return;
        }

        const brickWidth = GAME_CONFIG.brick.width;
        const brickHeight = GAME_CONFIG.brick.height;
        const gap = GAME_CONFIG.brick.gap;
        const totalWidth = levelData[0].length * (brickWidth + gap) - gap;
        const startX = (this.game.config.width - totalWidth) / 2;
        const startY = 200;

        const textureByDigit = ['brick1', 'brick2', 'brick3'];

        levelData.forEach((row, rowIndex) => {
            row.split('').forEach((cell, colIndex) => {
                if (cell !== '0') {
                    const x = startX + colIndex * (brickWidth + gap);
                    const y = startY + rowIndex * (brickHeight + gap);

                    const digit = parseInt(cell, 10);
                    const textureKey = textureByDigit[digit - 1] || 'brick1';
                    const brick = new Brick(this, x, y, brickWidth, brickHeight, textureKey, digit * 10);
                    
                    // ⚠️ Добавляем в группу .sprite, а не сам объект-обёртку
                    this.bricks.add(brick.sprite);
                }
            });
        });
    }

    playSound(key, { volume = 0.3, cooldownMs = 60 } = {}) {
        if (!this.sound) return;
        const now = this.time.now;
        const last = this._soundCooldowns?.[key] ?? -Infinity;
        if (now - last < cooldownMs) return;
        this._soundCooldowns[key] = now;
        this.sound.play(key, { volume });
    }

    handlePaddleHit(ballSprite, paddleSprite) {
        // === 1. Где мяч ударил по ракетке: -1 (левый край) ... 0 (центр) ... +1 (правый край) ===
        const hitPoint = ballSprite.x - paddleSprite.x;
        const normalizedHit = Phaser.Math.Clamp(
            hitPoint / (paddleSprite.width / 2), 
            -1, 
            1
        );
        
        // === 2. Настройки угла отскока ===
        const maxAngleDeg = 60;  // Максимальное отклонение от вертикали (в градусах)
        const maxAngleRad = Phaser.Math.DegToRad(maxAngleDeg);
        
        // === 3. Целевой угол: отрицательный = влево, положительный = вправо ===
        // Умножаем на normalizedHit: чем дальше от центра, тем больше угол
        const targetAngle = normalizedHit * maxAngleRad;
        
        // === 4. Скорость мяча ===
        const speed = this.ball?.speed ?? GAME_CONFIG.ball.speed;
        
        // === 5. Рассчитываем новый вектор скорости ===
        // Важно: в Phaser ось Y растёт ВНИЗ, поэтому:
        // - чтобы лететь ВВЕРХ, velocity.y должен быть ОТРИЦАТЕЛЬНЫМ
        // - cos(0) = 1, поэтому -cos(angle) даёт отрицательный Y (вверх)
        // - sin(angle) даёт отклонение по горизонтали
        const newVx = Math.sin(targetAngle) * speed;
        const newVy = -Math.cos(targetAngle) * speed;  // Минус = всегда вверх!
        
        ballSprite.body.setVelocity(newVx, newVy);
        
        // === 6. Звук и эффекты ===
        this.playSound('bounce', { volume: 0.3, cooldownMs: 40 });
        
        // === 7. (Опционально) Добавляем микро-рандом для "живости" ===
        // Это предотвращает зацикливание траекторий
        /*
        const randomJitter = Phaser.Math.FloatBetween(-0.05, 0.05);
        ballSprite.body.setVelocity(
            newVx + randomJitter * speed,
            newVy
        );
        */
    }

    handleBrickHit(ballSprite, brickSprite) {
        // === 1. Проверка: существует ли обёртка ===
        if (!brickSprite?._brick) return;  // Если нет ссылки на Brick — выходим

        const brick = brickSprite._brick;  // ✅ Получаем экземпляр Brick

        // === 2. Вызываем hit() и проверяем результат ===
        const wasDestroyed = brick.hit();  // ✅ Вызов метода hit()

        if (!wasDestroyed) {
            // Если у кирпича было несколько жизней (hp > 1) и он не уничтожен
            // Можно добавить звук удара без уничтожения
            this.sound?.play('bounce', { volume: 0.2 });
            return;
        }

        // === 3. Кирпич уничтожен — удаляем его ===
        brick.destroy();

        // === 4. Начисляем очки и эффекты ===
        this.score += brick.points;
        this.scoreText.setText(`Счет: ${this.score}`);

        this.sound?.play('hit', { volume: 0.2 });

        if (this.particles) {
            this.particles.emitParticleAt(brickSprite.x, brickSprite.y, 10);
        }

        this.cameras.main.shake(100, 0.005);

        // === 5. Логика отскока мяча (классический арканоид) ===
        const ballBody = ballSprite.body;

        // Границы кирпича
        const brickLeft = brickSprite.x;
        const brickRight = brickSprite.x + brickSprite.width;
        const brickTop = brickSprite.y;
        const brickBottom = brickSprite.y + brickSprite.height;

        // Центр мяча
        const ballCenterX = ballSprite.x;
        const ballCenterY = ballSprite.y;

        // Вычисляем перекрытия с каждой гранью
        const overlapLeft = ballCenterX - brickLeft;
        const overlapRight = brickRight - ballCenterX;
        const overlapTop = ballCenterY - brickTop;
        const overlapBottom = brickBottom - ballCenterY;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        // Инвертируем соответствующую компоненту скорости в зависимости от стороны удара
        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
            // Удар по боковой грани → инвертируем горизонтальную скорость
            ballBody.setVelocityX(-ballBody.velocity.x);
        } else if (minOverlap === overlapTop || minOverlap === overlapBottom) {
            // Удар по верхней/нижней грани → инвертируем вертикальную скорость
            ballBody.setVelocityY(-ballBody.velocity.y);
        }
    }
    
    loseLife() {
        if (this._gameEndTriggered) return;
        this.lives--;
        this.livesText.setText(`Жизни: ${this.lives}`);
        
        this.playSound('lose', { volume: 0.3, cooldownMs: 250 });
        
        if (this.lives <= 0) {
            this._gameEndTriggered = true;
            this.scene.start('GameOver', { win: false, score: this.score });
        } else {
            // Сброс мяча
            this.ball.reset(this.paddle.x, this.paddle.y - 15);
            
            if (!this.launchText) {
                this.launchText = this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'Нажми для запуска', {
                    font: '32px Arial',
                    color: '#00d9ff'
                }).setOrigin(0.5);
            }
        }
    }

    keepBallMoving() {
        if (!this.ball?.isLaunched) return;
        const body = this.ball.sprite?.body;
        if (!body) return;

        const speed = this.ball?.speed ?? GAME_CONFIG.ball.speed;
        const currSpeed = Math.hypot(body.velocity.x, body.velocity.y);
        
        // Допустимый диапазон: 95%...105% от целевой скорости
        const minSpeed = speed * 0.95;
        const maxSpeed = speed * 1.05;
        
        // Корректируем ТОЛЬКО если скорость вышла за пределы
        if (currSpeed < minSpeed || currSpeed > maxSpeed) {
            // Сохраняем направление через нормализацию
            if (currSpeed > 0) {
                const nx = body.velocity.x / currSpeed;  // Единичный вектор X
                const ny = body.velocity.y / currSpeed;  // Единичный вектор Y
                body.setVelocity(nx * speed, ny * speed);
            } else {
                // Если скорость 0 — просто вверх
                body.setVelocity(0, -speed);
            }
        }
        // Если скорость в норме — НИЧЕГО НЕ ДЕЛАЕМ (направление не трогаем!)
    }

    update() {
        if (this._gameEndTriggered) return;
        this.paddle?.update();
        this.ball?.update();

        this.keepBallMoving();

        // Проверка победы на уровне
        if (this.bricks?.countActive(true) === 0 && this.bricks?.getLength() > 0) {
            this._gameEndTriggered = true;
            this.playSound('win', { volume: 0.3, cooldownMs: 250 });
            this.scene.start('Game', { 
                level: this.currentLevel + 1, 
                score: this.score, 
                lives: this.lives 
            });
        }
    }
}