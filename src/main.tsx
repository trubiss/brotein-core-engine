import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeShell } from "./lib/native";

void initNativeShell();

createRoot(document.getElementById("root")!).render(<App />);
