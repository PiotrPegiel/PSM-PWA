import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, firestore, storage } from '../firebase/firebase';
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';

interface FirebaseContextType {
    currentUser: User | null;
    updateUserProfile: (data: { displayName: string }) => void;
    firestore: typeof firestore; // Add firestore to the context type
}

export const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const updateUserProfile = (data: { displayName: string }) => {
        if (auth.currentUser) {
            updateProfile(auth.currentUser, data).then(() => {
                setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
            });
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, []);

    return (
        <FirebaseContext.Provider value={{ currentUser, updateUserProfile, firestore }}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};