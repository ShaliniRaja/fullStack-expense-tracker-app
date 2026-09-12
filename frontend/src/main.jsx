import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { VisibilityProvider } from "./context/VisibilityContext";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <VisibilityProvider>
        <App />
      </VisibilityProvider>
    </AuthProvider>
  </React.StrictMode>
);
