import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/authContext";
import { FirebaseProvider } from "./contexts/FirebaseContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <FirebaseProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </FirebaseProvider>
    </AuthProvider>
  </React.StrictMode>
);