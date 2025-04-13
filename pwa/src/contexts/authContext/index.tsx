import React, { useContext, useState, useEffect } from "react";
import { auth } from "../../firebase/firebase";
// import { GoogleAuthProvider } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { firestore } from "../../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = React.createContext<AuthContextType>({
  userLoggedIn: false,
  currentUser: {
    displayName: undefined,
    email: ""
  }
});


export type AuthContextType = {
  // other properties
  currentUser: {
      displayName?: string;
      email: string;
      role?: string; // Add role to the type
  } | null;
  userLoggedIn: boolean; // Add userLoggedIn to the type
}

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext) as AuthContextType;
};


export function AuthProvider({ children }: React.PropsWithChildren<{}>) {
  const [currentUser, setCurrentUser] = useState<AuthContextType["currentUser"]>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  async function initializeUser(user: import("firebase/auth").User | null) {
    if (user) {
      const userRolesRef = doc(firestore, "userRoles", user.uid);
      const userRolesDoc = await getDoc(userRolesRef);

      let role = "User";
      if (userRolesDoc.exists()) {
        role = userRolesDoc.data()?.role || "User"; // Retrieve role from Firestore
      } else {
        await setDoc(userRolesRef, { userId: user.uid, role , email: user.email });
      }

      setCurrentUser({
        displayName: user.displayName || undefined,
        email: user.email || "",
        role, // Set role
      });

      // Check if provider is email and password login
      const isEmail = user.providerData.some(
        (provider) => provider.providerId === "password"
      );
      setIsEmailUser(isEmail);

      // check if the auth provider is google or not
    //   const isGoogle = user.providerData.some(
    //     (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
    //   );
    //   setIsGoogleUser(isGoogle);

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