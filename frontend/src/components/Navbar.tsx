import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";

interface NavbarProps {
  username: string;
  currentPage: "lobby" | "account";
  onNavigate: (page: "lobby" | "account") => void;
}

function Navbar({ username, currentPage, onNavigate }: NavbarProps) {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "#111827",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <Toolbar sx={{ gap: 2, justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          sx={{
            color: "#fff",
            fontFamily: "Arial Black",
            letterSpacing: 0,
            textTransform: "uppercase",
          }}
        >
          NoiseWar
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            variant={currentPage === "lobby" ? "contained" : "text"}
            onClick={() => onNavigate("lobby")}
            sx={{
              color: "#fff",
              bgcolor: currentPage === "lobby" ? "#2563EB" : "transparent",
              "&:hover": { bgcolor: "#1D4ED8" },
            }}
          >
            Lobby
          </Button>
          <Button
            variant={currentPage === "account" ? "contained" : "text"}
            onClick={() => onNavigate("account")}
            sx={{
              color: "#fff",
              bgcolor: currentPage === "account" ? "#059669" : "transparent",
              "&:hover": { bgcolor: "#047857" },
            }}
          >
            Account
          </Button>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.78)", ml: 1 }}
          >
            {username}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
