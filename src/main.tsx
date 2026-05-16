import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeShell } from "./lib/native";
import { identifyPurchaser } from "./lib/iap";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";

void initNativeShell();

// Configure RevenueCat & re-identify whenever the Firebase user changes.
// No-op on web; only runs on native iOS.
onAuthStateChanged(auth, (user) => {
  void identifyPurchaser(user?.uid ?? null);
});

createRoot(document.getElementById("root")!).render(<App />);
