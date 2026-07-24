import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  darkPageBackgroundImage,
  fieldSx,
  darkSecondaryButtonSx,
  panelSx,
  primaryButtonSx,
  uiColors,
} from "../styles/ui";
import {
  type AuthMode,
  getAuthHeadingAction,
  submitAuthRequest,
} from "../authApi";

interface LoginProps {
  loginSuccess: (username: string) => void | Promise<void>;
}

function Login({ loginSuccess }: LoginProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isLogin = authMode === "login";
  const usernameError = username.length > 0 && username.trim().length === 0;
  const passwordError = password.length > 0 && password.trim().length === 0;
  const authFieldSx = {
    ...fieldSx,
    "& .MuiFormLabel-root": {
      color: uiColors.muted,
    },
    "& .MuiFormLabel-root.Mui-focused": {
      color: uiColors.primary,
    },
    "& .MuiInputBase-input": {
      color: uiColors.text,
      fontWeight: 700,
    },
    "& .MuiOutlinedInput-root": {
      bgcolor: "rgba(255,255,255,0.96)",
      borderRadius: 1,
    },
    "& .MuiFormHelperText-root": {
      color: uiColors.faint,
    },
    "& .MuiFormHelperText-root.Mui-error": {
      color: uiColors.primaryHover,
    },
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      const result = await submitAuthRequest(authMode, username, password);

      if (result.ok) {
        await loginSuccess(result.username);
        return;
      }

      setErrorMessage(result.error);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMessage("");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: darkPageBackgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: { xs: 2, md: 3 },
        boxSizing: "border-box",
      }}
    >
      <Box
        component="img"
        src="/assets/logo.png"
        alt="NoiseWar"
        sx={{
          width: { xs: "min(450px, 86vw)", md: 450 },
          height: { xs: "auto", md: 300 },
          objectFit: "contain",
        }}
      />
      <Paper
        elevation={0}
        sx={{
          ...panelSx,
          width: "min(420px, calc(100vw - 32px))",
          p: { xs: 3, md: 4 },
        }}
      >
        <Stack spacing={2.5}>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{ color: uiColors.text, fontWeight: 900, letterSpacing: 0 }}
            >
              {isLogin ? "Log in to NoiseWar" : "Create your account"}
            </Typography>
            <Typography sx={{ color: uiColors.muted, mt: 0.5 }}>
              Please {getAuthHeadingAction(authMode)} to continue.
            </Typography>
          </Box>

          {errorMessage && (
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {errorMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setErrorMessage("");
                }}
                error={usernameError}
                helperText={usernameError ? "Username cannot be blank." : " "}
                autoComplete="username"
                fullWidth
                sx={authFieldSx}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrorMessage("");
                }}
                error={passwordError}
                helperText={passwordError ? "Password cannot be blank." : " "}
                autoComplete={isLogin ? "current-password" : "new-password"}
                fullWidth
                sx={authFieldSx}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ ...primaryButtonSx, py: 1.35 }}
              >
                {isLogin ? "Log In" : "Sign Up"}
              </Button>
            </Stack>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => switchMode(isLogin ? "signup" : "login")}
            sx={darkSecondaryButtonSx}
          >
            {isLogin ? "Need an account? Sign Up" : "Have an account? Log In"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default Login;
