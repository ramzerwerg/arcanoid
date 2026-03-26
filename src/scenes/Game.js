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
        this._isProcessingLifeLoss = false;
        this._deathZoneProcessingScheduled = false;
        this._ballsToRemove = null;

        // Загружаем рекорд из localStorage
        this.highScore = parseInt(localStorage.getItem('arkanoid_highScore') || '0', 10);
    }

    create() {
        const { width, height } = this.game.config;

        let bg_arena = this.add.image(0, 0, 'bg_arena').setOrigin(0, 0);
        bg_arena.displayWidth = width
        bg_arena.displayHeight = height;

        this._cachedSpeed = GAME_CONFIG.ball.speed; // Кэш скорости

        this._createTopMenu(width, height);     // Создание меню сверху
        this._createUI(width, height);          // Создание кнопок для меню паузы
        this._createBorders(width, height);     // Создание границ (слева, справа)
        this._setupInput();                     // Назначение унопок управления
        this._createGameObjects(width, height); // Создание гровых объектов (Платформа, мячи, бонусы)
        this._createBricks();                   // Генерация кирпичей на уровне
        this._setupCollisions();                // Установка коллизий
        this._setupParticles();                 // Установка частиц при взрыве кирпичика
        this._setupPause(width);                // Создание паузы
        this._animateIntro();                   // Анимация выдвижения паузы
        
        // Debounce для коллизий с кирпичами (в мс)
        this.brickCollisionCooldown = 1;
        this.lastBrickCollisionTime = 0;
    }

    // === Верхнее меню ===
    _createTopMenu(width, height) {
        const menuHeight = height < UI.MOBILE_BREAKPOINT 
            ? UI.MENU_HEIGHT_MOBILE 
            : UI.MENU_HEIGHT_DESKTOP;
        
        this.menuHeight = menuHeight; // Сохраняем для использования в других методах

        // Фон
        this.topMenuBg = this.add.image(width / 2, menuHeight, 'menu_bar').setOrigin(0.5, 0).setDisplaySize(width - 10, menuHeight)

        // Физическая граница (статичное тело)
        const boundary = this.add.rectangle(width / 2, menuHeight + 20, width, menuHeight + 20, 0, 0);
        this.physics.add.existing(boundary, true);
        this.topMenuBoundary = boundary;
    }

    // === UI ===
    _createUI(width, height) {
        const style = { fontSize: UI.TEXT_SIZE, fontFamily: UI.TEXT_FONT, color: UI.TEXT_COLOR };
        const smallStyle = { fontSize: '14px', fontFamily: UI.TEXT_FONT, color: '#666666' };

        this.scoreText = this.add.text(20, this.menuHeight / 3 - 5, `Счет:${this.score}`, style);
        this.highScoreText = this.add.text(20, this.menuHeight / 3 + 25, `Рекорд:${this.highScore}`, smallStyle);
        
        // Спрайт мяча для жизней
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
        
        this.borderHeight = borderHeight; // Сохраняем для использования в других методах
        this.borderWidth = borderWidth; // Сохраняем для использования в других методах
        
        // Физическая граница (статичное тело)
        const leftBoundary = this.add.rectangle(borderWidth / 2, 0, borderWidth, borderHeight, 0, 0);
        this.physics.add.existing(leftBoundary, true);
        this.leftBorderBoundary = leftBoundary;

        const rightBoundary = this.add.rectangle(width - borderWidth / 2, 0, borderWidth, borderHeight, 0, 0);
        this.physics.add.existing(rightBoundary, true);
        this.rightBorderBoundary = rightBoundary;

        // Зона смерти внизу экрана (невидимый триггер)
        const deathZoneHeight = 50;
        const deathZone = this.add.rectangle(
            width / 2,
            height - deathZoneHeight / 2,
            width,
            deathZoneHeight,
            0x000000,
            0 // Полностью прозрачный
        );
        this.physics.add.existing(deathZone, true); // true = статичное тело
        this.deathZone = deathZone;
    }

    // === Управление ===
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

    // === Игровые объекты ===
    _createGameObjects(width, height) {
        this.paddle = new Paddle(this, width / 2, height - UI.PADDLE_Y_OFFSET);
        this.ball = new Ball(this, width / 2, height - UI.PADDLE_Y_OFFSET - UI.BALL_Y_OFFSET);
        this.balls = [this.ball]; // Массив всех мячей на поле
        this.bonuses = []; // Массив активных бонусов
    }

    // === Кирпичи ===
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
        const startY = UI.BRICK_START_Y;
        const textures = ['brick1', 'brick2', 'brick3', 'brickTNT'];

        levelData.forEach((row, rowIndex) => {
            row.split('').forEach((cell, colIndex) => {
                if (cell !== '0') {
                    const x = startX + colIndex * (brickWidth + gap);
                    const y = startY + rowIndex * (brickHeight + gap);
                    const digit = parseInt(cell, 10);
                    
                    // TNT блок (цифра 4)
                    let texture, points;
                    if (digit === 4) {
                        texture = 'brickTNT';
                        points = 50; // Больше очков за TNT
                    } else {
                        texture = textures[digit - 1] || 'brick1';
                        points = digit * 10;
                    }
                    
                    const brick = new Brick(
                        this, x, y, brickWidth, brickHeight,
                        texture,
                        points
                    );
                    this.bricks.add(brick.sprite);
                }
            });
        });
    }

    // === Коллизии ===
    _setupCollisions() {
        this.physics.add.collider(this.ball.sprite, this.paddle.sprite, this.handlePaddleHit, null, this);

        // Коллизия с кирпичами (используем collider для надёжной обработки)
        this.physics.add.overlap(this.ball.sprite, this.bricks, this.handleBrickCollision, null, this);

        // Столкновение с верхним меню
        this.physics.add.collider(this.ball.sprite, this.topMenuBoundary, () => {
            this.playSound('bounce', { volume: 0.5 });
        });

        this.physics.add.collider(this.ball.sprite, this.leftBorderBoundary, () => {
            this.playSound('bounce', { volume: 0.5 });
        });

        this.physics.add.collider(this.ball.sprite, this.rightBorderBoundary, () => {
            this.playSound('bounce', { volume: 0.5 });
        });

        // Коллизия Paddle с границами (чтобы не проходил сквозь них)
        this.physics.add.collider(this.paddle.sprite, this.leftBorderBoundary);
        this.physics.add.collider(this.paddle.sprite, this.rightBorderBoundary);

        // Столкновение с границами поля
        this.ball.sprite.body.onWorldBounds = true;
        this.physics.world.on('worldbounds', () => {
            this.playSound('bounce', { volume: 0.5 });
        });

        // Коллизия бонусов с paddle
        this.physics.add.overlap(this.paddle.sprite, this.bonusGroup, this._handleBonusCollection, null, this);

        // Коллизия мяча с зоной смерти
        this.physics.add.overlap(this.ball.sprite, this.deathZone, this._onBallInDeathZone, null, this);
    }

    // === Частицы ===
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

    // === Анимация очков ===
    _showFloatingText(x, y, text, color = '#ffffff') {
        const floatingText = this.add.text(x, y, `+${text}`, {
            fontSize: UI.TEXT_SIZE,
            fontFamily: UI.TEXT_FONT,
            color: color,
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

    // === Пауза ===
    _setupPause(width) {
        this.pauseButton = this.add.image(width - 60, 50, 'pause')
            .setOrigin(0.5, 0.5)
            .setScale(1.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.pauseGame());
        
        this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey?.on('up', () => this.pauseGame());
        
        this.soundEnabled = true;
        this.musicEnabled = true;
    }

    // === Анимация появления ===
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

    // === Звуки ===
    playSound(key, { volume = 0.5, cooldownMs = 60 } = {}) {
        // Используем AudioManager для проверки состояния SFX
        if (!AudioManager.isSFXEnabled() || !this.sound) return;

        // На iOS нужно убедиться, что аудио контекст активен
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

    // === Обработка ударов ===
    handlePaddleHit(ballSprite, paddleSprite) {
        const hitPoint = ballSprite.x - paddleSprite.x;
        const normalizedHit = Phaser.Math.Clamp(hitPoint / (paddleSprite.width / 2), -1, 1);

        const maxAngleRad = Phaser.Math.DegToRad(80);
        const targetAngle = normalizedHit * maxAngleRad;
        
        // Сохраняем текущую скорость мяча (чтобы не сбрасывать бонус скорости)
        const currentSpeed = Math.hypot(ballSprite.body.velocity.x, ballSprite.body.velocity.y);
        const speed = Math.max(currentSpeed, this._cachedSpeed); // Не меньше базовой скорости

        const newVx = Math.sin(targetAngle) * speed;
        const newVy = -Math.cos(targetAngle) * speed;

        // Добавляем микро-рандом для естественности
        const jitter = Phaser.Math.FloatBetween(-0.05, 0.05) * speed;
        ballSprite.body.setVelocity(newVx + jitter, newVy);

        this.playSound('bounce', { volume: 0.5, cooldownMs: 40 });
    }

    handleBrickCollision(ballSprite, brickSprite) {
        // Гвард-клаузы для раннего выхода
        if (!brickSprite?.active || !brickSprite.body?.enable || !brickSprite?._brick) return;

        const brick = brickSprite._brick;

        // === ОТСКАКИВАЕМ ДО удара по кирпичу ===
        this.bounceOffBrick(ballSprite, brickSprite);

        if (!brick.hit()) {
            this.playSound('bounce', { volume: 0.5 });
            return;
        }

        // === ПРОВЕРЯЕМ ВЫПАДЕНИЕ БОНУСА ===
        if (brick.shouldDropBonus()) {
            this._spawnBonus(brickSprite.x + brickSprite.displayWidth / 2, brickSprite.y + brickSprite.displayHeight / 2, brick.getBonusType());
        }

        // Эффекты
        this.score += brick.points;
        this.scoreText.setText(`Счет:${this.score}`);

        // Обновляем рекорд, если текущий счет выше
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreText.setText(`Рекорд: ${this.highScore}`);
            localStorage.setItem('arkanoid_highScore', this.highScore.toString());
        }

        // Если это TNT блок - вызываем взрыв
        if (brick.isTNT) {
            brick.explode();
        } else {
            this.playSound('hit', { volume: 0.5 });
        }
        
        this.particles?.emitParticleAt(brickSprite.x, brickSprite.y, 10);
        this._showFloatingText(brickSprite.x, brickSprite.y, brick.points.toString(), '#ffffff');

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
                // Удар сбоку - меняем X (без ускорения)
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
            brickSprite.body.immovable = true;
        }
        
        // 2. Скрываем визуально
        brickSprite?.setVisible(false);
        brickSprite?.setActive(false);
        
        // 3. Полное удаление с задержкой (1-2 кадра достаточно)
        this.time.delayedCall(1, () => { 
            if (brickSprite?.body) {
                brickSprite.body.enable = false;
            }
            brickSprite?.destroy();  // Удаляем из памяти
        });
    }

    // === Бонусы ===
    _spawnBonus(x, y, type) {
        // Задаём вектор падения: немного вниз и случайно влево/вправо
        const bonus = new Bonus(this, x, y, type);
        this.bonuses.push(bonus);
        this.bonusGroup.add(bonus.sprite);
        
        // Устанавливаем скорость падения
        bonus.body.setVelocityY(150);
    }

    _handleBonusCollection(paddleSprite, bonusSprite) {
        const bonus = bonusSprite._bonus;


        if (bonus && bonus.isActive) {
            bonus.activate();
            this.playSound('bonus', { volume: 0.5 });
            // Удаляем из массива
            this.bonuses = this.bonuses.filter(b => b !== bonus);
            // Группа будет обновлена в _updateBonuses
        }
    }

    _updateBonuses() {
        const height = this.game.config.height;

        // Обновляем каждый бонус
        for (let i = this.bonuses.length - 1; i >= 0; i--) {
            const bonus = this.bonuses[i];
            
            // Если бонус не активен (уже подобран) - удаляем
            if (!bonus.isActive) {
                if (bonus.sprite && bonus.sprite.active) {
                    bonus.sprite.destroy();
                }
                this.bonuses.splice(i, 1);
                continue;
            }

            // Если бонус упал ниже экрана - удаляем без активации
            if (bonus.y > height) {
                bonus.isActive = false;
                if (bonus.sprite && bonus.sprite.active) {
                    bonus.sprite.destroy();
                }
                this.bonuses.splice(i, 1);
            }
        }

        // Очищаем группу бонусов от неактивных
        this.bonusGroup.children.iterate((child) => {
            if (child && !child.active) {
                this.bonusGroup.remove(child, true);
            }
        });
    }
    
    // === Поддержание скорости ===
    keepBallMoving() {
        // Поддерживаем скорость для всех мячей
        this.balls.forEach(ball => {
            if (!ball?.isLaunched) return;

            const body = ball.sprite?.body;
            if (!body) return;

            const speed = this._cachedSpeed;
            const currSpeed = Math.hypot(body.velocity.x, body.velocity.y);

            // Только экстренная коррекция
            if (currSpeed > 0 && currSpeed < speed * 0.9) {
                const k = speed / currSpeed;
                body.setVelocity(body.velocity.x * k, body.velocity.y * k);
            }
        });
    }

    // === Возврат скорости после бонуса ===
    _revertSpeedBoost() {
        const baseSpeed = this._cachedSpeed;
        const maxSpeed = baseSpeed * 1.3;
        
        this.balls.forEach(ball => {
            if (!ball?.isLaunched || !ball.sprite?.body) return;

            const body = ball.sprite.body;
            const currentSpeed = Math.hypot(body.velocity.x, body.velocity.y);
            
            // Если скорость выше базовой (но не выше максимума бонуса) - возвращаем к базовой
            if (currentSpeed > baseSpeed && currentSpeed <= maxSpeed * 1.1) {
                const directionX = body.velocity.x / currentSpeed;
                const directionY = body.velocity.y / currentSpeed;
                body.setVelocity(directionX * baseSpeed, directionY * baseSpeed);
            }
        });
    }

    // === Потеря мяча ===
    // Обработка попадания мяча в зону смерти
    _onBallInDeathZone(ballSprite) {
        // Находим мяч в массиве
        const ball = this.balls.find(b => b.sprite === ballSprite);
        if (!ball) return;

        // Помечаем как обработанный (чтобы не вызвать повторно)
        if (ball._inDeathZone) return;
        ball._inDeathZone = true;

        // Останавливаем мяч
        ball.body.setVelocity(0, 0);

        // Добавляем в очередь на удаление
        if (!this._ballsToRemove) {
            this._ballsToRemove = new Set();
        }
        this._ballsToRemove.add(ball);

        // Запускаем обработку через короткую задержку (для стабильности при нескольких мячах)
        if (!this._deathZoneProcessingScheduled) {
            this._deathZoneProcessingScheduled = true;
            this.time.delayedCall(100, () => this._processDeathZoneLosses());
        }
    }

    // Обработка потерь после попадания в зону смерти
    _processDeathZoneLosses() {
        if (!this._ballsToRemove || this._ballsToRemove.size === 0) {
            this._deathZoneProcessingScheduled = false;
            return;
        }

        // Удаляем все мячи из зоны смерти
        this._ballsToRemove.forEach(ball => {
            const ballIndex = this.balls.indexOf(ball);
            if (ballIndex !== -1) {
                this.balls.splice(ballIndex, 1);
            }
            if (ball.sprite && ball.sprite.active) {
                ball.sprite.destroy();
            }
        });
        this._ballsToRemove.clear();

        // Если мячей не осталось - отнимаем жизнь
        if (this.balls.length === 0) {
            this._handleAllBallsLost();
        }

        this._deathZoneProcessingScheduled = false;
    }

    // Обработка потери всех мячей
    _handleAllBallsLost() {
        if (this._gameEndTriggered || this._isProcessingLifeLoss) return;

        this._isProcessingLifeLoss = true;
        this.lives--;
        this.livesText.setText(`:${this.lives}`);
        this.playSound('lose', { volume: 0.7, cooldownMs: 250 });

        // Очищаем бонусы
        this._clearAllBonuses();

        if (this.lives <= 0) {
            this._isProcessingLifeLoss = false;
            this._endLevel(false);
        } else {
            this._resetBallToPaddle();
            this._isProcessingLifeLoss = false;
        }
    }

    // Очистить все бонусы с поля
    _clearAllBonuses() {
        // Удаляем все бонусы из массива
        this.bonuses.forEach(bonus => {
            if (bonus.sprite && bonus.sprite.active) {
                bonus.sprite.destroy();
            }
        });
        this.bonuses = [];

        // Очищаем группу бонусов
        this.bonusGroup?.clear(true, true);
    }

    // Восстановить мяч на платформе после потери жизни
    _resetBallToPaddle() {
        // Удаляем все оставшиеся мячи
        this.balls.forEach(ball => {
            if (ball.sprite && ball.sprite.active) {
                ball.sprite.destroy();
            }
        });
        this.balls = [];

        // Пересоздаём основной мяч
        const width = this.game.config.width;
        const height = this.game.config.height;
        this.ball = new Ball(this, width / 2, height - UI.PADDLE_Y_OFFSET - UI.BALL_Y_OFFSET);
        this.balls = [this.ball];

        // Восстанавливаем все коллизии для основного мяча
        this.physics.add.collider(this.ball.sprite, this.paddle.sprite, this.handlePaddleHit, null, this);
        this.physics.add.overlap(this.ball.sprite, this.bricks, this.handleBrickCollision, null, this);
        this.physics.add.collider(this.ball.sprite, this.topMenuBoundary, () => {
            this.playSound('bounce', { volume: 0.5 });
        });
        this.physics.add.collider(this.ball.sprite, this.leftBorderBoundary, () => {
            this.playSound('bounce', { volume: 0.5 });
        });
        this.physics.add.collider(this.ball.sprite, this.rightBorderBoundary, () => {
            this.playSound('bounce', { volume: 0.5 });
        });
        this.physics.add.overlap(this.ball.sprite, this.deathZone, this._onBallInDeathZone, null, this);

        // Показываем текст подсказки
        if (!this.launchText) {
            this.launchText = this.add.text(
                width / 2,
                height / 2,
                'Нажми для запуска', {
                    font: UI.LAUNCH_TEXT_SIZE,
                    color: '#fafdf4'
                }
            ).setOrigin(0.5);
        }
    }

    // === Завершение уровня ===
    _endLevel(win) {
        this._gameEndTriggered = true;
        if (win)  {
            this.playSound('win', { volume: 0.7, cooldownMs: 250 });

            // Проверяем, это последний уровень
            const totalLevels = GameStorage.getTotalLevels();
            const isLastLevel = this.currentLevel >= totalLevels - 1;

            if (isLastLevel) {
                this.scene.start('GameOver', {
                    win,
                    score: this.score,
                    level: this.currentLevel
                });
            } else {
                // Сохраняем прогресс: если прошли уровень, открываем следующий
                const nextLevel = this.currentLevel + 1;
                GameStorage.setMaxLevel(nextLevel);

                // Запускаем следующий уровень
                this.scene.start('Game', {
                    level: nextLevel,
                    score: this.score,
                    lives: this.lives
                });
            }

            return;
        }

        this.scene.start('GameOver', {
            win,
            score: this.score,
            level: this.currentLevel
        });
    }

    // ===  Пауза ===
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

    // === Игровой цикл ===
    update() {
        if (this._gameEndTriggered) return;

        this.paddle?.update();
        
        // Обновляем все мячи
        this.balls.forEach(ball => ball?.update());
        
        this.keepBallMoving(); // Поддерживаем скорость мяча
        this._updateBonuses(); // Обновляем бонусы

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