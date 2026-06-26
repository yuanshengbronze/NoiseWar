import { useState, useRef, useEffect } from "react";
import { type IRefPhaserGame, PhaserGame } from "../PhaserGame";
import { MainMenu } from "../game/scenes/MainMenu";
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

interface CreateRoomResponse {
  success: boolean;
  roomCode?: string;
  error?: string;
}

interface JoinRoomResponse {
  success: boolean;
  roomCode?: string;
  error?: string;
}

interface UserProfileResponse {
  username: string;
  sabotageWords: string[];
}

interface SaveSabotageWordsResponse {
  success: boolean;
  sabotageWords: string[];
  error?: string;
}

function GamePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<
    "lobby" | "account" | "playing"
  >("lobby");
  const [isCreatedRoomReady, setIsCreatedRoomReady] = useState(false);
  const [sabotageWords, setSabotageWords] = useState<string[]>([]);
  const matchStats = {
    matchesPlayed: 8,
    wins: 5,
    losses: 3,
  };
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

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
    setUser(username);
  };

  const handleCreateRoom = () => {
    socket.emit(
      "create-room",
      { username: user },
      (response: CreateRoomResponse) => {
        if (response.success) {
          console.log("Successfully created room:", response.roomCode);
          setRoomCode(response.roomCode ?? "");
          setIsCreatedRoomReady(false);
        } else {
          alert("Could not create room: " + response.error);
        }
      },
    );
  };

  const startMatchRoom = (code: string) => {
    setRoomCode(code);
    setCurrentPhase("playing");
  };

  const startCreatedMatchRoom = (code: string) => {
    if (!isCreatedRoomReady) {
      alert("Waiting for one more player to join this room.");
      return;
    }

    startMatchRoom(code);
  };

  const handleEnterRoom = (code: string) => {
    socket.emit(
      "join-room",
      { username: user, roomCode: code },
      (response: JoinRoomResponse) => {
        if (response.success) {
          startMatchRoom(response.roomCode ?? code);
        } else {
          alert("Could not enter room: " + response.error);
        }
      },
    );
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

  const startMainMenu = () => {
    if (phaserRef.current?.scene) {
      phaserRef.current.scene.scene.start("MainMenu");
    } else if (phaserRef.current?.game) {
      phaserRef.current.game.scene.start("MainMenu");
    }
  };

  const changeScene = () => {
    if (phaserRef.current) {
      const scene = phaserRef.current.scene as MainMenu;

      if (scene) {
        scene.changeScene();
      }
    }
  };

  useEffect(() => {
    EventBus.on("GamePage", () => {
      startMainMenu();

      setCurrentPhase("lobby");
      setRoomCode("");
      setIsCreatedRoomReady(false);
    });

    return () => {
      EventBus.removeListener("GamePage");
    };
  }, []);

  useEffect(() => {
    if (currentPhase === "playing") {
      startMainMenu();
    }
  }, [currentPhase]);

  useEffect(() => {
    const markCreatedRoomReady = () => {
      setIsCreatedRoomReady(true);
    };

    socket.on("game-started", markCreatedRoomReady);

    return () => {
      socket.off("game-started", markCreatedRoomReady);
    };
  }, []);

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

      const commands: Record<string, (term?: string) => void> = {
        stop: () => {
          control(0);
        },
        up: () => {
          control(1);
        },
        down: () => {
          control(2);
        },
        left: () => {
          control(3);
        },
        right: () => {
          control(4);
        },
        sabotage: sabotage,
        "*term": (term = "") => {
          console.log(term);
          const UIScene = phaserRef.current?.scene?.scene.get("UI") as UI;

          if (UIScene?.matchesSabotageWord(term)) {
            UIScene.stopSabotage();
          }
        },
      };

      if (activeSabotageWord) {
        commands[activeSabotageWord] = stopSabotage;
      }

      annyang.addCommands(commands);
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
    return <Login loginSuccess={handleLogin} />;
  }

  return (
    <div
      id="app"
      data-room-code={roomCode ?? ""}
      style={{ width: "100%", height: "100vh", overflow: "hidden" }}
    >
      {currentPhase !== "playing" && user && (
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
          <h1
            style={{
              color: "#fff",
              margin: 0,
              fontFamily: "Arial Black",
              textTransform: "uppercase",
            }}
          >
            Welcome to NoiseWar!
          </h1>

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
            onJoinRoom={handleEnterRoom}
            onEnterCreatedRoom={startCreatedMatchRoom}
            canEnterCreatedRoom={isCreatedRoomReady}
            roomCode={roomCode}
          />
        </div>
      )}

      {/* Displays the Phaser Canvas */}
      <div
        style={{
          display: currentPhase === "playing" ? "block" : "none",
          width: "100%",
          height: "100%",
        }}
      >
        <div>
          <br />
          <br />
          <br />
          <PhaserGame
            ref={phaserRef}
            user={user}
            roomCode={roomCode}
            sabotageWord={activeSabotageWord}
          />
          <div>
            <button className="button" onClick={changeScene}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
