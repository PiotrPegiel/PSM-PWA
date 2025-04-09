import React, { useState } from 'react';
import useStorage from '../../hooks/useStorage';
import { useAuth } from '../../contexts/authContext';

const Upload = () => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { uploadFile, progress, url } = useStorage(); 
    const { currentUser } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.type === 'image/png' || selected.type === 'image/jpeg') {
                setFile(selected);
                setError(null);
            } else {
                setFile(null);
                setError('Please select a PNG or JPEG image.');
            }
        }
    };

    const handleUpload = () => {
        if (file) {
            uploadFile(file);
        }
    };

    return (
        <div>
            <main className="w-full h-screen flex self-center place-content-center place-items-center">
                <div className="w-96 text-gray-600 space-y-5 p-4 shadow-xl border rounded-xl">
                    <div className="text-center mb-6">
                        <h3 className="text-gray-800 text-xl font-semibold sm:text-2xl">Upload File</h3>
                    </div>
                    <div>
                        {currentUser ? `Hello ${currentUser.displayName ? currentUser.displayName : currentUser.email}, you are now logged in.` : 'Loading...'}
                        {error && <p className="text-red-500">{error}</p>}
                        <input
                            type="file"
                            onChange={handleChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {file && (
                            <button onClick={handleUpload} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                                Upload
                            </button>
                        )}
                        {progress > 0 && <p>Upload Progress: {progress}%</p>}
                        {url && (
                            <div className="mt-4">
                                <p className="text-green-500">Upload Complete!</p>
                                <img src={url} alt="Uploaded file" className="mt-2 w-full h-auto rounded" />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Upload;