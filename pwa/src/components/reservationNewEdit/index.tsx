import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, getDoc, setDoc, deleteDoc, DocumentReference, Timestamp } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

const ReservationNewEdit: React.FC = () => {
    const { firestore, storage, currentUser } = useFirebase() || {}; // Include currentUser from FirebaseContext
    const { reservationId } = useParams<{ reservationId: string }>();
    const location = useLocation(); // Access the state passed via navigate
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
                            ? data.from.toDate().toLocaleString() // Convert to local datetime format
                            : '',
                        to: data.to instanceof Timestamp
                            ? data.to.toDate().toLocaleString() // Convert to local datetime format
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
    }, [firestore, reservationId, storage]);

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
        if (firestore && currentUser) {
            if (!reservation.productId) {
                alert('Product ID is missing. Please select a valid product.');
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
        } else {
            alert('Failed to save reservation. Please ensure you are logged in.');
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

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container text-center mt-5">
            <h1>{editMode && !reservationId ? 'Add New Reservation' : editMode ? 'Edit Reservation' : 'Reservation Details'}</h1>
            <div className="form-group">
                <label>Product Name:</label>
                <p>{product.name || 'N/A'}</p>
            </div>
            <div className="form-group">
                <label>Product Location:</label>
                <p>
                    {product.location?._lat !== undefined && product.location?._long !== undefined
                        ? `Lat: ${product.location._lat}, Long: ${product.location._long}`
                        : typeof product.location === 'string'
                        ? product.location
                        : 'N/A'}
                </p>
            </div>
            <div className="form-group">
                <label>Product Pictures:</label>
                {product.pictures?.length > 0 ? (
                    <div id="carouselExample" className="carousel slide" data-bs-ride="carousel">
                        <div className="carousel-inner">
                            {product.pictures.map((picture: string, index: number) => (
                                <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                                    <img src={picture} className="d-block w-100" alt={`Product ${index}`} />
                                </div>
                            ))}
                        </div>
                        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExample" data-bs-slide="prev">
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Previous</span>
                        </button>
                        <button className="carousel-control-next" type="button" data-bs-target="#carouselExample" data-bs-slide="next">
                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Next</span>
                        </button>
                    </div>
                ) : (
                    <p>No pictures available</p>
                )}
            </div>
            <div className="form-group">
                <label>From:</label>
                {editMode ? (
                    <input
                        type="datetime-local"
                        className="form-control"
                        value={reservation.from}
                        onChange={(e) => setReservation({ ...reservation, from: e.target.value })}
                    />
                ) : (
                    <p>{reservation.from || 'N/A'}</p>
                )}
            </div>
            <div className="form-group">
                <label>To:</label>
                {editMode ? (
                    <input
                        type="datetime-local"
                        className="form-control"
                        value={reservation.to}
                        onChange={(e) => setReservation({ ...reservation, to: e.target.value })}
                    />
                ) : (
                    <p>{reservation.to || 'N/A'}</p>
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

export default ReservationNewEdit;
