class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        // Кэшируем часто используемые значения
        this._cachedSpeed = null;
    }

    init(data) {
        this.currentLevel = data.level ?? 0;
        this.score = data.score ?? 0;
        this.lives = data.lives ?? 3;
        this._soundCooldowns = {};
        this._gameEndTriggered = false;
    }

    create() {
        const { width, height } = this.game.config;
        this._cachedSpeed = GAME_CONFIG.ball.speed; // Кэш скорости

        this._createTopMenu(width, height);
        this._setupInput();
        this._createGameObjects(width, height);
        this._createBricks();
        this._setupCollisions();
        this._createUI(width, height);
        this._setupParticles();
        this._setupPause(width);
        this._animateIntro();
        
        // Debounce для коллизий с кирпичами (в мс)
        this.brickCollisionCooldown = 1;
        this.lastBrickCollisionTime = 0;
    }

    // === 🔝 Верхнее меню ===
    _createTopMenu(width, height) {
        const menuHeight = height < UI.MOBILE_BREAKPOINT 
            ? UI.MENU_HEIGHT_MOBILE 
            : UI.MENU_HEIGHT_DESKTOP;
        
        this.menuHeight = menuHeight; // Сохраняем для использования в других методах

        // Фон
        this.topMenuBg = this.add.rectangle(0, 0, width, menuHeight, 0x1a1a2e)
            .setOrigin(0, 0);
        
        // Декоративная линия
        // this.add.rectangle(0, menuHeight, width, 2, 0x00d9ff).setOrigin(0, 0);
        
        // Физическая граница (статичное тело)
        const boundary = this.add.rectangle(width / 2, menuHeight / 2, width, menuHeight, 0, 0);
        this.physics.add.existing(boundary, true);
        this.topMenuBoundary = boundary;
    }

    // === 🎮 Управление ===
    _setupInput() {
        this.cursors = this.input.keyboard?.createCursorKeys();
        
        // Запуск мяча по клику/тапу
        this.input.on('pointerdown', () => {
            if (!this.ball?.isLaunched) {
                this.ball?.launch();
                this.launchText?.destroy();
            }
        });
    }

    // === 🎱 Игровые объекты ===
    _createGameObjects(width, height) {
        this.paddle = new Paddle(this, width / 2, height - UI.PADDLE_Y_OFFSET);
        this.ball = new Ball(this, width / 2, height - UI.PADDLE_Y_OFFSET - UI.BALL_Y_OFFSET);
    }

    // === 🧱 Кирпичи ===
    _createBricks() {
        this.bricks = this.physics.add.group();
        
        const levelData = LEVELS[this.currentLevel];
        if (!levelData) {
            this._endLevel(true);
            return;
        }

        const { width: brickWidth, height: brickHeight, gap } = GAME_CONFIG.brick;
        const totalWidth = levelData[0].length * (brickWidth + gap) - gap;
        const startX = (this.game.config.width - totalWidth) / 2;
        const startY = UI.BRICK_START_Y;
        const textures = ['brick1', 'brick2', 'brick3'];

        levelData.forEach((row, rowIndex) => {
            row.split('').forEach((cell, colIndex) => {
                if (cell !== '0') {
                    const x = startX + colIndex * (brickWidth + gap);
                    const y = startY + rowIndex * (brickHeight + gap);
                    const digit = parseInt(cell, 10);
                    const brick = new Brick(
                        this, x, y, brickWidth, brickHeight, 
                        textures[digit - 1] || 'brick1', 
                        digit * 10
                    );
                    this.bricks.add(brick.sprite);
                }
            });
        });
    }

    // === ⚡ Коллизии ===
    _setupCollisions() {
        this.physics.add.collider(this.ball.sprite, this.paddle.sprite, this.handlePaddleHit, null, this);
        
        // Используем overlap для обработки отскока
        this.physics.add.overlap(this.ball.sprite, this.bricks, this.handleBrickCollision, null, this);
        
        this.physics.add.collider(this.ball.sprite, this.topMenuBoundary);
    }

    // === ✨ Частицы ===
    _setupParticles() {
        try {
            this.particles = this.add.particles(0, 0, 'ball', {
                speed: 100,
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                emitting: false
            });
        } catch {
            this.particles = null;
        }
    }

    // === 📊 UI ===
    _createUI(width, height) {
        const style = { font: UI.TEXT_FONT, color: UI.TEXT_COLOR };
        
        this.scoreText = this.add.text(20, this.menuHeight / 3, `Счет: ${this.score}`, style);
        this.livesText = this.add.text(width - 20 - 70, this.menuHeight / 3, `Жизни: ${this.lives}`, {
            ...style
        }).setOrigin(1, 0);
        this.levelText = this.add.text(width / 2, this.menuHeight / 3, `Уровень: ${this.currentLevel + 1}`, {
            ...style
        }).setOrigin(0.5, 0);

        this.launchText = this.add.text(width / 2, height / 2, 'Нажми для запуска', {
            font: UI.LAUNCH_TEXT_SIZE,
            color: '#00d9ff'
        }).setOrigin(0.5);
    }

    // === ⏸ Пауза ===
    _setupPause(width) {
        this.pauseButton = this.add.text(width - 20, 5, '⏸', {
            font: '28px Arial',
            color: '#ffffff',
            backgroundColor: '#00d9ff',
            padding: { x: 12, y: 8 }
        })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this._onButtonHover(this.pauseButton, '#00b8d9'))
            .on('pointerout', () => this._onButtonHover(this.pauseButton, '#00d9ff'))
            .on('pointerdown', () => this.pauseGame());
        
        this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey?.on('up', () => this.pauseGame());
        
        this.soundEnabled = true;
        this.musicEnabled = true;
    }

    // === 🎬 Анимация появления ===
    _animateIntro() {
        // Меню выезжает
        this.topMenuBg.setY(-this.menuHeight);
        this.tweens.add({
            targets: this.topMenuBg,
            y: 0,
            duration: 400,
            ease: 'Power2.out'
        });

        // Текст появляется каскадом
        [
            { target: this.scoreText, delay: 200 },
            { target: this.livesText, delay: 300 },
            { target: this.levelText, delay: 400 }
        ].forEach(({ target, delay }) => this._fadeIn(target, delay));
    }

    _fadeIn(target, delay) {
        target.setAlpha(0);
        this.tweens.add({
            targets: target,
            alpha: 1,
            delay,
            duration: 300
        });
    }

    _onButtonHover(button, color) {
        button.setStyle({ backgroundColor: color });
    }

    // === 🔊 Звуки ===
    playSound(key, { volume = 0.3, cooldownMs = 60 } = {}) {
        if (!this.soundEnabled || !this.sound) return;
        
        const now = this.time.now;
        if (now - (this._soundCooldowns[key] ?? -Infinity) < cooldownMs) return;
        
        this._soundCooldowns[key] = now;
        this.sound.play(key, { volume });
    }

    // === 🎱 Обработка ударов ===
    handlePaddleHit(ballSprite, paddleSprite) {
        const hitPoint = ballSprite.x - paddleSprite.x;
        const normalizedHit = Phaser.Math.Clamp(hitPoint / (paddleSprite.width / 2), -1, 1);
        
        const maxAngleRad = Phaser.Math.DegToRad(80);
        const targetAngle = normalizedHit * maxAngleRad;
        const speed = this._cachedSpeed;
        
        const newVx = Math.sin(targetAngle) * speed;
        const newVy = -Math.cos(targetAngle) * speed;
        
        // Добавляем микро-рандом для естественности
        const jitter = Phaser.Math.FloatBetween(-0.05, 0.05) * speed;
        ballSprite.body.setVelocity(newVx + jitter, newVy);
        
        this.playSound('hit', { volume: 0.3, cooldownMs: 40 });
    }

    handleBrickCollision(ballSprite, brickSprite) {
        // Debounce: пропускаем коллизии, если прошло слишком мало времени
        const now = this.time.now;
        if (now - this.lastBrickCollisionTime < this.brickCollisionCooldown) {
            return;
        }
        this.lastBrickCollisionTime = now;

        // Гвард-клаузы для раннего выхода
        if (!brickSprite?.active || !brickSprite.body?.enable || !brickSprite?._brick) return;

        const brick = brickSprite._brick;

        // === ОТСКАКИВАЕМ ДО удара по кирпичу ===
        this.bounceOffBrick(ballSprite, brickSprite);

        if (!brick.hit()) {
            this.sound?.play('hit', { volume: 0.2 });
            return;
        }

        // Эффекты
        this.score += brick.points;
        this.scoreText.setText(`Счет: ${this.score}`);
        this.sound?.play('knock', { volume: 0.2 });
        this.particles?.emitParticleAt(brickSprite.x, brickSprite.y, 10);

        // Безопасное удаление кирпича
        this._destroyBrick(brickSprite);
    }

    bounceOffBrick(ballSprite, brickSprite) {
        const ballBody = ballSprite.body;

        // Определяем сторону столкновения по позиции
        const ballCenterX = ballSprite.x;
        const ballCenterY = ballSprite.y;
        const brickCenterX = brickSprite.x + brickSprite.displayWidth / 2;
        const brickCenterY = brickSprite.y + brickSprite.displayHeight / 2;

        const dx = Math.abs(ballCenterX - brickCenterX);
        const dy = Math.abs(ballCenterY - brickCenterY);

        // Вычисляем половины размеров (используем displayWidth/displayHeight для спрайтов)
        const halfWidth = ballSprite.displayWidth / 2 + brickSprite.displayWidth / 2;
        const halfHeight = ballSprite.displayHeight / 2 + brickSprite.displayHeight / 2;

        // Определяем пересечение по осям
        const overlapX = halfWidth - dx;
        const overlapY = halfHeight - dy;

        if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
                // Удар сбоку - меняем X
                ballBody.setVelocityX(-ballBody.velocity.x);
            } else {
                // Удар сверху/снизу - меняем Y
                ballBody.setVelocityY(-ballBody.velocity.y);
            }
        }
    }

    _destroyBrick(brickSprite) {
        // 1. Сначала запрещаем новые коллизии, но оставляем тело активным
        if (brickSprite?.body) {
            brickSprite.body.checkCollision.none = true;  // Игнорировать новые столкновения
            brickSprite.body.immovable = true;            // На всякий случай
            // ❌ НЕ делаем enable = false сразу!
        }
        
        // 2. Скрываем визуально
        brickSprite?.setVisible(false);
        brickSprite?.setActive(false);
        
        // 3. Полное удаление с задержкой (1-2 кадра достаточно)
        this.time.delayedCall(1, () => {  // 1 = 1 кадр, не 1мс!
            if (brickSprite?.body) {
                brickSprite.body.enable = false;  // Теперь можно отключить
            }
            brickSprite?.destroy();  // Удаляем из памяти
        });
    }
    
    // === ⚙️ Поддержание скорости (опционально) ===
    keepBallMoving() {
        const ball = this.ball;
        if (!ball?.isLaunched) return;
        
        const body = ball.sprite?.body;
        if (!body) return;

        const speed = this._cachedSpeed;
        const currSpeed = Math.hypot(body.velocity.x, body.velocity.y);
        
        // Только экстренная коррекция (если скорость упала ниже 90%)
        if (currSpeed > 0 && currSpeed < speed * 0.9) {
            const k = speed / currSpeed;
            body.setVelocity(body.velocity.x * k, body.velocity.y * k);
        }
    }

    // === 💔 Потеря жизни ===
    loseLife() {
        if (this._gameEndTriggered) return;
        
        this.lives--;
        this.livesText.setText(`Жизни: ${this.lives}`);
        this.playSound('lose', { volume: 0.3, cooldownMs: 250 });
        
        if (this.lives <= 0) {
            this._endLevel(false);
        } else {
            this._resetBall();
        }
    }

    _resetBall() {
        this.ball?.reset(this.paddle.x, this.paddle.y - 45);
        if (!this.launchText) {
            this.launchText = this.add.text(
                this.game.config.width / 2, 
                this.game.config.height / 2, 
                'Нажми для запуска', {
                    font: UI.LAUNCH_TEXT_SIZE,
                    color: '#00d9ff'
                }
            ).setOrigin(0.5);
        }
    }

    // === 🏁 Завершение уровня ===
    _endLevel(win) {
        this._gameEndTriggered = true;
        if (win)  { this.playSound('win', { volume: 0.3, cooldownMs: 250 }); return;}
        
        this.scene.start('GameOver', { 
            win, 
            score: this.score,
            level: this.currentLevel 
        });
    }

    // === ⏸ Пауза ===
    pauseGame() {
        if (this._gameEndTriggered) return;
        
        this.scene.launch('Pause', { 
            previousScene: 'Game',
            sceneData: {
                score: this.score,
                lives: this.lives,
                currentLevel: this.currentLevel
            }
        });
    }

    // === 🔄 Игровой цикл ===
    update() {
        if (this._gameEndTriggered) return;

        this.paddle?.update();
        this.ball?.update();
        this.keepBallMoving(); // Поддерживаем скорость мяча

        // Проверка победы
        if (this.bricks?.countActive(true) === 0 && this.bricks?.getLength() > 0) {
            this._endLevel(true);
            this.scene.start('Game', {
                level: this.currentLevel + 1,
                score: this.score,
                lives: this.lives
            });
        }
    }
}