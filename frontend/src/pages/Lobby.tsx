import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

function Lobby({
  onCreateRoom,
  onJoinRoom,
  onEnterCreatedRoom,
  canEnterCreatedRoom,
  roomCode,
}: {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onEnterCreatedRoom: () => void;
  canEnterCreatedRoom: boolean;
  roomCode: string;
}) {
  const [joinCode, setJoinCode] = useState("");
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  const handleJoinRoom = () => {
    const code = joinCode.trim().toUpperCase();

    if (code) {
      onJoinRoom(code);
      setJoinCode("");
    }
  };

  return (
    <Box
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Card
        sx={{
          maxWidth: 500,
          minWidth: 400,
          width: "100%",
          mx: 2,
          bgcolor: "#4F46E5",
          color: "#fff",
          borderRadius: 2,
        }}
      >
        <CardContent>
          <Button
            variant="contained"
            fullWidth
            onClick={onCreateRoom}
            sx={{
              bgcolor: "#6366F1",
              "&:hover": { bgcolor: "#3b34b3" },
              fontWeight: "bold",
              py: 1.5,
              fontFamily: "Arial Black",
            }}
          >
            Create Room
          </Button>

          <Button
            variant="contained"
            fullWidth
            onClick={() => setIsJoiningRoom(true)}
            sx={{
              mt: 2,
              bgcolor: "#1619a6",
              "&:hover": { bgcolor: "#3b34b3" },
              fontWeight: "bold",
              py: 1.5,
              fontFamily: "Arial Black",
            }}
          >
            Enter Room
          </Button>

          {isJoiningRoom && (
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <TextField
                size="small"
                label="Room code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleJoinRoom();
                  }
                }}
                fullWidth
                sx={{
                  bgcolor: "#fff",
                  borderRadius: 1,
                }}
              />
              <Button
                variant="contained"
                onClick={handleJoinRoom}
                sx={{
                  minWidth: 118,
                  bgcolor: "#059669",
                  "&:hover": { bgcolor: "#047857" },
                  fontWeight: "bold",
                  fontFamily: "Arial Black",
                }}
              >
                Confirm
              </Button>
            </Box>
          )}

          {roomCode && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: "#6366F1",
                borderRadius: 1,
                border: "1px dashed #000000",
                textAlign: "center",
                position: "relative",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  display: "block",
                  mb: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Your Room Code
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: "black",
                  color: "#000000",
                  letterSpacing: 4,
                  mb: 2,
                }}
              >
                {roomCode}
              </Typography>

              <Button
                variant="outlined"
                fullWidth
                disabled={!canEnterCreatedRoom}
                sx={{
                  bgcolor: "#1619a6",
                  color: "#fff",
                  "&:hover": { bgcolor: "#3b34b3" },
                  "&:disabled": {
                    bgcolor: "#312E81",
                    color: "rgba(255,255,255,0.6)",
                  },
                  fontWeight: "bold",
                  fontFamily: "Arial Black",
                  textTransform: "uppercase",
                }}
                onClick={onEnterCreatedRoom}
              >
                {canEnterCreatedRoom
                  ? "Enter Match Room"
                  : "Waiting for Opponent"}
              </Button>

              <IconButton
                onClick={() => navigator.clipboard.writeText(roomCode)}
                sx={{
                  color: "#000000",
                  "&:hover": { bgcolor: "rgba(0, 0, 0, 0.1)" },
                  transition: "background-color 0.2s",
                  position: "absolute",
                  top: 8,
                  right: 8,
                }}
                aria-label="copy room code"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Lobby;
