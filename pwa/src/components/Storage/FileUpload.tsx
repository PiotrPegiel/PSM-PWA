import React, { useState } from 'react';
import { useStorage } from '../../hooks/useStorage';

const FileUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { uploadFile, progress } = useStorage();

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
        <div className="file-upload">
            <input type="file" onChange={handleChange} />
            <div>
                {error && <div className="error">{error}</div>}
                {file && <div>{file.name}</div>}
                {progress > 0 && <div>Upload Progress: {progress}%</div>}
                <button onClick={handleUpload} disabled={!file}>
                    Upload
                </button>
            </div>
        </div>
    );
};

export default FileUpload;