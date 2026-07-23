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

type SabotageType = "pause" | "command-switch";

interface WarningPayload {
    message: string;
}

interface SabotageUsesUpdatedPayload {
    type: SabotageType,
    remainingUses: number
}

export class UI extends Scene
{
    timeText!: Phaser.GameObjects.Text;

    commandText!: Phaser.GameObjects.Text;
    commandTween?: Phaser.Tweens.Tween;
    sabotageText!: Phaser.GameObjects.Text;

    COMMAND_SWITCH_DURATION_MS = 15_000;
    commandSwitchEndsAt = 0;
    commandSwitchWord = "switch";
    commandSwitchText!: Phaser.GameObjects.Text;
    commandSwitchTimerText!: Phaser.GameObjects.Text;
    commandSwitchTimer?: Phaser.Time.TimerEvent;
    commandSwitchCommands!: CommandSwitchCommands;
    hasStartedCommandTextExit = false;

    sabotageWord!: string;
    sabotageUsesText!: Phaser.GameObjects.Text;
    warningText!: Phaser.GameObjects.Text;
    warningTween?: Phaser.Tweens.Tween;
    sabotageUses: Record<SabotageType, number> = {
        pause: 2,
        "command-switch": 1,
    };

    gameScene!: Game;
    endsAt!: number;
    timeOffset!: number;

    constructor ()
    {
        super('UI');
    }

    create ()
    {
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
        this.commandText.setOrigin(0.5, 0).setDepth(9999).setScrollFactor(0).setAlpha(0);

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

        this.commandSwitchCommands = this.registry.get("commandSwitchCommands") || DEFAULT_COMMAND_SWITCH_COMMANDS;
        this.commandSwitchText = this.add.text(this.scale.width / 2 - 155, 210, "", {
            fontFamily: 'Arial',
            fontSize: 22,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3,
            align: "center"
        }).setVisible(false);

        this.commandSwitchTimerText = this.add.text(this.scale.width / 2, this.scale.height / 2, "", {
            fontFamily: "Arial Black",
            fontSize: 72,
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            align: "center",
        })
        .setOrigin(0.5).setAlpha(0.26).setVisible(false).setDepth(900);

        this.updateCommandSwitchText();

        this.sabotageUsesText = this.add.text(this.scale.width - 20, 20, "", 
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#ffffff",
                align: "right",
                backgroundColor: "#000000",
                padding: {
                x: 12,
                y: 8,
            },
        })
        .setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        this.warningText = this.add
            .text(this.scale.width / 2, this.scale.height / 2, "", {
                fontFamily: "Arial Black",
                fontSize: "28px",
                color: "#ff3b30",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5,
            })
            .setOrigin(0.5).setScrollFactor(0).setDepth(1001).setVisible(false).setAlpha(1);

        EventBus.on("command", this.displayCommand, this);
        EventBus.on("sabotage-uses-updated", this.handleSabotageUsesUpdated);
        EventBus.on("sabotage-uses-reset", this.handleSabotageUsesReset);
        EventBus.on("command-switch-active", this.handleCommandSwitchActive);
        EventBus.on("show-warning", this.handleShowWarning);

        this.events.once(Scenes.Events.SHUTDOWN, () => {
            EventBus.off("command", this.displayCommand, this);
            EventBus.off("sabotage-uses-updated", this.handleSabotageUsesUpdated);
            EventBus.off("sabotage-uses-reset", this.handleSabotageUsesReset);
            EventBus.off("command-switch-active", this.handleCommandSwitchActive);
            EventBus.off("show-warning", this.handleShowWarning);

            this.warningTween?.stop();
            this.warningTween = undefined;

            this.tweens.killTweensOf(this.warningText);
            this.stopCommandSwitchDisplay();
        });

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
        this.commandSwitchWord = word.trim().toLowerCase() || "switch";
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
        
        if (this.gameScene) {
            this.sabotageText.setVisible(
                this.gameScene.scene.isPaused(),
            );
        }
    }
    
    stopSabotage(): void {
        if (!this.gameScene.scene.isPaused()) {
            return;
        }

        this.gameScene.scene.resume();

        socket.emit("sabotage-ended", {
            roomCode: this.registry.get("roomCode"),
            type: "pause",
        });
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
    
    handleSabotageUsesUpdated = (payload: SabotageUsesUpdatedPayload) => {
        this.sabotageUses[payload.type] = payload.remainingUses;
        this.updateSabotageUsesText();
    };

    handleShowWarning = ({message}: WarningPayload) => {
        this.showWarning(message);
    };

    handleSabotageUsesReset = () => {
        this.sabotageUses = {
            pause: 2,
            "command-switch": 1,
        };
        this.updateSabotageUsesText();
    };

    updateSabotageUsesText() {
        if (!this.sabotageUsesText) {
            return;
        }

        this.sabotageUsesText.setText([
            "SABOTAGE USES",
            `Pause: ${this.sabotageUses.pause}`,
            `Command Switch: ${this.sabotageUses["command-switch"]}`,
        ]);
    }

    showWarning(message: string): void {
        if (!this.warningText) {
            return;
        }

        this.warningTween?.stop();
        this.tweens.killTweensOf(this.warningText);

        this.warningText.setText(message).setVisible(true).setAlpha(1);

        this.warningTween = this.tweens.add({
            targets: this.warningText,
            alpha: 0.2,
            duration: 150,
            yoyo: true,
            repeat: 2,
            hold: 100,

            onComplete: () => {
                this.warningText.setVisible(false).setAlpha(1); 
                this.warningTween = undefined;
            },
        });
    }

    flashAndHideCommandSwitchText(): void {
        this.tweens.killTweensOf(this.commandSwitchText);

        this.tweens.add({
            targets: this.commandSwitchText,
            alpha: 0,
            duration: 150,
            yoyo: true,
            repeat: 2,

            onComplete: () => {
            this.commandSwitchText
                .setVisible(false)
                .setAlpha(1);
            },
        });
    }

    handleCommandSwitchActive = ({active, durationMs = 15_000}: {active: boolean; durationMs?: number}): void => {
        if (active) {
            this.startCommandSwitchDisplay(durationMs);
        } else {
            this.stopCommandSwitchDisplay();
        }
    };

    startCommandSwitchDisplay(durationMs = 15_000): void {
        this.stopCommandSwitchDisplay();
        this.COMMAND_SWITCH_DURATION_MS = durationMs;
        this.commandSwitchEndsAt = this.time.now + durationMs;
        this.hasStartedCommandTextExit = false;

        this.updateCommandSwitchText();

        this.commandSwitchText
            .setVisible(true)
            .setAlpha(1);

        this.commandSwitchTimerText
            .setVisible(true)
            .setAlpha(0.18);

        this.updateCommandSwitchDisplay();

        this.commandSwitchTimer = this.time.addEvent({
            delay: 100,
            loop: true,
            callback: this.updateCommandSwitchDisplay,
            callbackScope: this,
        });
    }
    getCommandSwitchTimeRemaining(): number {
        return Math.max(0, this.commandSwitchEndsAt - this.time.now);
    }
    updateCommandSwitchDisplay(): void {
        const remainingMs = this.getCommandSwitchTimeRemaining();
        const remainingSeconds = Math.ceil(remainingMs / 1000);

        this.commandSwitchTimerText.setText(
            remainingSeconds > 0 ? remainingSeconds.toString() : "",
        );

        const halfwayPoint = this.COMMAND_SWITCH_DURATION_MS / 2;

        if (
            remainingMs <= halfwayPoint &&
            !this.hasStartedCommandTextExit
        ) {
            this.hasStartedCommandTextExit = true;
            this.flashAndHideCommandSwitchText();
        }

        if (remainingMs <= 0) {
            this.stopCommandSwitchDisplay();
        }
    }
    stopCommandSwitchDisplay(): void {
        this.commandSwitchTimer?.remove(false);
        this.commandSwitchTimer = undefined;

        this.tweens.killTweensOf(this.commandSwitchText);

        if (this.commandSwitchText) {
            this.commandSwitchText
            .setVisible(false)
            .setAlpha(1);
        }

        if (this.commandSwitchTimerText) {
            this.commandSwitchTimerText
            .setVisible(false)
            .setText("");
        }

        this.commandSwitchEndsAt = 0;
        this.hasStartedCommandTextExit = false;
    }
}
