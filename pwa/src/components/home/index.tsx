import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs, getDoc, DocumentReference, Timestamp, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Header from "../header";

const formatDate = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
};

const formatTime = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
};

const Home: React.FC = () => {
    const { firestore, currentUser } = useFirebase() || {};
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchReservations = async () => {
            if (!firestore || !currentUser) {
                return;
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

                        if (data.productId instanceof DocumentReference) {
                            const productDoc = await getDoc(data.productId);
                            if (productDoc.exists()) {
                                productData = productDoc.data();
                            }
                        }

                        return {
                            id: doc.id,
                            ...data,
                            fromDate: data.from instanceof Timestamp ? formatDate(data.from) : 'N/A',
                            fromTime: data.from instanceof Timestamp ? formatTime(data.from) : 'N/A',
                            toDate: data.to instanceof Timestamp ? formatDate(data.to) : 'N/A',
                            toTime: data.to instanceof Timestamp ? formatTime(data.to) : 'N/A',
                            productData,
                        };
                    })
                );

                setReservations(allReservations);
            } catch (error: any) {
                console.error('Error fetching reservations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, [firestore, currentUser]);

    if (!firestore || !currentUser) {
        return <div>Initializing...</div>;
    }

    if (loading) {
        return <div>Loading reservations...</div>;
    }

    return (

        <div className="container mx-auto text-center px-4 p-12 font-inter min-h-screen overflow-y-auto">
        {<Header />}
            <h1 className="text-2xl font-semibold mb-6">Current Reservations</h1>
            <button
                onClick={() => navigate('/new-reservation')}
                className="bg-black text-white py-2 px-4 rounded-[8px] w-full max-w-md mb-6"
            >
                Create reservation
            </button>
            {reservations.length > 0 ? (
                <div className="flex flex-col items-center space-y-4">
                    {reservations.map(reservation => (
                        <div
                            key={reservation.id}
                            className="w-full max-w-md border-2 border-black rounded-[8px] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/reservations/${reservation.id}`)}
                        >
                            <h5 className="text-lg font-semibold mb-2">
                                {reservation.productData?.name || 'N/A'}
                            </h5>
                            <p className="text-sm text-gray-600">
                                {reservation.fromDate}
                                {reservation.fromDate !== reservation.toDate && (
                                    <>
                                        {' - '}
                                        {reservation.toDate}
                                    </>
                                )}
                            </p>
                            <p className="text-sm text-gray-600">
                                {reservation.fromTime}
                                {' - '}
                                {reservation.toTime}
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