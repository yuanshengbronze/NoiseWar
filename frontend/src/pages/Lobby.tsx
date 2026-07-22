import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
} from "@mui/material";

function Lobby({
  onCreateRoom,
  onJoinRoom,
  roomCode,
}: {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
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

  const closeJoinRoom = () => {
    setIsJoiningRoom(false);
    setJoinCode("");
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
            data-guide="create-room"
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
            data-guide="enter-room"
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
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
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleJoinRoom}
                  sx={{
                    bgcolor: "#059669",
                    "&:hover": { bgcolor: "#047857" },
                    fontWeight: "bold",
                    fontFamily: "Arial Black",
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={closeJoinRoom}
                  sx={{
                    bgcolor: "#DC2626",
                    "&:hover": { bgcolor: "#B91C1C" },
                    fontWeight: "bold",
                    fontFamily: "Arial Black",
                  }}
                >
                  Close
                </Button>
              </Box>
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
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Lobby;
