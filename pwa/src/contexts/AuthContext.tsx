import React, { useContext, useState, useEffect } from "react";
import { auth } from "../firebase-config"; 
import { GoogleAuthProvider } from "firebase/auth";
import { onAuthStateChanged, User } from "firebase/auth";

const AuthContext = React.createContext<{
  userLoggedIn: boolean;
  isEmailUser: boolean;
  isGoogleUser: boolean;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}>({
  userLoggedIn: false,
  isEmailUser: false,
  isGoogleUser: false,
  currentUser: null,
  setCurrentUser: () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  async function initializeUser(user: User | null) {
    if (user) {

      setCurrentUser({ ...user });

      // check if provider is email and password login
      const isEmail = user.providerData.some(
        (provider) => provider.providerId === "password"
      );
      setIsEmailUser(isEmail);

      const isGoogle = user.providerData.some(
        (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
      );
      setIsGoogleUser(isGoogle);

      setUserLoggedIn(true);
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
    }

    setLoading(false);
  }

  const value = {
    userLoggedIn,
    isEmailUser,
    isGoogleUser,
    currentUser,
    setCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}