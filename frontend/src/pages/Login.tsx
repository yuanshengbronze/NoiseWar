import { useState } from "react";

interface LoginProps {
  loginSuccess: (username: string) => void;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch(
      `http://localhost:8080/api/event/lobby/login`,
      {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
    );

    const data = await response.json();
    if (response.ok) {
      loginSuccess(username);
    } else {
      setErrorMessage(data.error || "Something went wrong");
    }
  };

  return (
    <div className="page" style={style}>
      <img
        src="assets/logo.png"
        style={{ width: "450px", height: "300px" }}
      ></img>
      <h3> Welcome to Noise War! Please sign up/login. </h3>
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

          <button type="submit">Submit</button>
        </form>
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
