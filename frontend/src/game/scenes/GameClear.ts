import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameClear extends Scene
{
    camera!: Phaser.Cameras.Scene2D.Camera;
    background!: Phaser.GameObjects.Image;
    gameClearText!: Phaser.GameObjects.Text;
    winnerText!: Phaser.GameObjects.Text;

    constructor ()
    {
        super('GameClear');
    }

    create (data: {winner: string})
    {
        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0x0000ff);

        this.background = this.add.image(400, 300, 'background');
        this.background.setAlpha(0.5);

        this.gameClearText = this.add.text(400, 300, 'Game Clear!', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.winnerText = this.add.text(400, 400, `Winner: ${data.winner}`, {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}