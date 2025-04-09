import React from "react";
import Login from "./components/auth/login";
import Register from "./components/auth/register";

import Header from "./components/header";
import Home from "./components/home";
import Upload from "./components/storage";

import { useAuth } from "./contexts/authContext";
import { useRoutes } from "react-router-dom";
import Reservations from "./components/reservations";
import path from "path";

function App() {
  const routesArray = [
    {
      path: "*",
      element: <Login />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/home",
      element: <Home />,
    },
    {
      path: "/upload",
      element: <Upload />,
    },
    {
      path: "/reservations",
      element: <Reservations />,
    }
  ];
  let routesElement = useRoutes(routesArray);

  const { userLoggedIn } = useAuth();

  return (
    <>
      {userLoggedIn && <Header />}
      <div className="w-full h-screen flex flex-col">{routesElement}</div>
    </>
  );
}

export default App;