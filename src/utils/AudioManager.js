// Глобальный менеджер аудио для управления всеми звуками
const AudioManager = {
    // Список ключей звуковых эффектов (не музыки)
    SFX_KEYS: ['hit', 'bounce', 'knock', 'win', 'lose', 'bonus', 'explosion'],

    // Состояние
    sfxEnabled: true,
    musicEnabled: true,
    iosUnlocked: false,

    // Инициализация (вызывается один раз при загрузке)
    init(scene) {
        // Загружаем настройки из Storage
        this.sfxEnabled = GameStorage.getSoundEnabled();
        this.musicEnabled = GameStorage.getMusicEnabled();

        // Настраиваем громкость для всех звуков
        this.updateAllVolumes();
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
