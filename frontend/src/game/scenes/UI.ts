import { Scene, Scenes } from 'phaser';
import {Game} from './Game';
import {socket} from "../../socket";
import { EventBus } from '../EventBus';

interface CommandSwitchCommands {
    above: string;
    down: string;
    right: string;
    left: string;
}

const DEFAULT_COMMAND_SWITCH_COMMANDS: CommandSwitchCommands = {
    above: "north",
    down: "south",
    right: "east",
    left: "west"
};

export class UI extends Scene
{
    camera!: Phaser.Cameras.Scene2D.Camera;
    timeText!: Phaser.GameObjects.Text;
    commandText!: Phaser.GameObjects.Text;
    commandTween?: Phaser.Tweens.Tween;
    sabotageText!: Phaser.GameObjects.Text;
    commandSwitchText!: Phaser.GameObjects.Text;
    sabotageWord!: string;
    commandSwitchWord!: string;
    commandSwitchCommands!: CommandSwitchCommands;
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
            EventBus.off("command-switch-active", this.setCommandSwitchVisible, this);
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

        this.commandSwitchWord = this.registry.get("commandSwitchWord") || "shuffle";
        this.commandSwitchCommands = this.registry.get("commandSwitchCommands") || DEFAULT_COMMAND_SWITCH_COMMANDS;
        this.commandSwitchText = this.add.text(170, 210, "", {
            fontFamily: 'Arial',
            fontSize: 22,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3,
            align: "center"
        }).setVisible(false);
        this.updateCommandSwitchText();

        EventBus.on("command", this.displayCommand, this);
        EventBus.on("command-switch-active", this.setCommandSwitchVisible, this);

        this.scene.launch('Game');
    }

    setSabotageWord(word: string) {
        this.sabotageWord = word.trim().toLowerCase();

        const sabotagePrompt = this.sabotageWord
            ? `SPELL THE WORD '${this.sabotageWord.toUpperCase()}'`
            : "SPELL THE WORD ...";

        this.sabotageText.setText(`YOU ARE SABOTAGED! \n${sabotagePrompt}`);
    }

    setCommandSwitchSettings(word: string, commands: CommandSwitchCommands) {
        this.commandSwitchWord = word.trim().toLowerCase() || "shuffle";
        this.commandSwitchCommands = commands || DEFAULT_COMMAND_SWITCH_COMMANDS;
        this.updateCommandSwitchText();
    }

    updateCommandSwitchText() {
        if (!this.commandSwitchText) {
            return;
        }

        this.commandSwitchText.setText(
            "VOICE COMMANDS SWITCHED!\n" +
            `ABOVE -> ${this.commandSwitchCommands.above.toUpperCase()}\n` +
            `DOWN -> ${this.commandSwitchCommands.down.toUpperCase()}\n` +
            `RIGHT -> ${this.commandSwitchCommands.right.toUpperCase()}\n` +
            `LEFT -> ${this.commandSwitchCommands.left.toUpperCase()}`
        );
    }

    matchesCommandSwitchWord(term: string) {
        const targetWord = this.commandSwitchWord?.trim().toLowerCase();

        if (!targetWord) {
            return false;
        }

        return term.trim().toLowerCase() === targetWord;
    }

    setCommandSwitchVisible(data: { active: boolean }) {
        this.commandSwitchText.setVisible(data.active);
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
