import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs, getDoc, addDoc, doc, DocumentReference, setDoc, Timestamp, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const { firestore, currentUser } = useFirebase() || {};
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // Fetch reservations and resolve references
    useEffect(() => {
        const fetchReservations = async () => {
            if (!firestore || !currentUser) {
                return; // Exit early if not initialized
            }

            try {
                const reservationsRef = collection(firestore, 'reservations');
                const now = Timestamp.now();
                const q = query(
                    reservationsRef,
                    where('userId', '==', currentUser.uid),
                    where('to', '>=', now)
                );

                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    console.log('No reservations found for the current user.');
                    setReservations([]);
                    return;
                }

                const allReservations = await Promise.all(
                    querySnapshot.docs.map(async doc => {
                        const data = doc.data();
                        let productData = null;
                        let categoryData = null;

                        if (data.productId instanceof DocumentReference) {
                            const productDoc = await getDoc(data.productId);
                            if (productDoc.exists()) {
                                productData = productDoc.data();

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
                                ? data.from.toDate().toLocaleString()
                                : 'N/A',
                            to: data.to instanceof Timestamp
                                ? data.to.toDate().toLocaleString()
                                : 'N/A',
                            productData,
                            categoryData,
                        };
                    })
                );

                setReservations(allReservations);
            } catch (error: any) {
                if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
                    console.error('Firestore index required. Create it here:', error.message);
                } else {
                    console.error('Error fetching reservations:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, [firestore, currentUser]);

    if (!firestore || !currentUser) {
        return <div>Initializing...</div>; // Show a fallback UI while initializing
    }

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