class LevelSelect extends Phaser.Scene {
    constructor() {
        super('LevelSelect');
    }

    create() {
        const { width, height } = this.game.config;

        let bg = this.add.image(0, 0, 'bg').setOrigin(0, 0);
        bg.displayWidth = width
        bg.displayHeight = height;
        
        this.totalLevels = GameStorage.getTotalLevels();
        this.maxLevel = GameStorage.getMaxLevel();

        // Затемнение фона
        this.overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive();

        // Контейнер для меню
        const menuWidth = Math.min(600, width - 40);
        const menuHeight = Math.min(500, height - 100);
        const menuX = width / 2;
        const menuY = height / 2;

        this.menuBg = this.add.rectangle(menuX, menuY, menuWidth, menuHeight, 0xfdffff)
            .setOrigin(0.5)
            .setStrokeStyle(10, 0x777777);

        // Заголовок
        this.add.text(menuX, menuY - menuHeight / 2 + 40, 'ВЫБОР УРОВНЯ', {
            fontSize: '32px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#414141',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Сетка уровней
        this.createLevelGrid(menuX, menuY, menuWidth, menuHeight);

        // Кнопка "Назад"
        const backButton = this.add.text(menuX, menuY + menuHeight / 2 - 40, '◀ Назад', {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#414141',
            backgroundColor: '#fdffff',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setStyle({ backgroundColor: '#e0e0e0' }))
            .on('pointerout', () => backButton.setStyle({ backgroundColor: '#fdffff' }))
            .on('pointerdown', () => this.goBack());

        // Клик по оверлею тоже возвращает назад
        this.overlay.on('pointerdown', () => this.goBack());

        // Esc для выхода
        this.escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey?.on('up', () => this.goBack());

        // Анимация появления
        this.menuBg.setScale(0);
        this.tweens.add({
            targets: this.menuBg,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    createLevelGrid(menuX, menuY, menuWidth, menuHeight) {
        const cols = 5;
        const rows = Math.ceil(this.totalLevels / cols);
        const buttonWidth = 70;
        const buttonHeight = 70;
        const gap = 10;
        const gridWidth = cols * buttonWidth + (cols - 1) * gap;
        const gridHeight = rows * buttonHeight + (rows - 1) * gap;
        const startX = menuX - gridWidth / 2 + buttonWidth / 2;
        const startY = menuY - menuHeight / 2 + 100;

        for (let i = 0; i < this.totalLevels; i++) {
            const level = i; // 0-based индекс
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (buttonWidth + gap);
            const y = startY + row * (buttonHeight + gap);
            const isUnlocked = GameStorage.isLevelUnlocked(i + 1); // 1-based для проверки

            // Фон кнопки
            const buttonBg = this.add.rectangle(x, y, buttonWidth, buttonHeight, isUnlocked ? 0x4CAF50 : 0x999999)
                .setOrigin(0.5)
                .setStrokeStyle(3, isUnlocked ? 0x2E7D32 : 0x666666);

            if (isUnlocked) {
                buttonBg.setInteractive({ useHandCursor: true })
                    .on('pointerover', () => {
                        if (GameStorage.isLevelUnlocked(level + 1)) {
                            buttonBg.setFillStyle(0x66BB6A);
                        }
                    })
                    .on('pointerout', () => {
                        if (GameStorage.isLevelUnlocked(level + 1)) {
                            buttonBg.setFillStyle(0x4CAF50);
                        }
                    })
                    .on('pointerdown', () => this.selectLevel(level));
            }

            // Номер уровня
            const levelNumber = i + 1;
            const textColor = isUnlocked ? '#ffffff' : '#cccccc';
            this.add.text(x, y, levelNumber.toString(), {
                fontSize: '28px',
                fontFamily: '"Press Start 2P", Arial',
                color: textColor,
                fontStyle: isUnlocked ? 'bold' : 'normal'
            }).setOrigin(0.5);

            // Замок для заблокированных уровней
            if (!isUnlocked) {
                this.add.text(x, y + 25, '🔒', {
                    fontSize: '20px'
                }).setOrigin(0.5);
            }
        }

        // Индикатор прогресса
        const progressText = this.add.text(menuX, startY + rows * (buttonHeight + gap) + 20, 
            `Открыто: ${this.maxLevel} / ${this.totalLevels}`, {
                fontSize: '16px',
                fontFamily: '"Press Start 2P", Arial',
                color: '#666666'
            }).setOrigin(0.5);
    }

    selectLevel(level) {
        // Запускаем игру с выбранным уровнем
        this.scene.start('Game', { level: level });
        this.scene.stop();
    }

    goBack() {
        this.scene.stop();
        this.scene.start('Menu');
    }
}
