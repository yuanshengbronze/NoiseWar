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
import { primaryButtonSx, radius, uiColors } from "../styles/ui";

interface NavbarProps {
  username: string;
  currentPage: "lobby" | "account";
  onNavigate: (page: "lobby" | "account") => void;
  onOpenGuide: () => void;
  onLogout: () => void;
}

const navButtonSx = {
  color: uiColors.text,
  borderRadius: radius.sm,
  px: 1.75,
  fontWeight: 800,
  textTransform: "none",
  "&:hover": {
    color: uiColors.primary,
    bgcolor: "rgba(0,116,255,0.08)",
  },
};

const activeNavButtonSx = {
  ...navButtonSx,
  ...primaryButtonSx,
  color: "#fff",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.28)",
};

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
  const isAccountMenuOpen = Boolean(accountMenuAnchor);

  const closeAccountMenu = () => setAccountMenuAnchor(null);

  const handleLogoutClick = () => {
    closeAccountMenu();
    onLogout();
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: uiColors.navy,
        borderBottom: `1px solid ${uiColors.borderDark}`,
        boxShadow: "0 8px 26px rgba(0,68,148,0.08)",
      }}
    >
      <Toolbar sx={{ gap: 2, justifyContent: "space-between", minHeight: 64 }}>
        <Typography
          variant="h6"
          sx={{
            color: uiColors.text,
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
            sx={currentPage === "lobby" ? activeNavButtonSx : navButtonSx}
          >
            Lobby
          </Button>
          <Button
            variant={currentPage === "account" ? "contained" : "text"}
            onClick={() => onNavigate("account")}
            sx={currentPage === "account" ? activeNavButtonSx : navButtonSx}
          >
            Account
          </Button>
          <Button
            variant="text"
            onClick={onOpenGuide}
            data-guide="guide-button"
            sx={navButtonSx}
          >
            Guide
          </Button>
          <Button
            variant="text"
            onClick={(event) => setAccountMenuAnchor(event.currentTarget)}
            sx={{
              color: uiColors.primary,
              ml: 1,
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textTransform: "none",
              borderRadius: radius.sm,
              "&:hover": {
                color: uiColors.primaryHover,
                bgcolor: "rgba(0,116,255,0.08)",
              },
            }}
          >
            {username}
          </Button>
          <Menu
            anchorEl={accountMenuAnchor}
            open={isAccountMenuOpen}
            onClose={closeAccountMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  borderRadius: radius.sm,
                  minWidth: 140,
                  border: `1px solid ${uiColors.borderDark}`,
                  boxShadow: "0 16px 36px rgba(0,68,148,0.14)",
                },
              },
            }}
          >
            <MenuItem onClick={handleLogoutClick} sx={{ color: "#B91C1C" }}>
              Log Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
