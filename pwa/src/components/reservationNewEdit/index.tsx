import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, getDoc, setDoc, deleteDoc, DocumentReference, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { useSwipeable } from 'react-swipeable';
import Header from "../header";

const SnackBar: React.FC<{ message: string; type: "success" | "error" | "warning"; onClose: () => void }> = ({ message, type, onClose }) => {
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
        } ${type === "success" ? "bg-green-500" : type == "warning" ? "bg-orange-500" : "bg-red-500"}`}
      >
        <span>{message}</span>
        <button className="ml-4 text-white" onClick={onClose}>
          <img src="assets/icons/fi-rr-cross.svg" alt="Close" className="w-6 h-6 filter invert" />
        </button>
      </div>
    );
  };

const ReservationNewEdit: React.FC = () => {
    const { firestore, storage, currentUser } = useFirebase() || {}; // Include currentUser from FirebaseContext
    const { reservationId } = useParams<{ reservationId: string }>();
    const location = useLocation(); 
    const navigate = useNavigate();
    const [snackBar, setSnackBar] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null); 
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
                setSnackBar({ message: "Failed to save reservation. Please ensure you are logged in.", type: "error" });
                return;
            }
    
            if (!reservation.productId) {
                setSnackBar({ message: "Product ID is missing. Please select a valid product.", type: "error" });
                return;
            }
    
            if (!reservation.from || !reservation.to) {
                setSnackBar({ message: "Please set both 'From' and 'To' date and time.", type: "error" });
                return;
            }
    
            const fromParts = reservation.from.split('T');
            const toParts = reservation.to.split('T');
    
            if (fromParts.length < 2 || toParts.length < 2 || !fromParts[0] || !fromParts[1] || !toParts[0] || !toParts[1]) {
                setSnackBar({ message: "Both date and time must be set for 'From' and 'To'.", type: "error" });
                return;
            }
    
            const fromDate = new Date(reservation.from);
            const toDate = new Date(reservation.to);
            const currentDate = new Date();
    
            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                setSnackBar({ message: "Invalid date or time format. Please correct it.", type: "error" });
                return;
            }
    
            if (toDate <= fromDate) {
                setSnackBar({ message: "Invalid date range. 'To' must be later than 'From'.", type: "error" });
                return;
            }
    
            if (toDate <= currentDate) {
                setSnackBar({ message: "Invalid date range. 'To' must be in the future.", type: "error" });
                return;
            }
    
            // Check for overlapping reservations
            const reservationsRef = collection(firestore, 'reservations');
            const q = query(
                reservationsRef,
                where('productId', '==', typeof reservation.productId === 'string' ? doc(firestore, 'products', reservation.productId) : reservation.productId),
                where('to', '>', Timestamp.fromDate(fromDate)),
                where('from', '<', Timestamp.fromDate(toDate)),
                ...(reservationId ? [where('__name__', '!=', reservationId)] : []) // Exclude the current reservation if editing
            );
    
            const querySnapshot = await getDocs(q);
    
            if (!querySnapshot.empty) {
                setSnackBar({ message: "The selected product is already reserved for the chosen time period.", type: "error" });
                return;
            }
    
            const reservationRef = reservationId
                ? doc(firestore, 'reservations', reservationId)
                : doc(firestore, 'reservations', `${Date.now()}`); // Generate a new ID for new reservations
    
            const formattedReservation = {
                ...reservation,
                userId: currentUser.uid, // Ensure userId is set from currentUser
                productId: typeof reservation.productId === 'string' ? doc(firestore, 'products', reservation.productId) : reservation.productId, // Ensure valid DocumentReference
                from: reservation.from ? Timestamp.fromDate(new Date(reservation.from)) : null, // Convert to Firestore Timestamp
                to: reservation.to ? Timestamp.fromDate(new Date(reservation.to)) : null, // Convert to Firestore Timestamp
            };
    
            await setDoc(reservationRef, formattedReservation);
            setSnackBar({ message: "Reservation saved successfully!", type: "success" });
            navigate('/home');
        } catch (error) {
            console.error('Error saving reservation:', error);
            setSnackBar({ message: "Failed to save reservation. Please try again.", type: "error" });
        }
    };

    const handleDelete = async () => {
        if (firestore && reservationId) {
            const reservationRef = doc(firestore, 'reservations', reservationId);
            await deleteDoc(reservationRef);
            setSnackBar({ message: "Reservation deleted successfully!", type: "success" });
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
        const newDateTime =
            type === 'date'
                ? `${value}T${time || '00:00'}` // Default to '00:00' if time is missing
                : `${date || new Date().toISOString().split('T')[0]}T${value}`; // Default to today's date if date is missing
        setReservation({ ...reservation, [field]: newDateTime });
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

    const swipeHandlers = useSwipeable({
        onSwipedLeft: handleNextPicture, // Swipe left to go to next picture
        onSwipedRight: handlePreviousPicture, // Swipe right to go to previous picture
        trackMouse: true, // Allow swiping with mouse on desktop
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex w-full flex-col items-center min-h-screen pt-12 ">
            {<Header />}
            <div className="relative w-full max-w-md mb-6">
                <button
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2"
                    onClick={() => navigate(-1)} 
                >
                    <img src="/assets/icons/fi-rr-angle-left.svg" alt="Back" className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-center">
                    {editMode && !reservationId ? 'New Reservation' : editMode ? 'Edit Reservation' : 'Reservation Details'}
                </h1>
            </div>
            <div className="w-full max-w-md p-6 rounded-lg">
                {/* picture carousel */}
                <div className="mb-4">
                    {product.pictures?.length > 0 ? (
                        <div
                            className="relative w-full max-w-md border-2 border-black rounded-[8px]"
                            {...swipeHandlers} // Attach swipe handlers to the carousel
                        >
                            <img
                                src={product.pictures[currentPictureIndex]}
                                alt={`Product ${currentPictureIndex}`}
                                className="w-full max-w-md h-auto object-cover rounded-md shadow-sm"
                            />
                            <button
                                onClick={handlePreviousPicture}
                                className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-0 text-white px-2 py-1 rounded-l-md hover:bg-gray-100"
                            >
                                <img src='/assets/icons/fi-rr-angle-left.svg' alt="Previous" className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleNextPicture}
                                className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-0 text-white px-2 py-1 rounded-r-md hover:bg-gray-100"
                            >
                                <img src='/assets/icons/fi-rr-angle-right.svg' alt="Previous" className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-500">No pictures available</p>
                    )}
                </div>
                {/* product name */}
                <div className="mb-4 text-2xl font-semibold mb-6">
                    <p className="text-gray-800">{product.name || 'N/A'}</p>
                </div>
                {/* from date */}
                <div className="mb-4">
                    <label className="block text-md font-semibold text-gray-700 mb-2">From:</label>
                    {editMode ? (
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                className="w-1/2 border border-gray-300 rounded-[8px] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={reservation.from?.split('T')[0] || ''} // Extract date part
                                onChange={(e) => handleDateTimeChange('from', 'date', e.target.value)}
                            />
                            <input
                                type="time"
                                className="w-1/2 border border-gray-300 rounded-[8px] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={reservation.from ? new Date(reservation.from).toLocaleTimeString('en-US', { hour12: false }).slice(0, 5) : ''} // Convert to local time
                                onChange={(e) => handleDateTimeChange('from', 'time', e.target.value)}
                            />
                        </div>
                    ) : (
                        <p className="text-gray-800">{reservation.from || 'N/A'}</p>
                    )}
                </div>
                {/* to date */}
                <div className="mb-4">
                    <label className="block text-md font-semibold text-gray-700 mb-2">To:</label>
                    {editMode ? (
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                className="w-1/2 border border-gray-300 rounded-[8px] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={reservation.to?.split('T')[0] || ''} // Extract date part
                                onChange={(e) => handleDateTimeChange('to', 'date', e.target.value)}
                            />
                            <input
                                type="time"
                                className="w-1/2 border border-gray-300 rounded-[8px] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={reservation.to ? new Date(reservation.to).toLocaleTimeString('en-US', { hour12: false }).slice(0, 5) : ''} // Convert to local time
                                onChange={(e) => handleDateTimeChange('to', 'time', e.target.value)}
                            />
                        </div>
                    ) : (
                        <p className="text-gray-800">{reservation.to || 'N/A'}</p>
                    )}
                </div>
                {editMode ? (
                    <>
                        <button
                            className="w-full bg-stone-950 text-white py-2 rounded-[8px] mt-4"
                            onClick={handleSave}
                        >
                            Save
                        </button>
                        {reservationId && (
                            <button
                                className="w-full bg-white border-2 border-black text-black py-2 rounded-[8px] mt-3"
                                onClick={() => setEditMode(false)}
                            >
                                Cancel
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex flex-column mt- gap-3">
                        <button
                        className="flex-1 bg-white border-2 border-black text-black py-2 rounded-[8px]"
                        onClick={() => navigate(`/reservations/${reservationId}/map`)}
                    >
                        View On Map
                    </button>
                        {!isPastReservation && (
                            <>
                                <button
                                    className="flex-1 bg-white border-2 border-black text-black py-2 rounded-[8px]"
                                    onClick={() => setEditMode(true)}
                                >
                                    Edit Reservation
                                </button>
                                <button
                                    className="flex-1 bg-black text-white py-2 rounded-[8px]"
                                    onClick={handleDelete}
                                >
                                    Cancel Reservation
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            {snackBar && (
                <SnackBar
                    message={snackBar.message}
                    type={snackBar.type}
                    onClose={() => setSnackBar(null)}
                />
            )}
        </div>
    );
};

export default ReservationNewEdit;