import API_URL from "./config.ts";

export type AuthMode = "login" | "signup";

interface AuthResponse {
  success?: boolean;
  error?: string;
}

export const getAuthHeadingAction = (authMode: AuthMode) => (
  authMode === "login" ? "log in" : "sign up"
);

export const submitAuthRequest = async (
  authMode: AuthMode,
  username: string,
  password: string,
  fetcher: typeof fetch = fetch
) => {
  const response = await fetcher(`${API_URL}/api/event/lobby/${authMode}`, {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json() as AuthResponse;

  return {
    ok: response.ok,
    username: username.trim(),
    error: data.error || "Something went wrong",
  };
};
