class Brick {
    constructor(scene, x, y, width, height, textureKey, points = 10) {
        this.scene = scene;
        this.points = points;
        this.hp = 5;
        
        // Визуал
        this.sprite = scene
            .add.image(x, y, textureKey)
            .setDisplaySize(width, height)
            .setOrigin(0, 0);
        
        // Физика
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        
        this.body.setImmovable(true);       
        this.body.allowGravity = false;     
        this.body.setEnable(true);          
        this.body.moves = false;            
        
        // Ссылки для удобного доступа из коллизий
        this.sprite.points = points;
        this.sprite._brick = this;
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
}