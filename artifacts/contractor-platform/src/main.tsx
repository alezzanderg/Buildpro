import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply saved theme before first render to prevent flash
try {
  const saved = localStorage.getItem("probuilder-theme");
  if (saved === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.add("dark");
  }
} catch {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
