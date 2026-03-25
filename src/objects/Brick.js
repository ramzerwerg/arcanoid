class Brick {
    constructor(scene, x, y, width, height, textureKey, points = 10) {
        this.scene = scene;
        this.points = points;
        this.isTNT = textureKey === 'brickTNT'; // TNT блок
        this.hp = this.isTNT ? 1 : 2; // TNT разрушается с 1 удара
        this.bonusChance = 0.10; // 10% шанс выпадения бонуса

        // Визуал
        this.sprite = scene
            .add.image(x, y, textureKey)
            .setOrigin(0, 0);

        // Физика
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;

        this.body.setImmovable(true);
        this.body.allowGravity = false;
        this.body.setEnable(true);
        this.body.checkCollision.none = false; // Включаем коллизии!

        // Ссылки для удобного доступа из коллизий
        this.sprite.points = points;
        this.sprite._brick = this;
    }

    shouldDropBonus() {
        return Math.random() < this.bonusChance;
    }

    getBonusType() {
        const types = ['ball', 'expand', 'speed'];
        return types[Math.floor(Math.random() * types.length)];
    }

    hit() {
        this.hp--;
        if (this.hp <= 0) {
            // Не уничтожаем сразу! Возвращаем флаг, а удаление делаем в Game.js
            return true;
        }
        return false;
    }

    // Метод для безопасного удаления (вызывается из Game.js)
    destroy() {
        if (!this.sprite?.active) return;

        // 1. Отключаем физику
        if (this.sprite.body) {
            this.sprite.body.enable = false;
            this.sprite.body.setImmovable(true); // На всякий случай
        }

        // 2. Скрываем и деактивируем
        this.sprite.setActive(false);
        this.sprite.setVisible(false);

        // 3. Полное удаление
        this.sprite.destroy();
    }

    // Взрыв TNT блока
    explode() {
        if (!this.isTNT) return;
        
        // Воспроизводим звук взрыва
        this.scene.sound?.play('explosion', { volume: 0.5 });
        
        // Находим все соседние блоки в радиусе
        const explosionRadius = 100; // Радиус взрыва
        const bricks = this.scene.bricks.getChildren();
        
        bricks.forEach(brickSprite => {
            if (!brickSprite.active || !brickSprite._brick) return;
            
            const brick = brickSprite._brick;
            const distance = Phaser.Math.Distance.Between(
                this.sprite.x + this.sprite.displayWidth / 2,
                this.sprite.y + this.sprite.displayHeight / 2,
                brickSprite.x + brickSprite.displayWidth / 2,
                brickSprite.y + brickSprite.displayHeight / 2
            );
            
            // Если блок в радиусе взрыва - уничтожаем его
            if (distance <= explosionRadius) {
                // Запускаем цепную реакцию для других TNT блоков
                if (brick.isTNT) {
                    this.scene.time.delayedCall(50, () => brick.explode());
                }
                
                // Уничтожаем блок
                this.scene._destroyBrick(brickSprite);
                
                // Добавляем очки
                this.scene.score += brick.points;
                this.scene.scoreText.setText(`Счет: ${this.scene.score}`);
                
                // Показываем всплывающий текст
                this.scene._showFloatingText(brickSprite.x, brickSprite.y, brick.points.toString(), '#ff6b6b');
                
                // Проверяем выпадение бонуса
                if (brick.shouldDropBonus()) {
                    this.scene._spawnBonus(
                        brickSprite.x + brickSprite.displayWidth / 2,
                        brickSprite.y + brickSprite.displayHeight / 2,
                        brick.getBonusType()
                    );
                }
            }
        });
        
        // Эффект частиц
        this.scene.particles?.emitParticleAt(
            this.sprite.x + this.sprite.displayWidth / 2,
            this.sprite.y + this.sprite.displayHeight / 2,
            20
        );
    }
}