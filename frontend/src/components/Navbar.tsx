import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";

interface NavbarProps {
  username: string;
  currentPage: "lobby" | "account";
  onNavigate: (page: "lobby" | "account") => void;
  onOpenGuide: () => void;
  onLogout: () => void;
}

function Navbar({
  username,
  currentPage,
  onNavigate,
  onOpenGuide,
  onLogout,
}: NavbarProps) {
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  const closeAccountMenu = () => setAccountMenuAnchor(null);

  return (
    <AppBar position="static" sx={{ bgcolor: "#111827" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
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
            onClick={onOpenGuide}
            data-guide="guide-button"
            sx={{
              color: "#fff",
              "&:hover": { bgcolor: "#374151" },
            }}
          >
            Guide
          </Button>

          <Button
            onClick={(event) => setAccountMenuAnchor(event.currentTarget)}
            sx={{
              color: "#fff",
              fontWeight: 800,
              textTransform: "none",
              "&:hover": { bgcolor: "#374151" },
            }}
          >
            {username}
          </Button>
          <Menu
            anchorEl={accountMenuAnchor}
            open={Boolean(accountMenuAnchor)}
            onClose={closeAccountMenu}
          >
            <MenuItem
              onClick={() => {
                closeAccountMenu();
                onNavigate("account");
              }}
            >
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeAccountMenu();
                onLogout();
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
