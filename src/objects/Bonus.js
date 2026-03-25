class Bonus {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.type = type; // 'ball', 'expand', 'speed'
        this.width = 86;
        this.height = 50;
        this.isActive = true;

        // Создаём текстуру для бонуса динамически
        const textureKey = `bonus_${type}`;
        this.sprite = scene
            .add.image(x, y, textureKey)
            .setOrigin(0.5, 0.5);

        // Физика
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        this.body.allowGravity = false;
        this.body.checkCollision.none = false;

        // Ссылка для удобного доступа из коллизий
        this.sprite._bonus = this;
    }

    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }
    get displayWidth() { return this.width; }
    get displayHeight() { return this.height; }

    activate() {
        if (!this.isActive) return;
        this.isActive = false;

        // Воспроизводим звук
        this.scene.sound?.play('bonus', { volume: 0.5 });

        // Активируем эффект в зависимости от типа
        switch (this.type) {
            case 'ball':
                this._activateBall();
                break;
            case 'expand':
                this._activateExpand();
                break;
            case 'speed':
                this._activateSpeed();
                break;
        }

        // Удаляем бонус
        this.destroy();
    }

    _activateBall() {
        // Находим любой активный мяч из массива
        const activeBall = this.scene.balls.find(b => b && b.sprite && b.sprite.active);
        if (!activeBall || !activeBall.sprite) return;

        const newBall = new Ball(this.scene, activeBall.x, activeBall.y);
        newBall.isLaunched = true;

        newBall.body.setVelocity(
            activeBall.body.velocity.x * (Math.random() > 0.5 ? 1 : -1),
            activeBall.body.velocity.y
        );
        this.scene.balls.push(newBall);

        // Добавляем коллизию нового мяча с paddle
        this.scene.physics.add.collider(newBall.sprite, this.scene.paddle.sprite, this.scene.handlePaddleHit, null, this.scene);

        // Добавляем коллизию с кирпичами
        this.scene.physics.add.overlap(newBall.sprite, this.scene.bricks, this.scene.handleBrickCollision, null, this.scene);

        // Добавляем коллизию с верхним меню
        this.scene.physics.add.collider(newBall.sprite, this.scene.topMenuBoundary, () => {
            this.scene.sound?.play('bounce', { volume: 0.5 });
        });

        // Добавляем коллизию с границами поля
        this.scene.physics.add.collider(newBall.sprite, this.scene.leftBorderBoundary, () => {
            this.scene.sound?.play('bounce', { volume: 0.2 });
        });
        this.scene.physics.add.collider(newBall.sprite, this.scene.rightBorderBoundary, () => {
            this.scene.sound?.play('bounce', { volume: 0.2 });
        });
        
        newBall.sprite.body.onWorldBounds = true;
    }

    _activateExpand() {
        const paddle = this.scene.paddle;
        if (paddle) {
            paddle.expand(1.5); // Увеличиваем на 50%
        }
    }

    _activateSpeed() {
        // Увеличиваем скорость всех мячей
        const balls = this.scene.balls || [this.scene.ball];
        balls.forEach(ball => {
            if (ball && ball.body) {
                const speedMultiplier = 1.3;
                ball.body.setVelocity(
                    ball.body.velocity.x * speedMultiplier,
                    ball.body.velocity.y * speedMultiplier
                );
            }
        });
    }

    destroy() {
        if (this.sprite && this.sprite.active) {
            this.sprite.destroy();
        }
    }
}
