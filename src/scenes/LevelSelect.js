class LevelSelect extends Phaser.Scene {
    constructor() {
        super('LevelSelect');
    }

    create() {
        const { width, height } = this.game.config;

        // Фон
        UIHelper.createBackground(this, 'bg');

        // Получаем данные об уровнях
        this.totalLevels = GameStorage.getTotalLevels();
        this.maxLevel = GameStorage.getMaxLevel();

        // Создаём меню
        this.createMenu(width, height);

        // Обработка выхода
        this.setupInput();

        // Анимация появления
        UIHelper.animatePopIn(this.menuContainer, 300);
    }

    createMenu(width, height) {
        const menuWidth = Math.min(600, width - 40);
        const menuHeight = Math.min(500, height - 100);
        const centerX = width / 2;
        const centerY = height / 2;

        // Затемнение фона
        this.overlay = UIHelper.createOverlay(this, 0.7)
            .setInteractive()
            .on('pointerdown', () => this.goBack());

        // Контейнер меню
        this.menuContainer = this.add.container(centerX, centerY);
        this.menuBg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0xfdffff)
            .setOrigin(0.5)
            .setStrokeStyle(10, 0x777777);
        this.menuContainer.add(this.menuBg);

        // Заголовок
        const title = this.add.text(0, -menuHeight / 2 + 40, 'ВЫБОР УРОВНЯ', {
            ...UIHelper.TEXT_STYLES.TITLE
        }).setOrigin(0.5);
        this.menuContainer.add(title);

        // Сетка уровней
        this.createLevelGrid(menuWidth, menuHeight);

        // Кнопка "Назад"
        this.createBackButton(menuHeight);
    }

    createLevelGrid(menuWidth, menuHeight) {
        const cols = 5;
        const buttonSize = 70;
        const gap = 10;

        const gridWidth = cols * buttonSize + (cols - 1) * gap;
        const startX = -gridWidth / 2 + buttonSize / 2;
        const startY = -menuHeight / 2 + 100;

        for (let i = 0; i < this.totalLevels; i++) {
            this.createLevelButton(i, cols, buttonSize, gap, startX, startY);
        }

        // Индикатор прогресса
        const progressY = startY + Math.ceil(this.totalLevels / cols) * (buttonSize + gap) + 20;
        const progressText = this.add.text(0, progressY,
            `Открыто: ${this.maxLevel} / ${this.totalLevels}`, {
                fontSize: '16px',
                fontFamily: '"Press Start 2P", Arial',
                color: '#666666'
            }).setOrigin(0.5);
        this.menuContainer.add(progressText);
    }

    createLevelButton(index, cols, buttonSize, gap, startX, startY) {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = startX + col * (buttonSize + gap);
        const y = startY + row * (buttonSize + gap);

        const isUnlocked = GameStorage.isLevelUnlocked(index + 1);
        const color = isUnlocked ? 0x4CAF50 : 0x999999;
        const borderColor = isUnlocked ? 0x2E7D32 : 0x666666;

        // Фон кнопки
        const buttonBg = this.add.rectangle(x, y, buttonSize, buttonSize, color)
            .setOrigin(0.5)
            .setStrokeStyle(3, borderColor);

        // Номер уровня
        const textColor = isUnlocked ? '#ffffff' : '#cccccc';
        const levelText = this.add.text(x, y, (index + 1).toString(), {
            fontSize: '28px',
            fontFamily: '"Press Start 2P", Arial',
            color: textColor,
            fontStyle: isUnlocked ? 'bold' : 'normal'
        }).setOrigin(0.5);

        this.menuContainer.add([buttonBg, levelText]);

        // Замок для заблокированных
        if (!isUnlocked) {
            const lockText = this.add.text(x, y + 25, '🔒', { fontSize: '20px' }).setOrigin(0.5);
            this.menuContainer.add(lockText);
        }

        // Интерактивность для разблокированных
        if (isUnlocked) {
            buttonBg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => buttonBg.setFillStyle(0x66BB6A))
                .on('pointerout', () => buttonBg.setFillStyle(0x4CAF50))
                .on('pointerdown', () => this.selectLevel(index));
        }
    }

    createBackButton(menuHeight) {
        const backButton = this.add.text(0, menuHeight / 2 - 40, '◀ Назад', {
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
        this.menuContainer.add(backButton);
    }

    setupInput() {
        const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escKey?.on('up', () => this.goBack());
    }

    selectLevel(level) {
        this.scene.start('Game', { level });
        this.scene.stop();
    }

    goBack() {
        this.scene.stop();
        this.scene.start('Menu');
    }
}
