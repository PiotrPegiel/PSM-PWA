import React from "react";
import Login from "./components/auth/login";
import Register from "./components/auth/register";

import Header from "./components/header";
import Home from "./components/home";
import Upload from "./components/storage";

import { AuthProvider } from "./contexts/authContext";
import { useRoutes } from "react-router-dom";
import { FirebaseProvider } from "./contexts/FirebaseContext";

function App() {
  const routesArray = [
    { path: "*", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/home", element: <Home /> },
    { path: "/upload", element: <Upload /> },
  ];
  let routesElement = useRoutes(routesArray);

  return (
    <FirebaseProvider>
      <AuthProvider>
        <Header />
        <div className="w-full h-screen flex flex-col">{routesElement}</div>
      </AuthProvider>
    </FirebaseProvider>
  );
}

export default App;
