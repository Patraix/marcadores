// src/main.jsx o src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // Tu CSS global, si lo tienes
import "purecss/build/pure-min.css"; // ¡Importa la base de Pure.css!
import "purecss/build/grids-responsive-min.css"; // ¡Y las rejillas responsivas para que funcionen las clases pure-u-sm-*, etc.!

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
