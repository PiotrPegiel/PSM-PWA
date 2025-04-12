import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, getDoc, setDoc, deleteDoc, GeoPoint } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Import required modules
import { Navigation, Pagination } from 'swiper/modules';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});



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
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

    const storage = getStorage();


    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentLocation({ lat: latitude, lng: longitude });
                },
                (error) => {
                    console.error('Error fetching location:', error);
                    setCurrentLocation({ lat: 0, lng: 0 });
                    alert('Unable to fetch your location. Defaulting to [0, 0].');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    }, []);


    const LocationSelector = () => {
        useMapEvents({
            click(e: L.LeafletMouseEvent) {
                const { lat, lng } = e.latlng;
                setCurrentLocation({ lat, lng });
                setLatitude(lat);
                setLongitude(lng);
            },
        });
        return currentLocation ? <Marker position={[currentLocation.lat, currentLocation.lng]} /> : null;
    };

    const SetView = ({ lat, lng }: { lat: number; lng: number }) => {
        const map = useMap();
        useEffect(() => {
            if (lat && lng) {
                map.setView([lat, lng], 25); // Set the center and zoom level
            }
        }, [lat, lng, map]);
        return null;
    };

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

            console.log('Location:', location);
            console.log('lat:', latitude);
            console.log('long:', longitude);
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
            setLatitude(parsedValue === "" ? 0 : parsedValue);
        } else {
            alert('Latitude must be between -90 and 90.');
        }
    };

    const handleLongitudeChange = (value: string) => {
        const parsedValue = value === '' ? '' : parseFloat(value);
        if (parsedValue === '' || (parsedValue >= -180 && parsedValue <= 180)) {
            setLongitude(parsedValue === "" ? 0 : parsedValue);
        } else {
            alert('Longitude must be between -180 and 180.');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen overflow-y-auto pt-12">
            <h1 className="text-xl font-semibold mb-6">
                {editMode && !productId ? 'New Product' : editMode ? 'Edit Product' : 'Product Details'}
            </h1>
            <div className="w-full max-w-sm">
                {/* Name Input */}
                <div className="mb-2 mx-1">
                    {editMode ? (
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={product.name || ''}
                            onChange={(e) => setProduct({ ...product, name: e.target.value })}
                            placeholder="Name"
                        />
                    ) : (
                        <p className="text-2xl font-semibold">{product.name}</p>
                    )}
                </div>
                {/* Pictures Section */}
                <div className="mb-4 mx-1">
                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={10}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true }}
                        className="w-full h-auto"
                    >
                        {/* Existing pictures from the database */}
                        {pictures.map((url, index) => (
                            <SwiperSlide key={`db-${index}`}>
                                <div className="relative">
                                    <img
                                        src={url}
                                        alt={`Product ${index}`}
                                        className="w-full h-auto object-cover rounded-md"
                                    />
                                    {editMode && (
                                        <img
                                            className="absolute bottom-4 right-4 text-white w-14 h-14 hover:cursor-pointer"
                                            src="/assets/icons/fi-rr-trash-xmark.svg"
                                            onClick={() => handleDeletePicture(product.pictures[index])}
                                        />
                                    )}
                                </div>
                            </SwiperSlide>
                        ))}

                        {/* Queued pictures */}
                        {newPictures.map((file, index) => (
                            <SwiperSlide key={`queue-${index}`}>
                                <div className="relative">
                                    <img
                                        src={getPreviewURL(file)}
                                        alt={`Queued ${index}`}
                                        className="w-full h-auto object-cover rounded-md"
                                    />
                                    <img
                                        className="absolute bottom-4 right-4 text-white w-14 h-14 hover:cursor-pointer"
                                        src="/assets/icons/fi-rr-trash-xmark.svg"
                                        onClick={() => handleRemoveQueuedPicture(index)}
                                    />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    {editMode && (
                        <>
                            <div className="grid grid-cols-1 gap-4 mt-4">
                                <input
                                    type="file"
                                    multiple
                                    className="mt-2 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-500 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-700 focus:outline-none disabled:pointer-events-none disabled:opacity-60"
                                    onChange={handleFileChange}
                                />
                                <button
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2 hover:bg-blue-600"
                                    onClick={handleCapture}
                                >
                                    Open Camera
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
             {/* Map */}
             {editMode ? (
                    <div className="w-[80%] border-2 border-black rounded-[8px]">
                            <MapContainer
                                style={{ height: '300px', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <SetView lat={currentLocation?.lat || 0} lng={currentLocation?.lng || 0} />
                                <LocationSelector />
                            </MapContainer>
                    </div>
                ) : (
                    <div className="w-[80%] border-2 border-black rounded-[8px]">
                            <MapContainer
                                style={{ height: '300px', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {typeof longitude === 'number' && typeof latitude === 'number' && (
                                    <SetView lat={latitude} lng={longitude} />
                                    
                                )}
                                
                                {typeof latitude === 'number' && typeof longitude === 'number' && (
                                    <Marker position={[latitude, longitude]} />
                                )}
                            </MapContainer>
                    </div>
                )}
            {/* Save or Edit/Delete Buttons */}
            {editMode ? (
                <button
                    className="w-full max-w-sm bg-black text-white py-3 rounded-[8px] mt-6 text-sm font-medium"
                    onClick={handleSave}
                >
                    Save
                </button>
            ) : (
                <button
                        className="w-full max-w-sm bg-black text-white py-3 rounded-[8px] mt-6 text-sm font-medium"
                        onClick={() => setEditMode(true)}
                    >
                        Edit
                </button>
            )}
        </div>
    );
};

export default ProductDetails;