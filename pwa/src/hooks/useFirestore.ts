import { useEffect, useState } from 'react';
import { db } from '../firebase-config'; // Adjust the import based on your firebase-config file
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const useFirestore = (collectionName: string) => {
    const [documents, setDocuments] = useState<{ id: string; [key: string]: any }[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, collectionName));
                const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDocuments(docs);
            } catch (err) {
                setError((err as Error).message);
            }
        };

        fetchDocuments();
    }, [collectionName]);

    const addDocument = async (data: { [key: string]: any }) => {
        try {
            await addDoc(collection(db, collectionName), data);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const deleteDocument = async (id: string) => {
        try {
            await deleteDoc(doc(db, collectionName, id));
        } catch (err) {
            setError((err as Error).message);
        }
    };

    return { documents, addDocument, deleteDocument, error };
};

export default useFirestore;