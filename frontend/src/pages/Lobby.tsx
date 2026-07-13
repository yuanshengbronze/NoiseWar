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
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Lobby;
