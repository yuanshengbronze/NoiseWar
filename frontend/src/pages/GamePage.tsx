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
import API_URL from "../config";
import { socket } from "../socket";
import { IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

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
  stats: MatchStats;
}
interface SaveSabotageWordsResponse {
  success: boolean;
  sabotageWords: string[];
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
  const [sabotageWords, setSabotageWords] = useState<string[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStats>({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
  });

  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const activeSabotageWord = sabotageWords[0] || "";
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

  const handleLoginCallback = async (username: string) => {
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

    EventBus.once("phaser-cleanup-complete", () => {
      socket.emit("leave-room", payload);
      setRoomCode("");
      setCurrentPhase("lobby");
    });

    EventBus.emit("leaving-room", payload);
  };

  const handleSabotageWordsChange = async (words: string[]) => {
    if (!user) {
      return;
    }

    const previousWords = sabotageWords;
    setSabotageWords(words);

    try {
      const response = await fetch(
        `${API_URL}/api/user/${encodeURIComponent(user)}/sabotage-words`,
        {
          method: "PUT",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify({ sabotageWords: words }),
        },
      );

      const data = (await response.json()) as SaveSabotageWordsResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to save sabotage words.");
      }

      setSabotageWords(data.sabotageWords);
    } catch (error) {
      console.error(error);
      setSabotageWords(previousWords);
      alert("Could not save sabotage words. Please try again.");
    }
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
        setMatchStats(data.stats);
      } catch (error) {
        console.error(error);
        setSabotageWords([]);
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (annyang.isSpeechRecognitionSupported()) {
      const control = (direction: integer) => {
        if (phaserRef.current) {
          const gameScene = phaserRef.current.scene as Game;
          if (gameScene && gameScene.scene.key === "Game") {
            gameScene.move(direction);
          }
        }
      };

      const sabotage = () => {
        if (phaserRef.current) {
          const gameScene = phaserRef.current.scene as Game;
          if (gameScene && gameScene.scene.key === "Game") {
            gameScene.sabotage();
          }
        }
      };

      const stopSabotage = () => {
        if (phaserRef.current) {
          const UIScene = phaserRef.current.scene?.scene.get("UI") as UI;
          if (UIScene) {
            UIScene.stopSabotage();
          }
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

        above: {
          regexp: /^above\s*[.!?]?$/i,
          callback: () => {
            control(1);
          },
        },

        down: {
          regexp: /^down\s*[.!?]?$/i,
          callback: () => {
            control(2);
          },
        },

        left: {
          regexp: /^left\s*[.!?]?$/i,
          callback: () => {
            control(3);
          },
        },

        right: {
          regexp: /^right\s*[.!?]?$/i,
          callback: () => {
            control(4);
          },
        },

        sabotage: {
          regexp: /^sabotage\s*[.!?]?$/i,
          callback: sabotage,
        },

        "*term": (term = "") => {
          const normalizedTerm = term
            .toLowerCase()
            .trim()
            .replace(/[.,!?;:]+$/g, "");

          const UIScene = phaserRef.current?.scene?.scene.get("UI") as UI;

          if (UIScene?.matchesSabotageWord(normalizedTerm)) {
            UIScene.stopSabotage();
          }
        },
      };

      if (activeSabotageWord) {
        commands[activeSabotageWord] = stopSabotage;
      }

      annyang.addCommands(commands);
      annyang.addCallback("resultMatch", (userSaid) => {
        console.log(userSaid);
        EventBus.emit("command", {
          command: userSaid,
        });
      });

      annyang.start();
      console.log("voice recognition started");

      return () => {
        annyang.removeCommands();
        annyang.abort();
      };
    } else {
      console.log("voice recognition not supported");
    }
  }, [activeSabotageWord]);

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
        />
      )}

      {currentPhase === "account" && user && (
        <AccountPage
          username={user}
          sabotageWords={sabotageWords}
          matchStats={matchStats}
          onSabotageWordsChange={handleSabotageWordsChange}
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
