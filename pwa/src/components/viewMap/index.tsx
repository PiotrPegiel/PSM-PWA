import React, { useEffect, useRef, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, getDoc, GeoPoint } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';

import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { useParams } from 'react-router-dom';

// Extend Leaflet's typings to include Routing
declare module 'leaflet' {
    namespace Routing {
        function control(options: any): any;
    }
}

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const SnackBar: React.FC<{ message: string; type: "success" | "error"; onClose: () => void }> = ({ message, type, onClose }) => {
    const [visible, setVisible] = useState(false);
  
    useEffect(() => {
      setVisible(true); // Trigger slide-in animation
  
      const timer = setTimeout(() => {
        setVisible(false); // Trigger slide-out animation
        setTimeout(onClose, 300); // Wait for animation to complete before closing
      }, 3000); // Snack bar disappears after 3 seconds
  
      return () => clearTimeout(timer);
    }, [onClose]);
  
    return (
      <div
        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded text-white flex justify-between items-center transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        } ${type === "success" ? "bg-green-500" : "bg-red-500"}`}
      >
        <span>{message}</span>
        <button className="ml-4 text-white" onClick={onClose}>
          <img src="assets/icons/fi-rr-cross.svg" alt="Close" className="w-6 h-6 filter invert" />
        </button>
      </div>
    );
  };

const MapView: React.FC = () => {
    const { firestore } = useFirebase() || {};
    const [productLocation, setProductLocation] = useState<GeoPoint | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { reservationId, categoryId } = useParams<{ reservationId: string; categoryId: string }>();
    const [product, setProduct] = useState<any>({});
    const [reservation, setReservation] = useState<any>({});
    const [latitude, setLatitude] = useState<number | ''>('');
    const [longitude, setLongitude] = useState<number | ''>('');
    const storage = getStorage();
    const mapRef = useRef<any>(null);
    const [snackBar, setSnackBar] = useState<{ message: string; type: "success" | "error" } | null>(null);    

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
                        setSnackBar({ message: "Unable to fetch your location. Defaulting to [0, 0].", type: "error" });
                    }
                );
            } else {
                setSnackBar({ message: "Geolocation is not supported by your browser.", type: "error" });
            }
        }, []);

    // Fetch product location from Firestore
    useEffect(() => {
        const fetchProduct = async () => {
            if (firestore && reservationId) {
                const reservationRef = doc(firestore, 'reservations', reservationId);
                const reservationDoc = await getDoc(reservationRef);
    
                if (reservationDoc.exists()) {
                    const reservationData = reservationDoc.data();
                    setReservation(reservationData);
    
                    // Extract productId reference and fetch the product
                    const productPath = reservationData.productId; // Could be a DocumentReference or a string
                    if (productPath && typeof productPath === 'object' && 'path' in productPath) {
                        // If productPath is a DocumentReference, use its path property
                        const [collection, docId] = productPath.path.split('/').filter(Boolean);
                        if (collection && docId) {
                            const productRef = doc(firestore, collection, docId);
                            const productDoc = await getDoc(productRef);

                            if (productDoc.exists()) {
                                const productData = productDoc.data();
                                setProduct(productData);

                                // Optionally set product location if it exists
                                if (productData.location) {
                                    setProductLocation(productData.location);
                                }
                            } else {
                                console.error('Product document does not exist.');
                            }
                        } else {
                            console.error('Invalid product path format.');
                        }
                    } else if (typeof productPath === 'string') {
                        // If productPath is already a string
                        const [collection, docId] = productPath.split('/').filter(Boolean);
                        if (collection && docId) {
                            const productRef = doc(firestore, collection, docId);
                            const productDoc = await getDoc(productRef);

                            if (productDoc.exists()) {
                                const productData = productDoc.data();
                                setProduct(productData);
                                // Optionally set product location if it exists
                                if (productData.location) {
                                    setProductLocation(productData.location);
                                }
                            } else {
                                console.error('Product document does not exist.');
                            }
                        } else {
                            console.error('Invalid product path format.');
                        }
                    } else {
                        console.error('productId is not a valid string or DocumentReference:', productPath);
                    }
                } else {
                    console.error('Reservation document does not exist.');
                }
            }
            setLoading(false);
        };
    
        if (reservationId) {
            fetchProduct();
        } else {
            setLoading(false);
        }
    }, [firestore, reservationId]);
    // Get user's current location
    useEffect(() => {
        if (productLocation) {
            setLatitude(productLocation.latitude);
            setLongitude(productLocation.longitude);
        }
    }, [productLocation]);

    // Add routing to the map
    useEffect(() => {
        if (mapRef.current && currentLocation && latitude && longitude) {
            const map = mapRef.current;
    
            const routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(currentLocation.lat, currentLocation.lng),
                    L.latLng(latitude, longitude),
                ],
                routeWhileDragging: true,
                createMarker: () => null, // Disable default markers
                addWaypoints: false, // Prevent adding waypoints
                show: false, // Disable instructions panel
            });
    
            // Remove the instructions container
            routingControl.on('routesfound', () => {
                const instructionsContainer = document.querySelector('.leaflet-routing-container');
                if (instructionsContainer) {
                    instructionsContainer.remove();
                }
            });
    
            routingControl.addTo(map);
    
            return () => {
                map.removeControl(routingControl);
            };
        }
    }, [currentLocation, latitude, longitude]);

    if (loading) {
        return <div>Loading map...</div>;
    }

    return (
        <MapContainer
            center={currentLocation || [0, 0]}
            zoom={12}
            style={{ height: '100vh', width: '100%' }}
            ref={(mapInstance) => {
                if (mapInstance && !mapRef.current) {
                    mapRef.current = mapInstance;
                }
            }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {currentLocation && (
                <Marker position={[currentLocation.lat, currentLocation.lng]}>
                    <Popup>You are here</Popup>
                </Marker>
            )}
            {productLocation && (
                <Marker position={[productLocation.latitude, productLocation.longitude]}>
                    <Popup>Product Location</Popup>
                </Marker>
            )}
            {snackBar && (
                <SnackBar
                message={snackBar.message}
                type={snackBar.type}
                onClose={() => setSnackBar(null)}
                />
            )}
        </MapContainer>
    );
};

export default MapView;