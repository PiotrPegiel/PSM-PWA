import React, { JSX } from "react";
import Login from "./components/auth/login";
import Register from "./components/auth/register";
import Categories from "./components/categories";
import ProductsByCategory from './components/productsByCategory';
import ProductDetails from "./components/productDetails";
import UserRoles from "./components/userRoles";
import ReservationNewEdit from './components/reservationNewEdit';
import NewReservation from "./components/newReservation";
import History from "./components/history";

import Home from "./components/home";
import Profile from "./components/profile";

import { useAuth } from "./contexts/authContext";
import { useRoutes, Navigate } from "react-router-dom";
import Admin from "./components/admin";
import MapView from "./components/viewMap";

function App() {
  const { userLoggedIn, currentUser } = useAuth();

  const ProtectedRoute = ({ element, roles }: { element: JSX.Element; roles?: string[] }) => {
    if (!userLoggedIn) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(currentUser?.role || "")) return <Navigate to="/home" replace />; // Ensure role is a string
    return element;
  };

  const routesArray = [
    { path: "*", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/home", element: <ProtectedRoute element={<Home />} /> },
    { path: "/admin", element: <ProtectedRoute element={<Admin />} /> },
    { path: "/profile", element: <ProtectedRoute element={<Profile />} /> },
    { path: "/categories", element: <ProtectedRoute element={<Categories />} roles={["Admin", "SuperUser"]} /> },
    { path: '/categories/:categoryId', element: <ProtectedRoute element={<ProductsByCategory />} roles={["Admin", "SuperUser"]} /> },
    { path: '/categories/:categoryId/products/:productId', element: <ProtectedRoute element={<ProductDetails />} roles={["Admin", "SuperUser"]} /> },
    { path: '/categories/:categoryId/products/new', element: <ProtectedRoute element={<ProductDetails />} roles={["Admin", "SuperUser"]} /> },
    { path: "/user-roles", element: <ProtectedRoute element={<UserRoles />} roles={["Admin", "SuperUser"]} /> },
    { path: '/reservations/new', element: <ProtectedRoute element={<ReservationNewEdit />} /> },
    { path: '/reservations/:reservationId', element: <ProtectedRoute element={<ReservationNewEdit />} /> },
    { path: '/reservations/:reservationId/map', element: <ProtectedRoute element={<MapView />} /> },
    { path: '/new-reservation', element: <ProtectedRoute element={<NewReservation />} /> },
    { path: "/history", element: <ProtectedRoute element={<History />} /> },
  ];

  let routesElement = useRoutes(routesArray);

  return (
    <>
      {userLoggedIn}
      <div className="w-full flex flex-col pb-6">{routesElement}</div>
    </>
  );
}

export default App;