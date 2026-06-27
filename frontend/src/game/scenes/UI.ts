import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import {Game} from './Game';
import {socket} from "../../socket";


export class UI extends Scene
{
    camera!: Phaser.Cameras.Scene2D.Camera;
    timer!: Phaser.Time.TimerEvent;
    timeText!: Phaser.GameObjects.Text;
    sabotageText!: Phaser.GameObjects.Text;
    sabotageWord!: string;
    gameScene!: Game;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor ()
    {
        super('UI');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.gameScene = this.scene.get('Game') as Game;

        //TIMER
        this.timer = this.time.addEvent({
            delay: 1 * 60 * 1000, // ms
            //args: [],
            callback: this.timeOut,
            callbackScope: this
        });

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
        EventBus.emit('current-scene-ready', this);
    }

    setSabotageWord(word: string) {
        this.sabotageWord = word.trim().toLowerCase();

        const sabotagePrompt = this.sabotageWord
            ? `SAY THE WORD '${this.sabotageWord.toUpperCase()}'`
            : "SAY THE WORD ...";

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
        if (this.timer) {
            const remainingSeconds = this.timer.getRemainingSeconds() + 1;
            const min = Math.floor(remainingSeconds / 60);
            const sec = Math.floor(remainingSeconds % 60);

            const stringMin = min < 10 ? `0${min}` : `${min}`;
            const stringSec = sec < 10 ? `0${sec}` : `${sec}`;

            this.timeText.setText(`${stringMin}:${stringSec}`);
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
