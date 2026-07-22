import { useState, useRef, useEffect } from "react";
import { type IRefPhaserGame, PhaserGame } from "../PhaserGame";
import { EventBus } from "../game/EventBus";
import { Game } from "../game/scenes/Game";
import annyang from "annyang";
import Login from "./Login";
import type { UI } from "../game/scenes/UI";
import Lobby from "./Lobby";
import Navbar from "../components/Navbar";
import AccountPage from "./AccountPage";
import UserGuide from "../components/UserGuide";
import API_URL from "../config";
import { socket } from "../socket";
import { IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export interface CommandSwitchCommands {
  above: string;
  down: string;
  right: string;
  left: string;
}
const DEFAULT_COMMAND_SWITCH_COMMANDS: CommandSwitchCommands = {
  above: "north",
  down: "south",
  right: "east",
  left: "west",
};

/// ==================== INTERFACES ================================================================
interface CreateRoomResponse {
  success: boolean;
  roomCode: string;
  error?: string;
}
interface JoinRoomResponse {
  success: boolean;
  roomCode: string;
  error?: string;
}
interface UserProfileResponse {
  username: string;
  sabotageWords: string[];
  commandSwitchWord: string;
  commandSwitchCommands: CommandSwitchCommands;
  stats: MatchStats;
}
interface SaveSabotageWordsResponse {
  success: boolean;
  sabotageWords: string[];
  commandSwitchWord: string;
  commandSwitchCommands: CommandSwitchCommands;
  error?: string;
}
interface RegisterActiveUserResponse {
  success: boolean;
  error?: string;
}
interface MatchStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
}
interface GameClearResponse {
  winner: string;
  stats?: Record<string, MatchStats>;
}

function GamePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<
    "lobby" | "account" | "room"
  >("lobby");
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [guideMode, setGuideMode] = useState<"mandatory" | "optional" | null>(
    null,
  );
  const [sabotageWords, setSabotageWords] = useState<string[]>([]);
  const [commandSwitchWord, setCommandSwitchWord] = useState<string>("shuffle");
  const [commandSwitchCommands, setCommandSwitchCommands] =
    useState<CommandSwitchCommands>(DEFAULT_COMMAND_SWITCH_COMMANDS);
  const [isCommandSwitchActive, setIsCommandSwitchActive] = useState(false);
  const [matchStats, setMatchStats] = useState<MatchStats>({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
  });

  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const commandSwitchTimeoutRef = useRef<number | null>(null);
  const activeSabotageWordRef = useRef("");
  const commandSwitchCommandsRef = useRef<CommandSwitchCommands>(
    DEFAULT_COMMAND_SWITCH_COMMANDS,
  );
  const commandSwitchWordRef = useRef("shuffle");
  const isCommandSwitchActiveRef = useRef(false);
  const activeSabotageWord = sabotageWords[0] || "";

  useEffect(() => {
    activeSabotageWordRef.current = activeSabotageWord;
  }, [activeSabotageWord]);

  useEffect(() => {
    commandSwitchWordRef.current = commandSwitchWord;
  }, [commandSwitchWord]);

  useEffect(() => {
    commandSwitchCommandsRef.current = commandSwitchCommands;
  }, [commandSwitchCommands]);

  useEffect(() => {
    isCommandSwitchActiveRef.current = isCommandSwitchActive;
    EventBus.emit("command-switch-active", { active: isCommandSwitchActive });
  }, [isCommandSwitchActive]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  /// ==================== HANDLERS ================================================================
  const handleForcedLogout = () => {
    alert("This account was logged in somewhere else.");
    setIsLoggedIn(false);
    setUser(null);
    setRoomCode("");
    setCurrentPhase("lobby");
    setPlayerCount(1);
    socket.disconnect();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setRoomCode("");
    setCurrentPhase("lobby");
    setPlayerCount(1);
    setIsCommandSwitchActive(false);

    if (commandSwitchTimeoutRef.current) {
      window.clearTimeout(commandSwitchTimeoutRef.current);
      commandSwitchTimeoutRef.current = null;
    }

    if (socket.connected) {
      socket.disconnect();
    }
  };

  const handleLoginCallback = async (username: string, isNewUser = false) => {
    if (!socket.connected) {
      socket.connect();
    }

    const response = await new Promise<RegisterActiveUserResponse>((resolve) => {
      socket.emit("register-active-user", { username }, resolve);
    });

    if (!response.success) {
      throw new Error(response.error || "Could not start your session.");
    }

    setIsLoggedIn(true);
    setUser(username);
    setGuideMode(isNewUser ? "mandatory" : null);
  };

  const closeGuide = () => {
    setGuideMode(null);
  };

  const handleCreateRoom = () => {
    socket.emit(
      "create-room",
      { username: user },
      (response: CreateRoomResponse) => {
        if (response.success) {
          const code = response.roomCode;
          socket.emit(
            "join-room",
            { username: user, roomCode: code },
            (response: JoinRoomResponse) => {
              if (response.success) {
                setCurrentPhase("room");
                setRoomCode(code);
              } else {
                alert("Could not enter room: " + response.error);
              }
            },
          );
        } else {
          alert("Could not create room: " + response.error);
        }
      },
    );
  };

  const handleJoinRoom = (code: string) => {
    socket.emit(
      "join-room",
      { username: user, roomCode: code },
      (response: JoinRoomResponse) => {
        if (response.success) {
          setCurrentPhase("room");
          setRoomCode(code);
        } else {
          alert("Could not enter room: " + response.error);
        }
      },
    );
  };

  const leaveRoom = () => {
    const payload = {
      roomCode,
      username: user,
    };

    let hasLeftRoom = false;
    const finishLeavingRoom = () => {
      if (hasLeftRoom) {
        return;
      }

      hasLeftRoom = true;
      socket.emit("leave-room", payload);
      setRoomCode("");
      setPlayerCount(1);
      setCurrentPhase("lobby");
    };

    EventBus.once("phaser-cleanup-complete", finishLeavingRoom);

    EventBus.emit("leaving-room", payload);
    window.setTimeout(finishLeavingRoom, 100);
  };

  const saveSabotageSettings = async (
    words: string[],
    nextCommandSwitchCommands = commandSwitchCommands,
  ) => {
    if (!user) {
      return;
    }

    const previousWords = sabotageWords;
    const previousCommandSwitchCommands = commandSwitchCommands;
    setSabotageWords(words);
    setCommandSwitchCommands(nextCommandSwitchCommands);

    try {
      const response = await fetch(
        `${API_URL}/api/user/${encodeURIComponent(user)}/sabotage-words`,
        {
          method: "PUT",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify({
            sabotageWords: words,
            commandSwitchCommands: nextCommandSwitchCommands,
          }),
        },
      );

      const data = (await response.json()) as SaveSabotageWordsResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to save sabotage words.");
      }

      setSabotageWords(data.sabotageWords);
      setCommandSwitchWord(data.commandSwitchWord);
      setCommandSwitchCommands(data.commandSwitchCommands);
    } catch (error) {
      console.error(error);
      setSabotageWords(previousWords);
      setCommandSwitchCommands(previousCommandSwitchCommands);
      alert("Could not save sabotage words. Please try again.");
    }
  };

  const handleSabotageWordsChange = async (words: string[]) => {
    await saveSabotageSettings(words);
  };

  const handleCommandSwitchCommandsChange = async (
    commands: CommandSwitchCommands,
  ) => {
    await saveSabotageSettings(sabotageWords, commands);
  };

  const startBoot = () => {
    if (phaserRef.current?.scene) {
      phaserRef.current.scene.scene.start("Boot");
    } else if (phaserRef.current?.game) {
      phaserRef.current.game.scene.start("Boot");
    }
  };

  useEffect(() => {
    EventBus.on("GamePage", () => {
      startBoot();
      setCurrentPhase("lobby");
      setRoomCode("");
    });

    return () => {
      EventBus.removeListener("GamePage");
    };
  }, []);

  useEffect(() => {
    if (currentPhase === "room") {
      startBoot();
    }
  }, [currentPhase]);

  useEffect(() => {
    const handlePlayerJoined = (response: {
      playerCount: number;
      username: string;
    }) => {
      if (playerCount == 2) {
        alert(`${response.username} joined the room`);
      }
      setPlayerCount(response.playerCount);
    };

    const handlePlayerDisconnected = (response: {
      username: string;
      isRoomOpen: boolean;
    }) => {
      if (response.isRoomOpen) {
        setPlayerCount(1);
        alert(`${response.username} left the room`);
      } else {
        setCurrentPhase("lobby");
      }
    };

    socket.on("player-joined", handlePlayerJoined);
    socket.on("player-disconnected", handlePlayerDisconnected);
    socket.on("player-left", handlePlayerDisconnected);
    socket.on("logged-out-elsewhere", handleForcedLogout);
    socket.on("game-clear", (response: GameClearResponse) => {
      if (user && response.stats?.[user]) {
        setMatchStats(response.stats[user]);
      }
    });

    return () => {
      socket.off("player-joined", handlePlayerJoined);
      socket.off("player-disconnected", handlePlayerDisconnected);
      socket.off("player-left", handlePlayerDisconnected);
      socket.off("logged-out-elsewhere", handleForcedLogout);
      socket.off("game-clear");
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/user/${encodeURIComponent(user)}/profile`,
        );
        const data = (await response.json()) as UserProfileResponse;

        if (!response.ok) {
          throw new Error("Failed to fetch user profile.");
        }

        setSabotageWords(data.sabotageWords);
        setCommandSwitchWord(data.commandSwitchWord || "shuffle");
        setCommandSwitchCommands(
          data.commandSwitchCommands || DEFAULT_COMMAND_SWITCH_COMMANDS,
        );
        setMatchStats(data.stats);
      } catch (error) {
        console.error(error);
        setSabotageWords([]);
        setCommandSwitchWord("shuffle");
        setCommandSwitchCommands(DEFAULT_COMMAND_SWITCH_COMMANDS);
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (annyang.isSpeechRecognitionSupported()) {
      const normalizeSpeechTerm = (term = "") => {
        return term
          .toLowerCase()
          .trim()
          .replace(/[.,!?;:]+$/g, "");
      };
      const runMovementCommand = (term = "") => {
        const normalizedTerm = normalizeSpeechTerm(term);
        const latestCommandSwitchCommands = commandSwitchCommandsRef.current;
        const commandWords = isCommandSwitchActiveRef.current
          ? {
              up: normalizeSpeechTerm(latestCommandSwitchCommands.above),
              down: normalizeSpeechTerm(latestCommandSwitchCommands.down),
              left: normalizeSpeechTerm(latestCommandSwitchCommands.left),
              right: normalizeSpeechTerm(latestCommandSwitchCommands.right),
            }
          : {
              up: "above",
              down: "down",
              left: "left",
              right: "right",
            };

        if (normalizedTerm === commandWords.up) {
          control(1);
        } else if (normalizedTerm === commandWords.down) {
          control(2);
        } else if (normalizedTerm === commandWords.left) {
          control(3);
        } else if (normalizedTerm === commandWords.right) {
          control(4);
        }
      };

      const getGameScene = () => {
        return phaserRef.current?.game?.scene.getScene("Game") as Game | undefined;
      };

      const getUIScene = () => {
        return phaserRef.current?.game?.scene.getScene("UI") as UI | undefined;
      };

      const control = (direction: integer) => {
        const gameScene = getGameScene();
        if (gameScene?.scene.isActive()) {
          gameScene.move(direction);
        }
      };

      const sabotage = () => {
        const gameScene = getGameScene();
        if (gameScene?.scene.isActive()) {
          gameScene.sabotage();
        }
      };

      const triggerCommandSwitchSabotage = () => {
        const gameScene = getGameScene();
        if (gameScene?.scene.isActive()) {
          gameScene.commandSwitchSabotage();
        }
      };

      type AnnyangCommand =
        | ((term?: string) => void)
        | {
            regexp: RegExp;
            callback: (term?: string) => void;
      };

      const commands: Record<string, AnnyangCommand> = {
        stop: {
          regexp: /^stop\s*[.!?]?$/i,
          callback: () => {
            control(0);
          },
        },
        sabotage: {
          regexp: /^sabotage\s*[.!?]?$/i,
          callback: sabotage,
        },

        "*term": (term = "") => {
          const normalizedTerm = normalizeSpeechTerm(term);

          const UIScene = getUIScene();

          runMovementCommand(normalizedTerm);

          if (UIScene?.matchesSabotageWord(normalizedTerm)) {
            UIScene.stopSabotage();
          }

          if (UIScene?.matchesCommandSwitchWord(normalizedTerm)) {
            triggerCommandSwitchSabotage();
          }
        },
      };

      annyang.addCommands(commands, true);
      const removeResultMatchCallback = annyang.addCallback("resultMatch", (userSaid) => {
        console.log(userSaid);
        EventBus.emit("command", {
          command: userSaid,
        });
      });

      annyang.start({ autoRestart: true, continuous: true });
      console.log("voice recognition started");

      return () => {
        removeResultMatchCallback();
        annyang.removeCommands();
        annyang.abort();
      };
    } else {
      console.log("voice recognition not supported");
    }
  }, []);

  useEffect(() => {
    const handleCommandSwitchSabotageReceived = () => {
      setIsCommandSwitchActive(true);

      if (commandSwitchTimeoutRef.current) {
        window.clearTimeout(commandSwitchTimeoutRef.current);
      }

      commandSwitchTimeoutRef.current = window.setTimeout(() => {
        EventBus.emit("command-switch-active", { active: false });
        commandSwitchTimeoutRef.current = null;
      }, 10000);
    };

    EventBus.on(
      "command-switch-sabotage-received",
      handleCommandSwitchSabotageReceived,
    );

    return () => {
      EventBus.off(
        "command-switch-sabotage-received",
        handleCommandSwitchSabotageReceived,
      );

      if (commandSwitchTimeoutRef.current) {
        window.clearTimeout(commandSwitchTimeoutRef.current);
        commandSwitchTimeoutRef.current = null;
      }
    };
  }, []);

  if (!isLoggedIn) {
    return <Login loginSuccess={handleLoginCallback} />;
  }

  return (
    <div
      id="app"
      data-room-code={roomCode ?? ""}
      style={{ width: "100%", height: "100vh", overflow: "hidden" }}
    >
      {currentPhase !== "room" && user && (
        <Navbar
          username={user}
          currentPage={currentPhase}
          onNavigate={setCurrentPhase}
          onOpenGuide={() => setGuideMode("optional")}
          onLogout={handleLogout}
        />
      )}
      <UserGuide
        open={guideMode !== null}
        mode={guideMode ?? "optional"}
        currentPage={currentPhase}
        onNavigate={setCurrentPhase}
        onClose={closeGuide}
      />

      {currentPhase === "account" && user && (
        <AccountPage
          username={user}
          sabotageWords={sabotageWords}
          matchStats={matchStats}
          onSabotageWordsChange={handleSabotageWordsChange}
          commandSwitchWord={commandSwitchWord}
          commandSwitchCommands={commandSwitchCommands}
          onCommandSwitchCommandsChange={handleCommandSwitchCommandsChange}
        />
      )}

      {/* Lobby page is displayed */}
      {currentPhase === "lobby" && (
        <div
          style={{
            backgroundImage: `url("/assets/bg.png")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "calc(100vh - 64px)",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <img
            src="/assets/logo.png"
            alt="NoiseWar Logo"
            style={{
              maxWidth: "600px",
              minWidth: "450px",
              height: "auto",
              objectFit: "contain",
              margin: "10px 0",
            }}
          />

          <Lobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            roomCode={roomCode}
          />
        </div>
      )}

      {/* Displays the Phaser Canvas inside the Room */}
      <div
        style={{
          display: currentPhase === "room" ? "flex" : "none",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
            padding: "12px 20px",
            background: "#1e1e24", // High contrast dark gray background
            borderBottom: "2px solid #2d2d34",
            color: "#ffffff", // Forces text to stay white on dark bg
          }}
        >
          {/* Room Code */}
          <h2
            style={{
              margin: "0 0 4px 0",
              fontSize: "22px",
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            Room Code: {roomCode}
          </h2>

          {/* Player Count Indicator */}
          <div
            style={{
              fontSize: "14px",
              color: playerCount === 2 ? "#4caf50" : "#ffb74d", // Green when full, amber when waiting
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: playerCount === 2 ? "#4caf50" : "#ffb74d",
              }}
            />
            Players in Room: {playerCount} / 2
          </div>

          {/* Copy Button */}
          <IconButton
            onClick={() => {
              navigator.clipboard.writeText(roomCode);
              alert("Room code copied: " + roomCode);
            }}
            sx={{
              color: "#ffffff",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
              transition: "background-color 0.2s",
              position: "absolute",
              top: 12,
              right: 16,
            }}
            aria-label="copy room code"
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </div>

        {/* Phaser Game */}
        <div style={{ flexGrow: 1 }}>
          <PhaserGame
            ref={phaserRef}
            user={user}
            roomCode={roomCode}
            sabotageWord={activeSabotageWord}
            commandSwitchWord={commandSwitchWord}
            commandSwitchCommands={commandSwitchCommands}
          />
        </div>

        {/* Leave / Close Room */}
        <div
          style={{ textAlign: "center", padding: "15px", background: "#222" }}
        >
          <button
            onClick={leaveRoom}
            style={{
              padding: "10px 25px",
              background: "#d9534f",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Close / Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
