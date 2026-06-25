import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    background!: GameObjects.Image;
    title!: GameObjects.Text;
    subtitle!: GameObjects.Text;
    logo !: GameObjects.Image;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(400, 300, 'background');

        this.logo = this.add.image(400, 300, 'logo').setScale(1.5);

        this.subtitle = this.add.text(400, 500, 'Press the Next Button to Start!', {
            fontFamily: 'Arial Black', fontSize: 35, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        EventBus.emit('current-scene-ready', this);
    }
    
    changeScene ()
    {
        this.scene.start('UI');
    }
}