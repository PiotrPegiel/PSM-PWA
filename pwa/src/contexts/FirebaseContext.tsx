import React, { createContext, useContext, useEffect, useState } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import { firebaseConfig } from '../firebase-config';

const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
    const [firebaseApp, setFirebaseApp] = useState(null);
    const [auth, setAuth] = useState(null);
    const [firestore, setFirestore] = useState(null);
    const [storage, setStorage] = useState(null);

    useEffect(() => {
        const app = firebase.initializeApp(firebaseConfig);
        setFirebaseApp(app);
        setAuth(app.auth());
        setFirestore(app.firestore());
        setStorage(app.storage());
    }, []);

    return (
        <FirebaseContext.Provider value={{ auth, firestore, storage }}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebase = () => {
    return useContext(FirebaseContext);
};