// Вспомогательный класс для создания UI элементов
const UIHelper = {
    // Стили текста
    TEXT_STYLES: {
        TITLE: {
            fontSize: '32px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#414141',
            fontStyle: 'bold'
        },
        BUTTON: {
            fontSize: '25px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: '#424141',
            strokeThickness: 4
        },
        BUTTON_SMALL: {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: '#424141',
            strokeThickness: 3
        },
        INSTRUCTION: {
            fontSize: '18px',
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: '#424141',
            strokeThickness: 4
        }
    },

    // Цвета для кнопок
    COLORS: {
        BUTTON_DEFAULT: 0x4CAF50,
        BUTTON_HOVER: 0x66BB6A,
        BUTTON_DISABLED: 0xf44336,
        BUTTON_DISABLED_HOVER: 0xef5350,
        BUTTON_LOCKED: 0x999999
    },

    /**
     * Создать кнопку с текстом внутри фона
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} x - Позиция X
     * @param {number} y - Позиция Y
     * @param {string} text - Текст кнопки
     * @param {Function} callback - Callback при нажатии
     * @param {Object} options - Опции (padding, fontSize, texture, tint)
     * @returns {Phaser.GameObjects.Container}
     */
    createButton(scene, x, y, text, callback, options = {}) {
        const {
            padding = 25,
            fontSize = 25,
            texture = 'btn',
            tint = null,
            hoverTint = 0xcccccc,
            pressTint = 0x999999
        } = options;

        const style = {
            fontSize: `${fontSize}px`,
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: '#424141',
            strokeThickness: options.strokeThickness || 4
        };

        // Измеряем текст
        const tempText = scene.add.text(0, 0, text, style).setOrigin(0.5);
        const textBounds = tempText.getBounds();
        tempText.destroy();

        const buttonWidth = textBounds.width + padding * 2;
        const buttonHeight = textBounds.height + padding * 1.5;

        // Создаём контейнер
        const container = scene.add.container(x, y);

        // Фон
        const bg = scene.add.image(0, 0, texture)
            .setDisplaySize(buttonWidth, buttonHeight)
            .setOrigin(0.5);

        if (tint) bg.setTint(tint);

        // Текст
        const buttonText = scene.add.text(0, 0, text, style).setOrigin(0.5);

        container.add([bg, buttonText]);
        container.setSize(buttonWidth, buttonHeight);
        container.bg = bg;
        container.text = buttonText;

        // Интерактивность
        container.setInteractive({ useHandCursor: true })
            .on('pointerover', () => bg.setTint(hoverTint))
            .on('pointerout', () => {
                bg.clearTint();
                if (tint) bg.setTint(tint);
            })
            .on('pointerdown', () => {
                bg.setTint(pressTint);
                callback();
            });

        return container;
    },

    /**
     * Создать кнопку переключатель (вкл/выкл)
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} x - Позиция X
     * @param {number} y - Позиция Y
     * @param {string} text - Текст кнопки
     * @param {Function} callback - Callback при нажатии
     * @param {boolean} isEnabled - Включено ли
     * @param {Object} options - Опции
     * @returns {Phaser.GameObjects.Container}
     */
    createToggleButton(scene, x, y, text, callback, isEnabled, options = {}) {
        const { padding = 20, fontSize = 20 } = options;

        const style = {
            fontSize: `${fontSize}px`,
            fontFamily: '"Press Start 2P", Arial',
            color: '#E5E5E5',
            stroke: '#424141',
            strokeThickness: 3
        };

        // Измеряем текст
        const tempText = scene.add.text(0, 0, text, style).setOrigin(0.5);
        const textBounds = tempText.getBounds();
        tempText.destroy();

        const buttonWidth = textBounds.width + padding * 2;
        const buttonHeight = textBounds.height + padding * 1.5;

        // Создаём контейнер
        const container = scene.add.container(x, y);

        // Фон
        const bg = scene.add.image(0, 0, 'btn')
            .setDisplaySize(buttonWidth, buttonHeight)
            .setOrigin(0.5);

        const defaultTint = isEnabled ? this.COLORS.BUTTON_DEFAULT : this.COLORS.BUTTON_DISABLED;
        bg.setTint(defaultTint);

        // Текст
        const buttonText = scene.add.text(0, 0, text, style).setOrigin(0.5);

        container.add([bg, buttonText]);
        container.setSize(buttonWidth, buttonHeight);
        container.bg = bg;
        container.text = buttonText;
        container._isEnabled = isEnabled; // Храним состояние на кнопке

        // Интерактивность - используем container._isEnabled вместо замыкания
        container.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                const hoverTint = container._isEnabled ? this.COLORS.BUTTON_HOVER : this.COLORS.BUTTON_DISABLED_HOVER;
                bg.setTint(hoverTint);
            })
            .on('pointerout', () => {
                const defaultTint = container._isEnabled ? this.COLORS.BUTTON_DEFAULT : this.COLORS.BUTTON_DISABLED;
                bg.setTint(defaultTint);
            })
            .on('pointerdown', () => {
                const pressTint = container._isEnabled ? this.COLORS.BUTTON_HOVER : this.COLORS.BUTTON_DISABLED_HOVER;
                bg.setTint(pressTint);
                callback();
            });

        return container;
    },

    /**
     * Обновить состояние toggle кнопки
     * @param {Phaser.GameObjects.Container} button - Кнопка
     * @param {string} text - Новый текст
     * @param {boolean} isEnabled - Включено ли
     */
    updateToggleButton(button, text, isEnabled) {
        if (!button) return;

        // Обновляем состояние
        button._isEnabled = isEnabled;

        if (button.text) {
            button.text.setText(text);
        }

        if (button.bg) {
            button.bg.clearTint();
            button.bg.setTint(isEnabled ? this.COLORS.BUTTON_DEFAULT : this.COLORS.BUTTON_DISABLED);
        }
    },

    /**
     * Создать фон на всю сцену
     * @param {Phaser.Scene} scene - Сцена
     * @param {string} texture - Текстура фона
     * @returns {Phaser.GameObjects.Image}
     */
    createBackground(scene, texture) {
        const { width, height } = scene.game.config;
        return scene.add.image(0, 0, texture)
            .setOrigin(0, 0)
            .setDisplaySize(width, height);
    },

    /**
     * Создать затемняющий оверлей
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} alpha - Прозрачность (0-1)
     * @returns {Phaser.GameObjects.Rectangle}
     */
    createOverlay(scene, alpha = 0.7) {
        const { width, height } = scene.game.config;
        return scene.add.rectangle(0, 0, width, height, 0x000000, alpha)
            .setOrigin(0);
    },

    /**
     * Создать контейнер меню
     * @param {Phaser.Scene} scene - Сцена
     * @param {number} width - Ширина меню
     * @param {number} height - Высота меню
     * @param {number} x - Позиция X (по умолчанию центр)
     * @param {number} y - Позиция Y (по умолчанию центр)
     * @returns {Phaser.GameObjects.Container}
     */
    createMenuContainer(scene, width, height, x, y) {
        const centerX = x ?? scene.game.config.width / 2;
        const centerY = y ?? scene.game.config.height / 2;

        const container = scene.add.container(centerX, centerY);

        const bg = scene.add.rectangle(0, 0, width, height, 0xfdffff)
            .setOrigin(0.5)
            .setStrokeStyle(10, 0x777777);

        container.add(bg);
        container.setSize(width, height);
        container.bg = bg;

        return container;
    },

    /**
     * Анимация появления с масштабированием
     * @param {Phaser.GameObjects.GameObject} target - Объект
     * @param {number} duration - Длительность в мс
     * @param {Function} onComplete - Callback после завершения
     */
    animatePopIn(target, duration = 300, onComplete) {
        target.setScale(0);
        target.scene.tweens.add({
            targets: target,
            scaleX: 1,
            scaleY: 1,
            duration,
            ease: 'Back.easeOut',
            onComplete
        });
    }
};
