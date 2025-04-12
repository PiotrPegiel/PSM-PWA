import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, getDoc, setDoc, deleteDoc, DocumentReference, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

const ReservationNewEdit: React.FC = () => {
    const { firestore, storage, currentUser } = useFirebase() || {}; // Include currentUser from FirebaseContext
    const { reservationId } = useParams<{ reservationId: string }>();
    const location = useLocation(); 
    const navigate = useNavigate();

    const [reservation, setReservation] = useState<any>(location.state?.reservation || {}); // Initialize with state or empty object
    const [product, setProduct] = useState<{ [key: string]: any }>(
        location.state?.reservation?.productId
            ? {
                  name: location.state?.reservation?.productName || 'N/A',
                  location: location.state?.reservation?.productLocation || 'N/A',
                  pictures: location.state?.reservation?.productPictures || [],
              }
            : {}
    ); // Properly type product as an object
    const [editMode, setEditMode] = useState<boolean>(!reservationId); // Start in edit mode if no reservationId
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedPicture, setSelectedPicture] = useState<string | null>(null); // State for the selected picture
    const [currentPictureIndex, setCurrentPictureIndex] = useState(0);

    const handleNextPicture = () => {
        if (product.pictures && product.pictures.length > 0) {
            setCurrentPictureIndex((prevIndex) => (prevIndex + 1) % product.pictures.length);
        }
    };

    const handlePreviousPicture = () => {
        if (product.pictures && product.pictures.length > 0) {
            setCurrentPictureIndex((prevIndex) =>
                (prevIndex - 1 + product.pictures.length) % product.pictures.length
            );
        }
    };

    useEffect(() => {
        const fetchReservation = async () => {
            if (firestore && reservationId) {
                const reservationRef = doc(firestore, 'reservations', reservationId);
                const reservationDoc = await getDoc(reservationRef);
                if (reservationDoc.exists()) {
                    const data = reservationDoc.data();
                    setReservation({
                        ...data,
                        from: data.from instanceof Timestamp
                            ? editMode
                                ? data.from.toDate().toISOString() // ISO format for edit mode
                                : data.from.toDate().toLocaleString() // Local datetime format for display mode
                            : '',
                        to: data.to instanceof Timestamp
                            ? editMode
                                ? data.to.toDate().toISOString() // ISO format for edit mode
                                : data.to.toDate().toLocaleString() // Local datetime format for display mode
                            : '',
                    });

                    // Fetch product details dynamically
                    if (data.productId instanceof DocumentReference) {
                        const productDoc = await getDoc(data.productId);
                        if (productDoc.exists()) {
                            const productData = productDoc.data() as { [key: string]: any }; // Explicitly type productData
                            const resolvedPictures = await Promise.all(
                                (productData.pictures || []).map(async (picture: string) => {
                                    if (picture.startsWith('products/')) {
                                        const storageRef = ref(storage, picture);
                                        return await getDownloadURL(storageRef);
                                    }
                                    return picture; // Return as is if it's an external URL
                                })
                            );

                            setProduct({
                                name: productData.name || 'N/A',
                                location: productData.location || 'N/A',
                                pictures: resolvedPictures,
                            });
                        }
                    }
                }
            }
            setLoading(false);
        };

        if (reservationId) {
            fetchReservation();
        } else {
            setLoading(false);
        }
    }, [firestore, reservationId, storage, editMode]);

    useEffect(() => {
        const resolvePictures = async () => {
            if (product.pictures?.length > 0) {
                const resolvedPictures = await Promise.all(
                    product.pictures.map(async (picture: string) => {
                        if (picture.startsWith('products/')) {
                            const storageRef = ref(storage, picture);
                            return await getDownloadURL(storageRef);
                        }
                        return picture; // Return as is if it's an external URL
                    })
                );
                setProduct((prevProduct) => ({ ...prevProduct, pictures: resolvedPictures }));
            }
        };

        if (!reservationId && product.pictures?.length > 0) {
            resolvePictures();
        }
    }, [product.pictures, reservationId, storage]);

    useEffect(() => {
        const fetchProductDetails = async () => {
            if (firestore && reservation.productId) {
                const productRef = doc(firestore, 'products', reservation.productId);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                    const productData = productDoc.data() as { [key: string]: any };
                    const resolvedPictures = await Promise.all(
                        (productData.pictures || []).map(async (picture: string) => {
                            if (picture.startsWith('products/')) {
                                const storageRef = ref(storage, picture);
                                return await getDownloadURL(storageRef);
                            }
                            return picture;
                        })
                    );

                    setProduct({
                        name: productData.name || 'N/A',
                        location: productData.location || 'N/A',
                        pictures: resolvedPictures,
                    });
                }
            }
        };

        if (!reservationId && reservation.productId) {
            fetchProductDetails();
        }
    }, [firestore, reservation.productId, reservationId, storage]);

    const handleSave = async () => {
        try {
            if (!firestore || !currentUser) {
                alert('Failed to save reservation. Please ensure you are logged in.');
                return;
            }

            if (!reservation.productId) {
                alert('Product ID is missing. Please select a valid product.');
                return;
            }

            if (!reservation.from || !reservation.to) {
                alert('Please set both "From" and "To" date and time.');
                return;
            }

            const fromParts = reservation.from.split('T');
            const toParts = reservation.to.split('T');

            if (fromParts.length < 2 || toParts.length < 2 || !fromParts[0] || !fromParts[1] || !toParts[0] || !toParts[1]) {
                alert('Both date and time must be set for "From" and "To".');
                return;
            }

            const fromDate = new Date(reservation.from);
            const toDate = new Date(reservation.to);
            const currentDate = new Date();

            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                alert('Invalid date or time format. Please correct it.');
                return;
            }

            if (toDate <= fromDate) {
                alert('"To" datetime must be later than "From" datetime.');
                return;
            }

            if (toDate <= currentDate) {
                alert('"To" datetime must be in the future.');
                return;
            }

            // Check for overlapping reservations
            const reservationsRef = collection(firestore, 'reservations');
            const q = query(
                reservationsRef,
                where('productId', '==', doc(firestore, 'products', reservation.productId)),
                where('to', '>', Timestamp.fromDate(fromDate)),
                where('from', '<', Timestamp.fromDate(toDate))
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                alert('The selected product is already reserved for the chosen time period.');
                return;
            }

            const reservationRef = reservationId
                ? doc(firestore, 'reservations', reservationId)
                : doc(firestore, 'reservations', `${Date.now()}`); // Generate a new ID for new reservations

            const formattedReservation = {
                ...reservation,
                userId: currentUser.uid, // Ensure userId is set from currentUser
                productId: doc(firestore, 'products', reservation.productId), // Reconstruct Firestore document reference
                from: reservation.from ? Timestamp.fromDate(new Date(reservation.from)) : null, // Convert to Firestore Timestamp
                to: reservation.to ? Timestamp.fromDate(new Date(reservation.to)) : null, // Convert to Firestore Timestamp
            };

            await setDoc(reservationRef, formattedReservation);
            alert('Reservation saved successfully!');
            navigate('/home');
        } catch (error) {
            console.error('Error saving reservation:', error);
            alert('An error occurred while saving the reservation. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (firestore && reservationId) {
            const reservationRef = doc(firestore, 'reservations', reservationId);
            await deleteDoc(reservationRef);
            alert('Reservation deleted successfully!');
            navigate('/home');
        }
    };

    const handlePictureClick = (picture: string) => {
        setSelectedPicture(picture); // Set the clicked picture as the selected picture
    };

    const closeModal = () => {
        setSelectedPicture(null); // Close the modal by setting the selected picture to null
    };

    const handleDateTimeChange = (field: string, type: 'date' | 'time', value: string) => {
        const [date, time] = (reservation[field] || '').split('T');
        const newDateTime = type === 'date' ? `${value}T${time || ''}` : `${date || ''}T${value}`;
        setReservation({ ...reservation, [field]: newDateTime || '' }); // Ensure empty string if no value
    };

    // Helper function to format a Date object to match the localized format
    const formatDateForComparison = (date: Date): string => {
        return date.toLocaleString('default', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const isPastReservation = reservation.to
        ? new Date(reservation.to).getTime() <
        new Date(formatDateForComparison(new Date())).getTime()
        : false;

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center min-h-screen p-6">
            <h1 className="text-xl font-bold mb-6">
                {editMode && !reservationId ? 'New Reservation' : editMode ? 'Edit Reservation' : 'Reservation Details'}
            </h1>
            <div className="w-full max-w-md p-6 rounded-lg">
                {/* picture carousel */}
                <div className="mb-4">
                    {product.pictures?.length > 0 ? (
                        <div className="relative w-full max-w-md">
                            <img
                                src={product.pictures[currentPictureIndex]}
                                alt={`Product ${currentPictureIndex}`}
                                className="w-full h-auto object-cover rounded-md shadow-sm"
                            />
                            <button
                                onClick={handlePreviousPicture}
                                className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-700 text-white px-2 py-1 rounded-l-md hover:bg-gray-800"
                            >
                                ◀
                            </button>
                            <button
                                onClick={handleNextPicture}
                                className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-700 text-white px-2 py-1 rounded-r-md hover:bg-gray-800"
                            >
                                ▶
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-500">No pictures available</p>
                    )}
                </div>
                {/* product name */}
                <div className="mb-4">
                    <p className="text-gray-800">{product.name || 'N/A'}</p>
                </div>
                {/* from date */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">From:</label>
                    {editMode ? (
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                className="w-1/2 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={reservation.from?.split('T')[0] || ''} // Extract date part
                                onChange={(e) => handleDateTimeChange('from', 'date', e.target.value)}
                            />
                            <input
                                type="time"
                                className="w-1/2 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={reservation.from?.split('T')[1]?.slice(0, 5) || ''} // Extract time part
                                onChange={(e) => handleDateTimeChange('from', 'time', e.target.value)}
                            />
                        </div>
                    ) : (
                        <p className="text-gray-800">{reservation.from || 'N/A'}</p>
                    )}
                </div>
                {/* to date */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
                    {editMode ? (
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                className="w-1/2 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={reservation.to?.split('T')[0] || ''} // Extract date part
                                onChange={(e) => handleDateTimeChange('to', 'date', e.target.value)}
                            />
                            <input
                                type="time"
                                className="w-1/2 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={reservation.to?.split('T')[1]?.slice(0, 5) || ''} // Extract time part
                                onChange={(e) => handleDateTimeChange('to', 'time', e.target.value)}
                            />
                        </div>
                    ) : (
                        <p className="text-gray-800">{reservation.to || 'N/A'}</p>
                    )}
                </div>
                {editMode ? (
                    <button
                        className="w-full bg-stone-950 text-white py-2 rounded-lg mt-4 hover:bg-gray-900"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                ) : (
                    <div className="flex flex-column space-x-4 mt-4">
                        <button
                        className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                        onClick={() => navigate(`/reservations/${reservationId}/map`)}
                    >
                        View On Map
                    </button>
                        {!isPastReservation && (
                            <>
                                <button
                                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                                    onClick={() => setEditMode(true)}
                                >
                                    Edit Reservation
                                </button>
                                <button
                                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                                    onClick={handleDelete}
                                >
                                    Cancel Reservation
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReservationNewEdit;
