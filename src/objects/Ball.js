class Ball {
    constructor(scene, x, y) {
        this.scene = scene;
        
        const radius = GAME_CONFIG.ball.radius; 
        const diameter = radius * 2;
        
        // 1. Создаём спрайт
        this.sprite = scene.add.image(x, y, 'ball')
            .setOrigin(0.5, 0.5);
        
        // 2. Вычисляем и применяем масштаб
        // const originalSize = this.sprite.texture.source[0].height;
        // const scale = diameter / originalSize;
        // this.sprite.setScale(scale);
        
        // 3. Добавляем физику ПОСЛЕ масштабирования
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        
        // 4. Настройки физики
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(1);
        this.body.setAllowGravity(false);
        
        // 5. компенсируем масштаб в setCircle
        this.body.setCircle(radius);
        this.body.setOffset(0, 0);
        
        this.speed = GAME_CONFIG.ball.speed; 
        this.isLaunched = false;
    }

    get x() { return this.sprite.x; }
    set x(value) { this.sprite.x = value; }
    
    get y() { return this.sprite.y; }
    set y(value) { this.sprite.y = value; }

    get width() { return this.sprite.width; }
    get height() { return this.sprite.height; }

    launch() {
        if (!this.isLaunched) {
            this.isLaunched = true;
            this.body.setVelocity(0, -this.speed);
        }
    }

    update() {
        // Если мяч не запущен, следует за ракеткой
        if (!this.isLaunched && this.scene.paddle) {
            this.x = this.scene.paddle.x;
            this.y = this.scene.paddle.y - 40;
        }

        // Проверка падения мяча
        if (this.y > this.scene.game.config.height - 30) {
            this.scene.loseLife();
        }
    }

    reset(x, y) {
        this.isLaunched = false;
        this.body.setVelocity(0, 0);
        this.sprite.setPosition(x, y);
    }

    // Метод для уничтожения (если понадобится)
    destroy() {
        this.sprite.destroy();
    }
}