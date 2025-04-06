import { useState } from 'react';
import { storage } from '../firebase-config'; // Adjust the import based on your firebase-config file
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const useStorage = () => {
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [url, setUrl] = useState<string | null>(null);

    const uploadFile = (file:any) => {
        const storageRef = ref(storage, file.name);
        
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', 
            (snap:any) => {
                const percentage = (snap.bytesTransferred / snap.totalBytes) * 100;
                setProgress(percentage);
            }, 
            (err:any) => {
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