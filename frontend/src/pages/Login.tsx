import { useState } from "react";
import { type AuthMode, getAuthHeadingAction, submitAuthRequest } from "../authApi";
interface LoginProps {
  loginSuccess: (username: string) => void | Promise<void>;
}

function Login({ loginSuccess }: LoginProps) {
  const style = {
    backgroundImage: `url("/assets/bg.png")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "100vh",
    width: "100%",
  };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const isLogin = authMode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await submitAuthRequest(authMode, username, password);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    try {
      await loginSuccess(result.username);
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
    <div className="page" style={style}>
      <img
        src="assets/logo.png"
        style={{ width: "450px", height: "300px" }}
      ></img>
      <h3> Welcome to Noise War! Please {getAuthHeadingAction(authMode)}. </h3>
      <div
        className="login-form"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          justifyContent: "center",
        }}
      >
        <form onSubmit={handleSubmit}>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <br />

          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />

          <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
        </form>
        <button
          type="button"
          onClick={() => switchMode(isLogin ? "signup" : "login")}
          style={{
            alignSelf: "center",
            border: "none",
            background: "transparent",
            padding: "2px 4px",
            color: "inherit",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {isLogin ? "Create an account" : "Already have an account? Login"}
        </button>
        {errorMessage && (
          <p style={{ color: "red", justifyContent: "center" }}>
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
