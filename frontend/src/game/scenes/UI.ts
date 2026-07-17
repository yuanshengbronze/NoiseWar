import { Scene, Scenes } from 'phaser';
import {Game} from './Game';
import {socket} from "../../socket";
import { EventBus } from '../EventBus';

export class UI extends Scene
{
    camera!: Phaser.Cameras.Scene2D.Camera;
    timeText!: Phaser.GameObjects.Text;
    commandText!: Phaser.GameObjects.Text;
    commandTween?: Phaser.Tweens.Tween;
    sabotageText!: Phaser.GameObjects.Text;
    sabotageWord!: string;
    gameScene!: Game;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    endsAt!: number;
    timeOffset!: number;

    constructor ()
    {
        super('UI');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.gameScene = this.scene.get('Game') as Game;
        const startedAt = this.registry.get("startedAt");
        this.endsAt = this.registry.get("endsAt");

        this.timeOffset = startedAt - Date.now();

        this.timeText = this.add.text(0, 0, "0:00", {
            fontFamily: 'Arial', 
            fontSize: 26, 
            color: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 3,
            align: "center"
        })

        this.commandText = this.add.text(
            this.scale.width / 2,
            30,
            "",
            {
                fontFamily: "Arial",
                fontSize: "28px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: {
                x: 12,
                y: 6,
                },
            }
        );

        this.commandText
        .setOrigin(0.5, 0)
        .setDepth(9999)
        .setScrollFactor(0)
        .setAlpha(0);

        this.events.once(Scenes.Events.SHUTDOWN, () => {
            EventBus.off("command", this.displayCommand, this);
        });

        this.sabotageWord = this.registry.get("sabotageWord") || "";
        const sabotagePrompt = this.sabotageWord
            ? `SAY THE WORD '${this.sabotageWord.toUpperCase()}'`
            : "SAY THE WORD ...";

        this.sabotageText = this.add.text(170, 300, `YOU ARE SABOTAGED! \n${sabotagePrompt}`, {
            fontFamily: 'Arial', 
            fontSize: 30, 
            color: '#ff0000',
            stroke: '#000000', 
            strokeThickness: 3,
            align: "center"
        }).setVisible(false);

        EventBus.on("command", this.displayCommand, this);

        this.scene.launch('Game');
    }

    setSabotageWord(word: string) {
        this.sabotageWord = word.trim().toLowerCase();

        const sabotagePrompt = this.sabotageWord
            ? `SPELL THE WORD '${this.sabotageWord.toUpperCase()}'`
            : "SPELL THE WORD ...";

        this.sabotageText.setText(`YOU ARE SABOTAGED! \n${sabotagePrompt}`);
    }

    matchesSabotageWord(term: string) {
        const letters = term
            .trim()
            .toLowerCase()
            .split(/\s+/);

        const targetWord = this.sabotageWord?.trim().toLowerCase();

        if (!targetWord) {
            return false;
        }

        const spelledWord = letters.join("");

        return letters.length === targetWord.length && spelledWord === targetWord;
    }

    update() {
        //COUNTDOWN
        const estimatedServerNow = Date.now() + this.timeOffset;
        const remainingMs = Math.max(0, this.endsAt - estimatedServerNow);

        const totalSeconds = Math.ceil(remainingMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        this.timeText.setText(`${minutes}:${seconds.toString().padStart(2, "0")}`);

        if (remainingMs <= 0) {
            this.timeText.setText("0:00");
        }
        
        if (this.gameScene) {
            //SABOTAGE
            if (this.gameScene.scene.isPaused()) {
                this.sabotageText.setVisible(true);
            } else {
                this.sabotageText.setVisible(false);
            }
        }
    }
    
    stopSabotage() {
        this.gameScene.scene.resume();
    }

    timeOut() {
        socket.emit("time-out", {
            roomCode: this.registry.get("roomCode"),
            username: this.gameScene.user
        })
    }

    displayCommand(data: { command: string }) {
        this.commandText.setText(`${data.command}`);

        if (this.commandTween) {
        this.commandTween.stop();
        }

        this.commandText.setAlpha(1);
        this.commandText.setScale(1.15);

        this.commandTween = this.tweens.add({
        targets: this.commandText,
        alpha: 0,
        scale: 1,
        duration: 400,
        delay: 500,
        ease: "Power2",
        });
    }
}
