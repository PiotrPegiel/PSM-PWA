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
            captureButton.style.position = 'absolute';
            captureButton.style.bottom = '20px';
            captureButton.style.left = '50%';
            captureButton.style.transform = 'translateX(-60px)';
            captureButton.style.width = '50px';
            captureButton.style.height = '50px';
            captureButton.style.backgroundColor = 'white';
            captureButton.style.border = '2px solid black';
            captureButton.style.borderRadius = '8px';
            captureButton.style.cursor = 'pointer';
            captureButton.style.display = 'flex';
            captureButton.style.justifyContent = 'center';
            captureButton.style.alignItems = 'center';

            const checkIcon = document.createElement('img');
            checkIcon.src = '/assets/icons/fi-rr-check.svg';
            checkIcon.style.width = '24px';
            checkIcon.style.height = '24px';
            captureButton.appendChild(checkIcon);

            captureButton.onclick = () => {
                capturePicture();
                document.body.removeChild(modal);
            };

            const cancelButton = document.createElement('button');
            cancelButton.style.position = 'absolute';
            cancelButton.style.bottom = '20px';
            cancelButton.style.right = '50%';
            cancelButton.style.transform = 'translateX(60px)';
            cancelButton.style.width = '50px';
            cancelButton.style.height = '50px';
            cancelButton.style.backgroundColor = 'white';
            cancelButton.style.border = '2px solid black';
            cancelButton.style.borderRadius = '8px';
            cancelButton.style.cursor = 'pointer';
            cancelButton.style.display = 'flex';
            cancelButton.style.justifyContent = 'center';
            cancelButton.style.alignItems = 'center';

            const cancelIcon = document.createElement('img');
            cancelIcon.src = '/assets/icons/fi-rr-cross.svg';
            cancelIcon.style.width = '24px';
            cancelIcon.style.height = '24px';
            cancelButton.appendChild(cancelIcon);

            cancelButton.onclick = () => {
                stream.getTracks().forEach((track) => track.stop());
                document.body.removeChild(modal);
            };

            modal.appendChild(video);
            modal.appendChild(captureButton);
            modal.appendChild(cancelButton);
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access the camera.');
        }
    };

    const getPreviewURL = (file: File) => URL.createObjectURL(file);

    const handleRemoveQueuedPicture = (index: number) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this picture?');
        if (!confirmDelete) return;

        setNewPictures((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDeletePicture = async (path: string) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this picture?');
        if (!confirmDelete) return;

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

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen overflow-y-auto pt-12">
            <div className='w-full max-w-sm flex justify-between items-center space-x-4 mb-12'>
                <button
                    className=""
                    onClick={() => navigate(-1)} 
                >
                    <img src="/assets/icons/fi-rr-angle-left.svg" alt="Back" className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold">
                    {editMode && !productId ? 'New Product' : editMode ? 'Edit Product' : 'Product Details'}
                </h1>
                <div className='w-6 h-6'></div>
            </div>
            <div className="w-full max-w-sm">
                {/* Name Input */}
                <div className="mx-1">
                    {editMode ? (
                        <input
                            type="text"
                            className="w-full border-2 border-black rounded-[8px] px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={product.name || ''}
                            onChange={(e) => setProduct({ ...product, name: e.target.value })}
                            placeholder="Name"
                        />
                    ) : (
                        <p className="text-2xl font-semibold">{product.name}</p>
                    )}
                </div>
                {/* Pictures Section */}
                <div className="w-full border-2 border-black rounded-[8px] mt-4">
                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={10}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true }}
                        className="w-full h-auto"
                        style={{ '--swiper-navigation-color': "black", '--swiper-pagination-color': 'black' } as React.CSSProperties}
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
                                </div>
                                {editMode && (
                                    <button
                                        className="absolute bottom-4 right-4 text-white hover:cursor-pointer"
                                        onClick={() => handleDeletePicture(product.pictures[index])}
                                    >
                                        <img
                                            className="w-14 h-14"
                                            src="/assets/icons/fi-rr-trash-xmark.svg"
                                        />
                                    </button>
                                )}
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
                                </div>
                                {editMode && (
                                    <button
                                        className="absolute bottom-4 right-4 text-white hover:cursor-pointer"
                                        onClick={() => handleRemoveQueuedPicture(index)}
                                    >
                                        <img
                                            className="w-14 h-14"
                                            src="/assets/icons/fi-rr-trash-xmark.svg"
                                        />
                                    </button>
                                )}
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
                {/* Picture inputs */}
                {editMode && (
                    <div className="flex flex-row gap-4 mt-2">
                        <div
                            className="w-full flex justify-center text-sm bg-white border-2 border-black text-black px-4 py-2 rounded-[8px] hover:cursor-pointer"
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <img 
                                src="/assets/icons/fi-rr-file.svg"
                                alt="Upload"
                                className="w-6 h-6"
                            />
                        </div>
                        <input
                            id="file-upload"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <div
                            className="w-full  flex justify-center bg-white border-2 border-black text-black px-4 py-2 rounded-[8px] hover:cursor-pointer"
                            onClick={handleCapture}
                        >
                            <img 
                                src="/assets/icons/fi-rr-camera.svg"
                                alt="Capture"
                                className="w-6 h-6"
                            />
                        </div>
                    </div>
                )}
                {/* Map */}
                {editMode ? (
                    <div className="w-full p-1 border-2 border-black rounded-[8px] mt-4">
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
                    <div className="w-full p-1 border-2 border-black rounded-[8px] mt-4">
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
                <>
                    <button
                        className="w-full max-w-sm bg-black text-white py-3 rounded-[8px] mt-4 text-sm font-medium"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <button
                        className="w-full max-w-sm bg-white text-black border-2 border-black py-3 rounded-[8px] mt-3 text-sm font-medium"
                        onClick = {() => setEditMode(false)}
                    >
                        Cancel
                    </button>
                </>
            ) : (
                <button
                        className="w-full max-w-sm bg-black text-white py-3 rounded-[8px] mt-4 text-sm font-medium"
                        onClick={() => setEditMode(true)}
                    >
                        Edit
                </button>
                
            )}
            </div>
        </div>
    );
};

export default ProductDetails;