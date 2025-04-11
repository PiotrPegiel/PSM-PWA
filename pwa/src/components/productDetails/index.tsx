import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, getDoc, setDoc, deleteDoc, GeoPoint } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';

const ProductDetails: React.FC = () => {
    const { firestore } = useFirebase() || {};
    const { productId, categoryId } = useParams<{ productId: string; categoryId: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<any>({});
    const [editMode, setEditMode] = useState<boolean>(!productId); // Start in edit mode if productId is not provided
    const [loading, setLoading] = useState<boolean>(true);
    const [pictures, setPictures] = useState<string[]>([]);
    const [newPictures, setNewPictures] = useState<File[]>([]);
    const [latitude, setLatitude] = useState<number | ''>('');
    const [longitude, setLongitude] = useState<number | ''>('');

    const storage = getStorage();

    useEffect(() => {
        const fetchProduct = async () => {
            if (firestore && productId) {
                const productRef = doc(firestore, 'products', productId);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                    const data = productDoc.data();
                    setProduct(data);

                    if (data.location instanceof GeoPoint) {
                        setLatitude(data.location.latitude);
                        setLongitude(data.location.longitude);
                    }

                    if (data.pictures) {
                        const pictureUrls = await Promise.all(
                            data.pictures.map(async (path: string) => {
                                if (path.startsWith('products/')) {
                                    // Assume it's a Firebase Storage path
                                    return await getDownloadURL(ref(storage, path));
                                }
                                // Otherwise, return the path as is (external URL)
                                return path;
                            })
                        );
                        setPictures(pictureUrls);
                    }
                }
            }
            setLoading(false);
        };

        if (productId) {
            fetchProduct();
        } else {
            setLoading(false);
        }
    }, [firestore, productId, storage]);

    const handleSave = async () => {
        if (firestore) {
            const productRef = productId
                ? doc(firestore, 'products', productId)
                : doc(firestore, 'products', `${Date.now()}`); // Generate a new ID for new products

            const uploadedPaths = await Promise.all(
                newPictures.map(async (file) => {
                    const storageRef = ref(storage, `products/${file.name}`);
                    await uploadBytesResumable(storageRef, file);
                    return `products/${file.name}`;
                })
            );

            const location = latitude !== '' && longitude !== '' ? new GeoPoint(latitude, longitude) : null;

            await setDoc(productRef, {
                ...product,
                location,
                pictures: [...(product.pictures || []), ...uploadedPaths],
                categoryId: doc(firestore, 'categories', categoryId || ''),
            });
            alert('Product saved successfully!');
            navigate(`/categories/${categoryId}`);
        }
    };

    const handleDelete = async () => {
        if (firestore && productId) {
            try {
                // Delete all associated pictures from Firebase Storage
                if (product.pictures && product.pictures.length > 0) {
                    await Promise.all(
                        product.pictures.map(async (path: string) => {
                            const storageRef = ref(storage, path);
                            await deleteObject(storageRef);
                        })
                    );
                }

                // Delete the product document from Firestore
                const productRef = doc(firestore, 'products', productId);
                await deleteDoc(productRef);

                alert('Product and associated pictures deleted successfully!');
                navigate(`/categories/${categoryId}`);
            } catch (error) {
                console.error('Error deleting product or pictures:', error);
                alert('Failed to delete product or associated pictures.');
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files; // Extract files to a variable
        if (files) {
            const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
            if (validFiles.length !== files.length) {
                alert('Only image files are allowed.');
            }
            setNewPictures((prev) => [...prev, ...validFiles]);
            e.target.value = ''; // Clear the upload field
        }
    };

    const handleCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            const capturePicture = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context?.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob && blob.type.startsWith('image/')) {
                        const file = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        setNewPictures((prev) => [...prev, file]);
                    } else {
                        alert('Captured file is not a valid image.');
                    }
                });

                stream.getTracks().forEach((track) => track.stop());
            };

            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '1000';

            const captureButton = document.createElement('button');
            captureButton.textContent = 'Capture';
            captureButton.style.position = 'absolute';
            captureButton.style.bottom = '20px';
            captureButton.style.padding = '10px 20px';
            captureButton.style.backgroundColor = '#28a745';
            captureButton.style.color = '#fff';
            captureButton.style.border = 'none';
            captureButton.style.borderRadius = '5px';
            captureButton.style.cursor = 'pointer';

            captureButton.onclick = () => {
                capturePicture();
                document.body.removeChild(modal);
            };

            modal.appendChild(video);
            modal.appendChild(captureButton);
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access the camera.');
        }
    };

    const getPreviewURL = (file: File) => URL.createObjectURL(file);

    const handleRemoveQueuedPicture = (index: number) => {
        setNewPictures((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDeletePicture = async (path: string) => {
        try {
            const storageRef = ref(storage, path);
            await deleteObject(storageRef);

            // Update product pictures in Firestore
            const updatedPictures = product.pictures.filter((p: string) => p !== path);
            setProduct((prevProduct: any) => ({
                ...prevProduct,
                pictures: updatedPictures,
            }));

            if (productId) {
                const productRef = doc(firestore, 'products', productId);
                await setDoc(productRef, { pictures: updatedPictures }, { merge: true }); // Only update pictures field
            }

            // Refresh the displayed pictures
            const pictureUrls = await Promise.all(
                updatedPictures.map(async (updatedPath: string) => {
                    if (updatedPath.startsWith('products/')) {
                        return await getDownloadURL(ref(storage, updatedPath));
                    }
                    return updatedPath;
                })
            );
            setPictures(pictureUrls);

            alert('Picture deleted successfully!');
        } catch (error) {
            console.error('Error deleting picture:', error);
            alert('Failed to delete picture.');
        }
    };

    const handleLatitudeChange = (value: string) => {
        const parsedValue = value === '' ? '' : parseFloat(value);
        if (parsedValue === '' || (parsedValue >= -90 && parsedValue <= 90)) {
            setLatitude(parsedValue);
        } else {
            alert('Latitude must be between -90 and 90.');
        }
    };

    const handleLongitudeChange = (value: string) => {
        const parsedValue = value === '' ? '' : parseFloat(value);
        if (parsedValue === '' || (parsedValue >= -180 && parsedValue <= 180)) {
            setLongitude(parsedValue);
        } else {
            alert('Longitude must be between -180 and 180.');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container text-center mt-5">
            <h1>{editMode ? 'Edit Product' : 'Product Details'}</h1>
            <div className="form-group">
                <label>Name:</label>
                {editMode ? (
                    <input
                        type="text"
                        className="form-control"
                        value={product.name || ''}
                        onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    />
                ) : (
                    <p>{product.name}</p>
                )}
            </div>
            <div className="form-group">
                <label>Latitude:</label>
                {editMode ? (
                    <input
                        type="number"
                        className="form-control"
                        value={latitude}
                        onChange={(e) => handleLatitudeChange(e.target.value)}
                    />
                ) : (
                    <p>{latitude !== '' ? latitude : 'N/A'}</p>
                )}
            </div>
            <div className="form-group">
                <label>Longitude:</label>
                {editMode ? (
                    <input
                        type="number"
                        className="form-control"
                        value={longitude}
                        onChange={(e) => handleLongitudeChange(e.target.value)}
                    />
                ) : (
                    <p>{longitude !== '' ? longitude : 'N/A'}</p>
                )}
            </div>
            <div className="form-group">
                <label>Pictures:</label>
                {pictures.map((url, index) => (
                    <div key={index} className="d-flex align-items-center mb-2">
                        <img src={url} alt={`Product ${index}`} className="img-thumbnail me-2" />
                        {editMode && (
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeletePicture(product.pictures[index])}
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                ))}
                {editMode && (
                    <>
                        <input
                            type="file"
                            multiple
                            className="form-control mt-2"
                            onChange={handleFileChange}
                        />
                        <button
                            className="btn btn-primary mt-2"
                            onClick={handleCapture}
                        >
                            Open Camera
                        </button>
                        {newPictures.length > 0 && (
                            <div className="mt-3">
                                <h5>Queued Pictures:</h5>
                                {newPictures.map((file, index) => (
                                    <div key={index} className="d-flex align-items-center mb-2">
                                        <img
                                            src={getPreviewURL(file)}
                                            alt={`Queued ${index}`}
                                            className="img-thumbnail me-2"
                                            style={{ maxWidth: '100px', maxHeight: '100px' }}
                                        />
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleRemoveQueuedPicture(index)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            {editMode ? (
                <button className="btn btn-success mt-3" onClick={handleSave}>
                    Save
                </button>
            ) : (
                <div className="mt-3">
                    <button className="btn btn-primary me-2" onClick={() => setEditMode(true)}>
                        Edit
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
