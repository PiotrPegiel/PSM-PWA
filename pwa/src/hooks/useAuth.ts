import { useEffect, useState } from 'react';
import { auth } from '../firebase-config';

const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        return await auth.signInWithEmailAndPassword(email, password);
    };

    const signOut = async () => {
        return await auth.signOut();
    };

    return { user, loading, signIn, signOut };
};

export default useAuth;