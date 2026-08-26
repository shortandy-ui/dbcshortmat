import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { storage } from "./storage.js";
import "./index.css";

// App.jsx (unchanged from the Claude artifact version) calls window.storage.*
// exactly like it did inside Claude — this is the only thing that makes it
// work as a normal deployed website too.
window.storage = storage;

createRoot(document.getElementById("root")).render(<App />);
