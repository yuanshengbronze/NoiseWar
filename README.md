# NoiseWar

Noise War is a 2-player web game, where players can compete by completing a vertical path in a given grid map as quickly as possible using voice inputs such as Up, Down, Left, and Right. Players can also sabotage each other by either shouting the wrong commands, or sending in-game tasks to their rival (such as spelling a difficult word).

# Motivation

Noise is an essential part of party games. Whether it is friends shouting over a game, cheering during a challenge, or laughing uncontrollably, the energy created by loud voices brings excitement and chaos in every party game. Therefore, we decided to build a game that uses noise as a core mechanic: Noise War.

We are motivated to explore how voice can be turned into a core, compelling game mechanic by designing Noise War into a fast-paced, competitive 1v1 experience driven by speech-to-text. In the process, we hope to have fun while learning software development practices, especially game development.

# User Stories

1. As a user, I want to have fun by competing with a friend in a game
2. As a user, I want to be able to play across distances
3. As a user, I want the matchmaking process to be effortless and quick
4. As a user, I want to play a variety of maps so that I don’t get bored
5. As a user, I want to sabotage my friend to annoy him
6. As a user, I want the game to be fun and chaotic as I rush to say commands to the microphone
7. As a user, I want my progress to be saved and be able to look up my match history

# Tech Stack

NoiseWar is built with a React and Vite frontend, an Express backend, and Redis for data storage. We chose React because it makes it easier to build reusable interface components such as the login page, lobby, navbar, and account page. Vite was used because it provides a fast development server and a simple setup for modern frontend development.

Phaser is used for the main game because it is designed for browser-based 2D games and provides a scene system for separating parts of the game such as loading, menus, gameplay, and ending screens. Grid Engine is used together with Phaser because our game depends on tile-based movement, and it helps keep the player aligned to the maze grid.

The backend is built with Express because it provides a lightweight way to create API routes for login, sign-up, profile data, and saved sabotage words. Socket.IO is used because NoiseWar needs real-time communication for room creation, room joining, game start events, sabotage events, and disconnect handling.

Redis is used because it is fast and works well for temporary multiplayer data such as room codes, room states, socket IDs, and saved user data. Annyang is used for voice controls because it gives the browser a simple way to listen for spoken commands such as Up, Down, Left, Right, Stop, and Sabotage.
