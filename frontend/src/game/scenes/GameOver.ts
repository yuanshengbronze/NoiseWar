import { EventBus } from '../EventBus';
import { Scene, Scenes } from 'phaser';
import {socket} from '../../socket.ts';

export class GameOver extends Scene
{
    camera!: Phaser.Cameras.Scene2D.Camera;
    background!: Phaser.GameObjects.Image;
    gameOverText!: Phaser.GameObjects.Text;
    restartButton!: Phaser.GameObjects.Text;
    reasonText!: Phaser.GameObjects.Text;

    constructor ()
    {
        super('GameOver');
    }

    create (data: {reason: string})
    {
        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0xff0000);

        socket.once("game-started", (data) => {
            this.registry.set("startedAt", data.startedAt);
            this.registry.set("endsAt", data.endsAt);
            this.scene.stop("GameOver");
            this.scene.start("UI");
        });

        socket.once("player-disconnected", () => {
            this.scene.stop("GameOver");
            this.scene.start('MainMenu');
        })

        socket.once("player-left", () => {
            this.scene.stop("GameClear");
            this.scene.start('MainMenu');
        })

        socket.once("player-joined", () => {
            this.scene.stop("GameOver");
            this.scene.start('MainMenu');
        })

        this.background = this.add.image(400, 300, 'background');
        this.background.setAlpha(0.5);

        this.gameOverText = this.add.text(400, 300, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.reasonText = this.add.text(400, 380, `${data.reason}`, {
            fontFamily: 'Arial Black', fontSize: 59, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.restartButton = this.add.text(400, 500, 'RESTART', {
            fontFamily: 'Arial Black', fontSize: 35, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

        const roomCode = this.registry.get("roomCode");
        
        this.restartButton.on("pointerover", () => {
            this.restartButton.setStyle({ backgroundColor: "#555555" });
        });

        this.restartButton.on("pointerout", () => {
            this.restartButton.setStyle({ backgroundColor: "#333333" });
        });

        this.restartButton.on("pointerdown", () => {
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
        EventBus.on("leaving-room", this.handleLeavingRoom, this);
        
        this.events.once(Scenes.Events.SHUTDOWN, () => {
            EventBus.off("leaving-room", this.handleLeavingRoom, this);
        });
        EventBus.emit('current-scene-ready', this);
    }

    handleLeavingRoom() {
        EventBus.emit("phaser-cleanup-complete");
        this.scene.stop("GameClear");
    }
}