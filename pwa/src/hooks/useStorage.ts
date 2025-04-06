import { useState } from 'react';
import { storage } from '../firebase-config'; // Adjust the import based on your firebase-config file
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const useStorage = () => {
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [url, setUrl] = useState(null);

    const uploadFile = (file) => {
        const storageRef = ref(storage, file.name);
        
        uploadBytes(storageRef, file).on('state_changed', 
            (snap) => {
                const percentage = (snap.bytesTransferred / snap.totalBytes) * 100;
                setProgress(percentage);
            }, 
            (err) => {
                setError(err);
            }, 
            async () => {
                const downloadURL = await getDownloadURL(storageRef);
                setUrl(downloadURL);
            }
        );
    };

    return { progress, url, error, uploadFile };
};

export default useStorage;