class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Загрузка минимальных ассетов для экрана загрузки
        this.load.setPath('assets/images/');
        this.load.image('logo', 'logo.png');
    }

    create() {
        this.scene.start('Preload');
    }
}