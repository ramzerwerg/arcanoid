class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.currentLevel = data.level ?? 0;
        this.score = data.score ?? 0;
        this.lives = data.lives ?? 3;
        this._soundCooldowns = {};
        this._gameEndTriggered = false;
        this._isProcessingLifeLoss = false;
        this._deathZoneProcessingScheduled = false;
        this._ballsToRemove = null;
        this.highScore = parseInt(localStorage.getItem('arkanoid_highScore') || '0', 10);
        this._cachedSpeed = GAME_CONFIG.ball.speed;
        this.brickCollisionCooldown = 1;
    }

    create() {
        const { width, height } = this.game.config;

        UIHelper.createBackground(this, 'bg_arena');
        this._createTopMenu(width, height);
        this._createUI(width, height);
        this._createBorders(width, height);
        this._setupInput();
        this._createGameObjects(width, height);
        this._createBricks();
        this._setupCollisions();
        this._setupParticles();
        this._setupPause(width);
        this._animateIntro();
    }

    // === Инициализация ===
    _createTopMenu(width, height) {
        const menuHeight = height < UI.MOBILE_BREAKPOINT ? UI.MENU_HEIGHT_MOBILE : UI.MENU_HEIGHT_DESKTOP;
        this.menuHeight = menuHeight;

        this.topMenuBg = this.add.image(width / 2, menuHeight, 'menu_bar')
            .setOrigin(0.5, 0)
            .setDisplaySize(width - 10, menuHeight);

        const boundary = this.add.rectangle(width / 2, menuHeight + 20, width, menuHeight + 20, 0, 0);
        this.physics.add.existing(boundary, true);
        this.topMenuBoundary = boundary;
    }

    _createUI(width, height) {
        const style = { fontSize: UI.TEXT_SIZE, fontFamily: UI.TEXT_FONT, color: UI.TEXT_COLOR };
        const smallStyle = { fontSize: '14px', fontFamily: UI.TEXT_FONT, color: '#666666' };

        this.scoreText = this.add.text(20, this.menuHeight / 3 - 5, `Счет:${this.score}`, style);
        this.highScoreText = this.add.text(20, this.menuHeight / 3 + 25, `Рекорд:${this.highScore}`, smallStyle);

        this.add.image(width - 180, this.menuHeight / 3 + 20, 'ball').setDisplaySize(40, 40);
        this.livesText = this.add.text(width - 160, this.menuHeight / 3 + 10, `:${this.lives}`, style);

        this.levelText = this.add.text(width / 2, this.menuHeight / 3 + 5, `Уровень ${this.currentLevel + 1}`, {
            ...style
        }).setOrigin(0.5, 0);

        this.launchText = this.add.text(width / 2, height / 2, 'Нажми для запуска', {
            fontSize: UI.LAUNCH_TEXT_SIZE,
            fontFamily: UI.TEXT_FONT,
            color: '#E5E5E5',
            stroke: "#424141",
            strokeThickness: 8,
        }).setOrigin(0.5);
    }

    _createBorders(width, height) {
        const borderWidth = 20;
        const borderHeight = height * 2;
        this.borderHeight = borderHeight;
        this.borderWidth = borderWidth;

        const leftBoundary = this.add.rectangle(borderWidth / 2, 0, borderWidth, borderHeight, 0, 0);
        this.physics.add.existing(leftBoundary, true);
        this.leftBorderBoundary = leftBoundary;

        const rightBoundary = this.add.rectangle(width - borderWidth / 2, 0, borderWidth, borderHeight, 0, 0);
        this.physics.add.existing(rightBoundary, true);
        this.rightBorderBoundary = rightBoundary;

        // Зона смерти
        const deathZoneHeight = 50;
        const deathZone = this.add.rectangle(width / 2, height + deathZoneHeight / 2, width, deathZoneHeight, 0x000000, 0);
        this.physics.add.existing(deathZone, true);
        this.deathZone = deathZone;
    }

    _setupInput() {
        this.cursors = this.input.keyboard?.createCursorKeys();

        this.input.on('pointerdown', () => {
            if (AudioManager.isIOSDevice && !AudioManager.iosUnlocked) {
                AudioManager.forceUnlock(this);
            }
            if (!this.ball?.isLaunched) {
                this.ball?.launch();
                this.launchText?.destroy();
            }
        });
    }

    _createGameObjects(width, height) {
        this.paddle = new Paddle(this, width / 2, height - UI.PADDLE_Y_OFFSET);
        this.ball = new Ball(this, width / 2, height - UI.PADDLE_Y_OFFSET - UI.BALL_Y_OFFSET);
        this.balls = [this.ball];
        this.bonuses = [];
    }

    _createBricks() {
        this.bricks = this.physics.add.group();
        this.bonusGroup = this.physics.add.group();

        const levelData = LEVELS[this.currentLevel];
        if (!levelData) {
            this._endLevel(true);
            return;
        }

        const { width: brickWidth, height: brickHeight, gap } = GAME_CONFIG.brick;
        const totalWidth = levelData[0].length * (brickWidth + gap) - gap;
        const startX = (this.game.config.width - totalWidth) / 2;
        const textures = ['brick1', 'brick2', 'brick3', 'brickTNT'];

        levelData.forEach((row, rowIndex) => {
            row.split('').forEach((cell, colIndex) => {
                if (cell !== '0') {
                    const x = startX + colIndex * (brickWidth + gap);
                    const y = UI.BRICK_START_Y + rowIndex * (brickHeight + gap);
                    const digit = parseInt(cell, 10);

                    const texture = digit === 4 ? 'brickTNT' : textures[digit - 1] || 'brick1';
                    const points = digit === 4 ? 50 : digit * 10;

                    const brick = new Brick(this, x, y, brickWidth, brickHeight, texture, points);
                    this.bricks.add(brick.sprite);
                }
            });
        });
    }

    _setupCollisions() {
        this.physics.add.collider(this.ball.sprite, this.paddle.sprite, this.handlePaddleHit, null, this);
        this.physics.add.overlap(this.ball.sprite, this.bricks, this.handleBrickCollision, null, this);

        const bounceSound = () => this.playSound('bounce', { volume: 0.5 });
        this.physics.add.collider(this.ball.sprite, this.topMenuBoundary, bounceSound);
        this.physics.add.collider(this.ball.sprite, this.leftBorderBoundary, bounceSound);
        this.physics.add.collider(this.ball.sprite, this.rightBorderBoundary, bounceSound);

        this.physics.add.collider(this.paddle.sprite, this.leftBorderBoundary);
        this.physics.add.collider(this.paddle.sprite, this.rightBorderBoundary);

        this.ball.sprite.body.onWorldBounds = true;
        this.physics.world.on('worldbounds', bounceSound);

        this.physics.add.overlap(this.paddle.sprite, this.bonusGroup, this._handleBonusCollection, null, this);
        this.physics.add.overlap(this.ball.sprite, this.deathZone, this._onBallInDeathZone, null, this);
    }

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

    _setupPause(width) {
        this.pauseButton = this.add.image(width - 60, 50, 'pause')
            .setOrigin(0.5, 0.5)
            .setScale(1.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.pauseGame());

        this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey?.on('up', () => this.pauseGame());
    }

    _animateIntro() {
        this.topMenuBg.setY(-this.menuHeight);
        this.tweens.add({
            targets: this.topMenuBg,
            y: 0,
            duration: 400,
            ease: 'Power2.out'
        });

        [
            { target: this.scoreText, delay: 200 },
            { target: this.livesText, delay: 300 },
            { target: this.levelText, delay: 400 }
        ].forEach(({ target, delay }) => {
            target.setAlpha(0);
            this.tweens.add({ targets: target, alpha: 1, delay, duration: 300 });
        });
    }

    // === Звуки ===
    playSound(key, { volume = 0.5, cooldownMs = 60 } = {}) {
        if (!AudioManager.isSFXEnabled() || !this.sound) return;

        if (AudioManager.isIOSDevice) {
            const audioContext = this.sound.context;
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }

        const now = this.time.now;
        if (now - (this._soundCooldowns[key] ?? -Infinity) < cooldownMs) return;

        this._soundCooldowns[key] = now;
        this.sound.play(key, { volume });
    }

    // === Физика мяча ===
    handlePaddleHit(ballSprite, paddleSprite) {
        const hitPoint = ballSprite.x - paddleSprite.x;
        const normalizedHit = Phaser.Math.Clamp(hitPoint / (paddleSprite.width / 2), -1, 1);
        const targetAngle = normalizedHit * Phaser.Math.DegToRad(80);
        const currentSpeed = Math.hypot(ballSprite.body.velocity.x, ballSprite.body.velocity.y);
        const speed = Math.max(currentSpeed, this._cachedSpeed);

        const jitter = Phaser.Math.FloatBetween(-0.05, 0.05) * speed;
        ballSprite.body.setVelocity(
            Math.sin(targetAngle) * speed + jitter,
            -Math.cos(targetAngle) * speed
        );

        this.playSound('bounce', { volume: 0.5, cooldownMs: 40 });
    }

    handleBrickCollision(ballSprite, brickSprite) {
        if (!brickSprite?.active || !brickSprite.body?.enable || !brickSprite?._brick) return;

        const brick = brickSprite._brick;
        this.bounceOffBrick(ballSprite, brickSprite);

        if (!brick.hit()) {
            this.playSound('bounce', { volume: 0.5 });
            return;
        }

        if (brick.shouldDropBonus()) {
            this._spawnBonus(brickSprite.x + brickSprite.displayWidth / 2, brickSprite.y + brickSprite.displayHeight / 2, brick.getBonusType());
        }

        this.score += brick.points;
        this.scoreText.setText(`Счет:${this.score}`);

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreText.setText(`Рекорд: ${this.highScore}`);
            localStorage.setItem('arkanoid_highScore', this.highScore.toString());
        }

        if (brick.isTNT) {
            brick.explode();
        } else {
            this.playSound('hit', { volume: 0.5 });
        }

        this.particles?.emitParticleAt(brickSprite.x, brickSprite.y, 10);
        this._showFloatingText(brickSprite.x, brickSprite.y, brick.points.toString());
        this._destroyBrick(brickSprite);
    }

    bounceOffBrick(ballSprite, brickSprite) {
        const ballBody = ballSprite.body;
        const dx = Math.abs(ballSprite.x - (brickSprite.x + brickSprite.displayWidth / 2));
        const dy = Math.abs(ballSprite.y - (brickSprite.y + brickSprite.displayHeight / 2));

        const halfWidth = ballSprite.displayWidth / 2 + brickSprite.displayWidth / 2;
        const halfHeight = ballSprite.displayHeight / 2 + brickSprite.displayHeight / 2;
        const overlapX = halfWidth - dx;
        const overlapY = halfHeight - dy;

        if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
                ballBody.setVelocityX(-ballBody.velocity.x);
            } else {
                ballBody.setVelocityY(-ballBody.velocity.y);
            }
        }
    }

    // === Бонусы ===
    _spawnBonus(x, y, type) {
        const bonus = new Bonus(this, x, y, type);
        this.bonuses.push(bonus);
        this.bonusGroup.add(bonus.sprite);
        bonus.body.setVelocityY(150);
    }

    _handleBonusCollection(paddleSprite, bonusSprite) {
        const bonus = bonusSprite._bonus;
        if (bonus && bonus.isActive) {
            bonus.activate();
            this.playSound('bonus', { volume: 0.5 });
            this.bonuses = this.bonuses.filter(b => b !== bonus);
        }
    }

    _updateBonuses() {
        const height = this.game.config.height;

        for (let i = this.bonuses.length - 1; i >= 0; i--) {
            const bonus = this.bonuses[i];

            if (!bonus.isActive || bonus.y > height) {
                bonus.sprite?.destroy();
                this.bonuses.splice(i, 1);
            }
        }

        this.bonusGroup.children.iterate((child) => {
            if (child && !child.active) {
                this.bonusGroup.remove(child, true);
            }
        });
    }

    _clearAllBonuses() {
        this.bonuses.forEach(bonus => bonus.sprite?.destroy());
        this.bonuses = [];
        this.bonusGroup?.clear(true, true);
    }

    // === Зона смерти ===
    _onBallInDeathZone(ballSprite) {
        const ball = this.balls.find(b => b.sprite === ballSprite);
        if (!ball || ball._inDeathZone) return;

        ball._inDeathZone = true;
        ball.body.setVelocity(0, 0);

        if (!this._ballsToRemove) this._ballsToRemove = new Set();
        this._ballsToRemove.add(ball);

        if (!this._deathZoneProcessingScheduled) {
            this._deathZoneProcessingScheduled = true;
            this.time.delayedCall(100, () => this._processDeathZoneLosses());
        }
    }

    _processDeathZoneLosses() {
        if (!this._ballsToRemove?.size) {
            this._deathZoneProcessingScheduled = false;
            return;
        }

        this._ballsToRemove.forEach(ball => {
            const idx = this.balls.indexOf(ball);
            if (idx !== -1) this.balls.splice(idx, 1);
            ball.sprite?.destroy();
        });
        this._ballsToRemove.clear();

        if (this.balls.length === 0) this._handleAllBallsLost();
        this._deathZoneProcessingScheduled = false;
    }

    _handleAllBallsLost() {
        if (this._gameEndTriggered || this._isProcessingLifeLoss) return;

        this._isProcessingLifeLoss = true;
        this.lives--;
        this.livesText.setText(`:${this.lives}`);
        this.playSound('lose', { volume: 0.7, cooldownMs: 250 });
        this._clearAllBonuses();

        if (this.lives <= 0) {
            this._endLevel(false);
        } else {
            this._resetBallToPaddle();
        }
        this._isProcessingLifeLoss = false;
    }

    _resetBallToPaddle() {
        const { width, height } = this.game.config;

        this.balls.forEach(ball => ball.sprite?.destroy());
        this.balls = [];

        this.ball = new Ball(this, width / 2, height - UI.PADDLE_Y_OFFSET - UI.BALL_Y_OFFSET);
        this.balls = [this.ball];

        this.physics.add.collider(this.ball.sprite, this.paddle.sprite, this.handlePaddleHit, null, this);
        this.physics.add.overlap(this.ball.sprite, this.bricks, this.handleBrickCollision, null, this);

        const bounceSound = () => this.playSound('bounce', { volume: 0.5 });
        this.physics.add.collider(this.ball.sprite, this.topMenuBoundary, bounceSound);
        this.physics.add.collider(this.ball.sprite, this.leftBorderBoundary, bounceSound);
        this.physics.add.collider(this.ball.sprite, this.rightBorderBoundary, bounceSound);
        this.physics.add.overlap(this.ball.sprite, this.deathZone, this._onBallInDeathZone, null, this);

        if (!this.launchText) {
            this.launchText = this.add.text(width / 2, height / 2, 'Нажми для запуска', {
                fontSize: UI.LAUNCH_TEXT_SIZE,
                color: '#fafdf4'
            }).setOrigin(0.5);
        }
    }

    // === Утилиты ===
    _showFloatingText(x, y, text, color = '#ffffff') {
        const floatingText = this.add.text(x, y, `+${text}`, {
            fontSize: UI.TEXT_SIZE,
            fontFamily: UI.TEXT_FONT,
            color,
            stroke: '#424141',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power2.out',
            onComplete: () => floatingText.destroy()
        });
    }

    _destroyBrick(brickSprite) {
        if (brickSprite?.body) {
            brickSprite.body.checkCollision.none = true;
            brickSprite.body.immovable = true;
        }
        brickSprite?.setVisible(false).setActive(false);

        this.time.delayedCall(1, () => {
            if (brickSprite?.body) brickSprite.body.enable = false;
            brickSprite?.destroy();
        });
    }

    keepBallMoving() {
        this.balls.forEach(ball => {
            if (!ball?.isLaunched) return;
            const body = ball.sprite?.body;
            if (!body) return;

            const currSpeed = Math.hypot(body.velocity.x, body.velocity.y);
            if (currSpeed > 0 && currSpeed < this._cachedSpeed * 0.9) {
                const k = this._cachedSpeed / currSpeed;
                body.setVelocity(body.velocity.x * k, body.velocity.y * k);
            }
        });
    }

    _revertSpeedBoost() {
        const baseSpeed = this._cachedSpeed;
        const maxSpeed = baseSpeed * 1.3;

        this.balls.forEach(ball => {
            if (!ball?.isLaunched || !ball.sprite?.body) return;

            const body = ball.sprite.body;
            const currentSpeed = Math.hypot(body.velocity.x, body.velocity.y);

            if (currentSpeed > baseSpeed && currentSpeed <= maxSpeed * 1.1) {
                const dirX = body.velocity.x / currentSpeed;
                const dirY = body.velocity.y / currentSpeed;
                body.setVelocity(dirX * baseSpeed, dirY * baseSpeed);
            }
        });
    }

    // === Пауза и завершение ===
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

    _endLevel(win) {
        this._gameEndTriggered = true;

        if (win) {
            this.playSound('win', { volume: 0.7, cooldownMs: 250 });
            const totalLevels = GameStorage.getTotalLevels();
            const isLastLevel = this.currentLevel >= totalLevels - 1;

            if (isLastLevel) {
                GameStorage.setMaxLevel(this.currentLevel + 1);
                this.scene.start('GameOver', { win, score: this.score, level: this.currentLevel });
            } else {
                const nextLevel = this.currentLevel + 1;
                GameStorage.setMaxLevel(nextLevel);
                this.scene.start('Game', { level: nextLevel, score: this.score, lives: this.lives });
            }
            return;
        }

        this.scene.start('GameOver', { win, score: this.score, level: this.currentLevel });
    }

    update() {
        if (this._gameEndTriggered) return;

        this.paddle?.update();
        this.balls.forEach(ball => ball?.update());
        this._updateBonuses();
        this.keepBallMoving();

        // Проверка победы (все кирпичи уничтожены)
        if (this.bricks.countActive(true) === 0 && !this._gameEndTriggered) {
            this._endLevel(true);
        }
    }
}
