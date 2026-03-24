class Bonus {
    constructor(scene, x, y, type, velocityX = 0, velocityY = 100) {
        this.scene = scene;
        this.type = type; // 'multiball', 'expand', 'speed'
        this.width = 40;
        this.height = 25;
        this.isActive = true;

        // Цвета для разных типов бонусов
        const colors = {
            multiball: 0x01b901, // зелёный
            expand: 0x07a3be,    // голубой
            speed: 0xbb4646      // красный
        };

        // Создаём текстуру для бонуса динамически
        const textureKey = `bonus_${type}`;
        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(colors[type], 1);
            graphics.fillRoundedRect(0, 0, this.width, this.height, 5);
            graphics.generateTexture(textureKey, this.width, this.height);
        }

        // Создаём контейнер для бонуса (спрайт + иконка)
        this.container = scene.add.container(x, y);

        // Создаём спрайт с текстурой
        this.sprite = scene.add.sprite(0, 0, textureKey);
        this.container.add(this.sprite);

        // Добавляем иконку как дочерний элемент контейнера
        this.iconContainer = scene.add.container(0, 0);
        this.iconContainer.add(this._createIconContent(scene));
        this.container.add(this.iconContainer);

        // Физика
        scene.physics.add.existing(this.container);
        this.body = this.container.body;
        this.body.allowGravity = false;
        this.body.checkCollision.none = false;
        // Задаём вектор падения
        this.body.setVelocity(velocityX, velocityY);

        // Сохраняем ссылку на бонус
        this.container._bonus = this;
    }

    _createIconContent(scene) {
        if (this.type === 'multiball') {
            // Иконка шара (белый круг)
            return scene.add.circle(0, 0, 6, 0xffffff);
        } else if (this.type === 'expand') {
            // Иконка paddle (горизонтальная линия)
            return scene.add.rectangle(0, 0, 16, 3, 0xffffff);
        } else if (this.type === 'speed') {
            // Две стрелочки в ряд, смотрят вправо
            const arrowColor = 0xffffff;
            const group = scene.add.container(0, 0);
            // Левая стрелка
            group.add(scene.add.polygon(-4, 0, [{ x: 0, y: 0 }, { x: -3, y: -2 }, { x: -3, y: 2 }], arrowColor));
            // Правая стрелка
            group.add(scene.add.polygon(4, 0, [{ x: 0, y: 0 }, { x: -3, y: -2 }, { x: -3, y: 2 }], arrowColor));
            return group;
        }
        return null;
    }

    get x() { return this.container.x; }
    get y() { return this.container.y; }
    get displayWidth() { return this.width; }
    get displayHeight() { return this.height; }

    activate() {
        if (!this.isActive) return;
        this.isActive = false;

        // Воспроизводим звук
        this.scene.sound?.play('bonus', { volume: 0.3 });

        // Активируем эффект в зависимости от типа
        switch (this.type) {
            case 'multiball':
                this._activateMultiball();
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

    _activateMultiball() {
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
            this.scene.sound?.play('bounce', { volume: 0.2 });
        });

        // Добавляем коллизию с границами поля
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
        if (this.iconContainer) {
            this.iconContainer.destroy();
        }
        if (this.container && this.container.active) {
            this.container.destroy();
        }
    }
}
