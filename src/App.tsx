import { createBrowserRouter } from "react-router";
import GamePage from "./pages/GamePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <GamePage />,
  },
]);

export default router;
