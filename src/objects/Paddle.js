class Paddle {
    constructor(scene, x, y) {
        this.scene = scene;

        this.originalWidth = GAME_CONFIG.paddle.width;
        this.originalHeight = GAME_CONFIG.paddle.height;

        this.sprite = scene
            .add.image(x, y, 'paddle')
            .setDisplaySize(this.originalWidth, this.originalHeight)
            .setOrigin(0.5, 0.5);

        // Физика
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        this.body.setImmovable(true);
        this.body.setCollideWorldBounds(true);

        this.speed = GAME_CONFIG.paddle.speed;
        
        // Текущая ширина (для корректных границ)
        this.currentWidth = this.originalWidth;
    }

    get x() { return this.sprite.x; }
    set x(value) { this.sprite.x = value; }

    get y() { return this.sprite.y; }
    set y(value) { this.sprite.y = value; }

    get width() { return this.sprite.displayWidth; }
    get height() { return this.sprite.displayHeight; }

    expand() {
        const targetScale = 0.7;
        const expandedWidth = this.originalWidth * targetScale;

        // Анимация увеличения
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: targetScale,
            duration: 100,
            ease: 'Power2.out',
            onUpdate: () => {
                // Обновляем физику во время анимации
                const currentWidth = this.originalWidth * this.sprite.scaleX;
                this.body.setSize(currentWidth, this.originalHeight, true);
                // Синхронизируем позицию тела с позицией спрайта
                this.body.x = this.sprite.x;
            },
            onComplete: () => {
                this.sprite.setTexture('paddle_2');
                // Финальное обновление физики
                this.body.setSize(expandedWidth, this.originalHeight, true);
                this.body.x = this.sprite.x;
                this.currentWidth = expandedWidth;
            }
        });

        // Возврат через 10 секунд
        this.scene.time.delayedCall(10000, () => {
            this.scene.tweens.add({
                targets: this.sprite,
                scaleX: 0.5,
                duration: 100,
                ease: 'Power2.out',
                onUpdate: () => {
                    // Обновляем физику во время анимации
                    const currentWidth = this.originalWidth * this.sprite.scaleX;
                    this.body.setSize(currentWidth, this.originalHeight, true);
                    this.body.x = this.sprite.x;
                },
                onComplete: () => {
                    this.sprite.setTexture('paddle');
                    // Финальное обновление физики
                    this.body.setSize(this.originalWidth, this.originalHeight, true);
                    this.body.x = this.sprite.x;
                    this.currentWidth = this.originalWidth;
                }
            });
        });
    }

    update() {
        const gameWidth = this.scene.game.config.width;
        const borderWidth = this.scene.borderWidth || 20;
        // Используем текущую ширину платформы (с учётом масштабирования)
        const currentWidth = this.originalWidth * this.sprite.scaleX;
        const halfWidth = currentWidth / 2;

        // Клавиатура
        if (this.scene.cursors?.left?.isDown) {
            this.body.setVelocityX(-this.speed);
        } else if (this.scene.cursors?.right?.isDown) {
            this.body.setVelocityX(this.speed);
        } else {
            this.body.setVelocityX(0);
        }

        // Тач/мышь
        if (this.scene.input?.activePointer?.isDown) {
            const pointerX = this.scene.input.activePointer.x;
            this.x = Phaser.Math.Clamp(
                pointerX,
                borderWidth + halfWidth,
                gameWidth - borderWidth - halfWidth
            );
        }

        // Ограничиваем позицию платформы границами (даже для клавиатуры)
        // Используем текущую ширину для правильного ограничения
        const newX = Phaser.Math.Clamp(
            this.x,
            borderWidth + halfWidth,
            gameWidth - borderWidth - halfWidth
        );
        
        // Если позиция изменилась - применяем и обновляем физику
        if (this.x !== newX) {
            this.x = newX;
            this.body.x = newX;
        }
    }
}