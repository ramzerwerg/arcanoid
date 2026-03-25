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

    expand(factor = 1.5) {
        // Увеличиваем ширину на фактор
        const newWidth = this.originalWidth * factor;
        this.sprite.setDisplaySize(newWidth, this.originalHeight);
        this.currentWidth = newWidth;

        // Возвращаем к нормальному размеру через 10 секунд
        this.scene.time.delayedCall(10000, () => {
            this.sprite.setDisplaySize(this.originalWidth, this.originalHeight);
            this.currentWidth = this.originalWidth;
        });
    }

    update() {
        const gameWidth = this.scene.game.config.width;
        const borderWidth = this.scene.borderWidth || 20;
        const halfWidth = this.currentWidth / 2;

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
        this.x = Phaser.Math.Clamp(
            this.x,
            borderWidth + halfWidth,
            gameWidth - borderWidth - halfWidth
        );
    }
}