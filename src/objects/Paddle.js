class Paddle {
    constructor(scene, x, y) {
        this.scene = scene;
        
        this.sprite = scene
            .add.image(x, y, 'paddle')
            .setDisplaySize(GAME_CONFIG.paddle.width, GAME_CONFIG.paddle.height)
            .setOrigin(0.5, 0.5);
        
        // Физика
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        this.body.setImmovable(true);
        this.body.setCollideWorldBounds(true);
        
        this.speed = GAME_CONFIG.paddle.speed;
    }

    get x() { return this.sprite.x; }
    set x(value) { this.sprite.x = value; }
    
    get y() { return this.sprite.y; }
    set y(value) { this.sprite.y = value; }

    update() {
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
                GAME_CONFIG.paddle.width / 2, 
                this.scene.game.config.width - GAME_CONFIG.paddle.width / 2
            );
        }
    }
}