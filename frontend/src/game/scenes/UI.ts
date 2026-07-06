import { Scene } from 'phaser';
import {Game} from './Game';
import {socket} from "../../socket";


export class UI extends Scene
{
    camera!: Phaser.Cameras.Scene2D.Camera;
    timeText!: Phaser.GameObjects.Text;
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
        });

        this.cursors = this.input.keyboard!.createCursorKeys();
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
}
