import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseConfig } from '../firebase-config';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

interface FirebaseContextType {
    currentUser: User | null;
    updateUserProfile: (data: { displayName: string }) => void;
    auth: ReturnType<typeof getAuth> | null;
    firestore: ReturnType<typeof getFirestore> | null;
    storage: ReturnType<typeof getStorage> | null;
}

export const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [auth, setAuth] = useState<ReturnType<typeof getAuth> | null>(null);
    const [firestore, setFirestore] = useState<ReturnType<typeof getFirestore> | null>(null);
    const [storage, setStorage] = useState<ReturnType<typeof getStorage> | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const updateUserProfile = (data: { displayName: string }) => {
        if (auth?.currentUser) {
            updateProfile(auth.currentUser, data).then(() => {
                setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
            });
        }
    };

    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const firestoreInstance = getFirestore(app);
        const storageInstance = getStorage(app);

        setAuth(authInstance);
        setFirestore(firestoreInstance);
        setStorage(storageInstance);

        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, []);

    return (
        <FirebaseContext.Provider value={{ auth, firestore, storage, currentUser, updateUserProfile }}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebase = () => {
    return useContext(FirebaseContext);
};