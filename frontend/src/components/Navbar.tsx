import { useState } from "react";
import { AppBar, Box, Button, Menu, MenuItem, Toolbar, Typography } from "@mui/material";

interface NavbarProps {
  username: string;
  currentPage: "lobby" | "account";
  onNavigate: (page: "lobby" | "account") => void;
  onLogout: () => void;
}

function Navbar({ username, currentPage, onNavigate, onLogout }: NavbarProps) {
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const isAccountMenuOpen = Boolean(accountMenuAnchor);

  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };

  const handleLogoutClick = () => {
    handleAccountMenuClose();
    onLogout();
  };

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
          <Button
            variant="text"
            onClick={(event) => setAccountMenuAnchor(event.currentTarget)}
            sx={{
              color: "rgba(255,255,255,0.78)",
              ml: 1,
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textTransform: "none",
              "&:hover": {
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            {username}
          </Button>
          <Menu
            anchorEl={accountMenuAnchor}
            open={isAccountMenuOpen}
            onClose={handleAccountMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={handleLogoutClick}>Log Out</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
