import { useState } from "react";
import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import {
  darkSecondaryButtonSx,
  fieldSx,
  panelSx,
  primaryButtonSx,
  uiColors,
} from "../styles/ui";

function Lobby({
  onCreateRoom,
  onJoinRoom,
}: {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
}) {
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const handleJoinRoom = () => {
    const code = joinCode.trim();

    if (code) {
      onJoinRoom(code);
    }
  };

  const actionButtonSx = {
    ...primaryButtonSx,
    fontFamily: "Arial Black",
    py: 1.4,
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Card
        sx={{
          ...panelSx,
          width: "min(420px, calc(100vw - 32px))",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={onCreateRoom}
            data-guide="create-room"
            sx={actionButtonSx}
          >
            Create Room
          </Button>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => setIsJoiningRoom(true)}
            data-guide="enter-room"
            sx={{
              ...actionButtonSx,
              ...darkSecondaryButtonSx,
              color: "#fff",
              mt: 1.5,
            }}
          >
            Enter Room
          </Button>

          {isJoiningRoom && (
            <Box sx={{ mt: 2.5 }}>
              <Typography sx={{ color: uiColors.muted, mb: 1 }}>
                Room code
              </Typography>
              <TextField
                size="small"
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
                  ...fieldSx,
                  bgcolor: uiColors.text,
                  borderRadius: 1,
                }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleJoinRoom}
                sx={{
                  ...actionButtonSx,
                  mt: 1.5,
                }}
              >
                Join Room
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Lobby;
