import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs, getDoc, addDoc, doc, DocumentReference, setDoc, Timestamp } from 'firebase/firestore';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const { firestore, currentUser } = useFirebase() || {};
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // Fetch reservations and resolve references
    useEffect(() => {
        const fetchReservations = async () => {
            try {
                if (firestore) {
                    const reservationsRef = collection(firestore, 'reservations');
                    const querySnapshot = await getDocs(reservationsRef);

                    if (querySnapshot.empty) {
                        console.log('No reservations found in Firestore.');
                        setReservations([]);
                        return;
                    }

                    const allReservations = await Promise.all(
                        querySnapshot.docs.map(async doc => {
                            const data = doc.data();
                            let productData = null;
                            let categoryData = null;

                            // Resolve productId reference
                            if (data.productId instanceof DocumentReference) {
                                const productDoc = await getDoc(data.productId);
                                if (productDoc.exists()) {
                                    productData = productDoc.data();

                                    // Resolve categoryId reference within the product
                                    if (productData.categoryId instanceof DocumentReference) {
                                        const categoryDoc = await getDoc(productData.categoryId);
                                        if (categoryDoc.exists()) {
                                            categoryData = categoryDoc.data();
                                        }
                                    }
                                }
                            }

                            return {
                                id: doc.id,
                                ...data,
                                from: data.from instanceof Timestamp
                                    ? data.from.toDate().toLocaleString() // Convert Firestore Timestamp to local timezone
                                    : 'N/A',
                                to: data.to instanceof Timestamp
                                    ? data.to.toDate().toLocaleString() // Convert Firestore Timestamp to local timezone
                                    : 'N/A',
                                productData,
                                categoryData,
                            };
                        })
                    );

                    console.log('All Reservations:', allReservations);
                    setReservations(allReservations);
                } else {
                    console.error('Firestore instance is not initialized.');
                }
            } catch (error) {
                console.error('Error fetching reservations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, [firestore]);

    if (loading) {
        return <div>Loading reservations...</div>;
    }


    return (
        <div className="container text-center mt-5">
            <h1>All Reservations</h1>
            {reservations.length > 0 ? (
                <ul className="list-group mt-4">
                    {reservations.map(reservation => (
                        <li
                            key={reservation.id}
                            className="list-group-item"
                            onClick={() => navigate(`/reservations/${reservation.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <strong>Reservation ID:</strong> {reservation.id || 'N/A'} <br />
                            <strong>Product Name:</strong> {reservation.productData?.name || 'N/A'} <br />
                            <strong>Category:</strong> {reservation.categoryData?.name || 'N/A'} <br />
                            <strong>User ID:</strong> {reservation.userId || 'N/A'} <br />
                            <strong>From:</strong> {reservation.from} <br />
                            <strong>To:</strong> {reservation.to} <br />
                            <strong>Product Reference:</strong> {reservation.productId?.id || 'N/A'}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No reservations found.</p>
            )}

                <button onClick={() => navigate('/new-reservation')} className="btn btn-success mt-3">New Reservation</button>
            </div>
    );
};

export default Home;