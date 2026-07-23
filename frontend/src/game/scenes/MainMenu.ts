import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import {socket} from '../../socket.ts';

export class MainMenu extends Scene
{
    background!: GameObjects.Image;
    title!: GameObjects.Text;
    startButton!: GameObjects.Text;
    logo !: GameObjects.Image;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        socket.on("game-started", (data) => {
            EventBus.emit("sabotage-uses-reset");
            this.registry.set("startedAt", data.startedAt);
            this.registry.set("endsAt", data.endsAt);
            this.registry.set("maze", data.maze);
            this.changeScene();
        });

        this.background = this.add.image(400, 300, 'background');

        this.logo = this.add.image(400, 300, 'logo').setScale(1.5);

        this.startButton = this.add.text(400, 500, 'START', {
            fontFamily: 'Arial Black', fontSize: 35, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

        const roomCode = this.registry.get("roomCode");

        this.startButton.on("pointerover", () => {
            this.startButton.setStyle({ backgroundColor: "#555555" });
        });

        this.startButton.on("pointerout", () => {
            this.startButton.setStyle({ backgroundColor: "#333333" });
        });

        this.startButton.on("pointerdown", () => {
            socket.emit(
                "start-game",
                { roomCode },
                (response: { success: boolean; error?: string }) => {
                    if (!response.success) {
                        alert(response.error || "Could not start game.");
                    }
                },
            );
        });

        EventBus.emit('current-scene-ready', this);
    }
    
    changeScene ()
    {
        this.scene.start('UI');
    }
}