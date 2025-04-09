import React, { JSX } from "react";
import Login from "./components/auth/login";
import Register from "./components/auth/register";

import Header from "./components/header";
import Home from "./components/home";
import Upload from "./components/storage";

import { useAuth } from "./contexts/authContext";
import { useRoutes, Navigate } from "react-router-dom";

function App() {
  const { userLoggedIn } = useAuth();

  const ProtectedRoute = ({ element }: { element: JSX.Element }) => {
    return userLoggedIn ? element : <Navigate to="/login" replace />;
  };

  const routesArray = [
    { path: "*", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/home", element: <ProtectedRoute element={<Home />} /> },
    { path: "/upload", element: <ProtectedRoute element={<Upload />} /> },
  ];

  let routesElement = useRoutes(routesArray);

  return (
    <>
      {userLoggedIn && <Header />}
      <div className="w-full h-screen flex flex-col">{routesElement}</div>
    </>
  );
}

export default App;