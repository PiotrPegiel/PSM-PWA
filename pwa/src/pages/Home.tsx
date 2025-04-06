import React, { useEffect, useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home: React.FC = () => {
    const { currentUser, firestore } = useFirebase() || {};
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchReservations = async () => {
            if (currentUser && firestore) {
                const reservationsRef = collection(firestore, 'reservations');
                const q = query(reservationsRef, where('userId', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);
                const userReservations = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setReservations(userReservations);
                setLoading(false);
            }
        };

        fetchReservations();
    }, [currentUser, firestore]);

    if (loading) {
        return <div>Loading reservations...</div>;
    }

    return (
        <div className="container text-center mt-5">
            <h1>Your Reservations</h1>
            {reservations.length > 0 ? (
                <ul className="list-group mt-4">
                    {reservations.map(reservation => (
                        <li key={reservation.id} className="list-group-item">
                            <strong>Product ID:</strong> {reservation.productId} <br />
                            <strong>From:</strong> {new Date(reservation.from.seconds * 1000).toLocaleString()} <br />
                            <strong>To:</strong> {new Date(reservation.to.seconds * 1000).toLocaleString()}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No reservations found.</p>
            )}
        </div>
    );
};

export default Home;