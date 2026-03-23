class Ball {
    constructor(scene, x, y) {
        this.scene = scene;
        
        const diameter = GAME_CONFIG.ball.radius * 2;

        // Создаём визуальное представление (спрайт из ассета)
        this.sprite = scene
            .add.image(x, y, 'ball')
            .setDisplaySize(diameter, diameter)
            .setOrigin(0.5, 0.5);
        
        // Добавляем физику
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        
        // Настраиваем физику
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(1);
        this.body.setAllowGravity(false);

        // Используем "круглую" форму для более приятного отскока.
        this.body.setCircle(diameter);
        
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
            this.y = this.scene.paddle.y - 30;
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