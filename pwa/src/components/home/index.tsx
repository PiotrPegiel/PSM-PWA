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
        <div className="container mx-auto text-center px-4 p-12 ">
            <h1 className="text-2xl font-bold mb-6">Current Reservations</h1>
            <button
                onClick={() => navigate('/new-reservation')}
                className="bg-black text-white py-2 px-4 rounded-md w-full max-w-md mb-6"
            >
                Create reservation
            </button>
            {reservations.length > 0 ? (
                <div className="flex flex-col items-center space-y-4">
                    {reservations.map(reservation => (
                        <div
                            key={reservation.id}
                            className="w-full max-w-md border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/reservations/${reservation.id}`)}
                        >
                            <h5 className="text-lg font-semibold mb-2">
                                {reservation.productData?.name || 'N/A'}
                            </h5>
                            <p className="text-sm text-gray-600">
                                {new Date(reservation.from).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                            <p className="text-sm text-gray-600">
                                {new Date(reservation.from).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}{' '}
                                -{' '}
                                {new Date(reservation.to).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No reservations found.</p>
            )}
        </div>
    );
};

export default Home;