// Глобальный менеджер аудио для управления всеми звуками
const AudioManager = {
    // Список ключей звуковых эффектов (не музыки)
    SFX_KEYS: ['hit', 'bounce', 'knock', 'win', 'lose', 'bonus', 'explosion'],

    // Состояние
    sfxEnabled: true,
    musicEnabled: true,
    iosUnlocked: false,
    isIOSDevice: false,

    // Инициализация (вызывается один раз при загрузке)
    init(scene) {
        // Загружаем настройки из Storage
        this.sfxEnabled = GameStorage.getSoundEnabled();
        this.musicEnabled = GameStorage.getMusicEnabled();

        // Проверяем iOS
        this.isIOSDevice = this.isIOS();

        // Настраиваем громкость для всех звуков
        this.updateAllVolumes();

        // Разблокировка аудио на iOS
        if (this.isIOSDevice) {
            this.setupIOSUnlock(scene);
        }
    },

    // Настройка разблокировки аудио на iOS
    setupIOSUnlock(scene) {
        const unlockAudio = () => {
            if (this.iosUnlocked) return;

            // Получаем аудио контекст из Phaser Sound Manager
            const audioContext = scene.sound.context;
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('iOS Audio unlocked');
                });
            }

            // Пробуем воспроизвести короткий звук для разблокировки
            try {
                const tempSound = scene.sound.get('bounce');
                if (tempSound) {
                    tempSound.play({ volume: 0.01, mute: true });
                    setTimeout(() => tempSound.stop(), 10);
                }
            } catch (e) {
                // Игнорируем ошибки при первой разблокировке
            }

            this.iosUnlocked = true;
        };

        // Слушаем первое взаимодействие пользователя
        document.addEventListener('touchstart', unlockAudio, { passive: true });
        document.addEventListener('click', unlockAudio, { once: false });
        document.addEventListener('pointerdown', unlockAudio, { passive: true });

        // Также пробуем разблокировать при любом взаимодействии с игрой
        scene.input.on('pointerdown', unlockAudio);
        scene.input.keyboard?.on('keydown', unlockAudio);
    },

    // Принудительная разблокировка (вызывать при первом клике в игре)
    forceUnlock(scene) {
        if (!this.isIOSDevice || this.iosUnlocked) return;

        const audioContext = scene.sound.context;
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        this.iosUnlocked = true;
    },

    // Проверка на iOS устройство
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    },

    // Обновить громкость всех звуков
    updateAllVolumes() {
        const scene = this.getAnyScene();
        if (!scene?.sound) return;

        // Обновляем громкость для всех SFX
        this.SFX_KEYS.forEach(key => {
            const sound = scene.sound.get(key);
            if (sound) {
                sound.setMute(!this.sfxEnabled);
            }
        });

        // Обновляем музыку
        const bgMusic = scene.sound.get('backgroundMusic');
        if (bgMusic) {
            bgMusic.setMute(!this.musicEnabled);
        }
    },

    // Получить любую активную сцену для доступа к sound manager
    getAnyScene() {
        if (typeof game !== 'undefined' && game.scene) {
            const scenes = game.scene.getScenes();
            return scenes.find(s => s && s.sound) || scenes[0];
        }
        return null;
    },

    // Переключить звуки (SFX)
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        GameStorage.setSoundEnabled(this.sfxEnabled);
        this.updateAllVolumes();
        return this.sfxEnabled;
    },

    // Переключить музыку
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        GameStorage.setMusicEnabled(this.musicEnabled);

        // Сначала обновляем mute для всех сцен
        this.updateAllVolumes();

        // Затем управляем воспроизведением
        if (typeof game !== 'undefined') {
            if (this.musicEnabled) {
                // Включаем музыку
                if (game.backgroundMusic) {
                    if (game.backgroundMusic.isPaused) {
                        game.backgroundMusic.resume();
                    } else if (!game.backgroundMusic.isPlaying) {
                        // Если музыка вообще не играет - запускаем
                        const scene = this.getAnyScene();
                        if (scene) {
                            scene.sound.play('backgroundMusic', { loop: true, volume: 1 });
                        }
                    }
                }
            } else {
                // Выключаем музыку
                if (game.backgroundMusic) {
                    game.backgroundMusic.pause();
                }
            }
        }

        return this.musicEnabled;
    },

    // Получить состояние SFX
    isSFXEnabled() {
        return this.sfxEnabled;
    },

    // Получить состояние музыки
    isMusicEnabled() {
        return this.musicEnabled;
    }
};
