import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs, getDoc, addDoc, doc, DocumentReference, setDoc } from 'firebase/firestore';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const { firestore, currentUser } = useFirebase() || {};
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // Form states
    const [categoryName, setCategoryName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [productName, setProductName] = useState('');
    const [productId, setProductId] = useState('');
    const [productLocation, setProductLocation] = useState('');
    const [productPictures, setProductPictures] = useState<string[]>([]);
    const [reservationFrom, setReservationFrom] = useState('');
    const [reservationTo, setReservationTo] = useState('');

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

    // Add a new category with a specific ID
    const addCategory = async () => {
        if (firestore) {
            const categoryRef = doc(firestore, 'categories', categoryId); // Use categoryId as the document ID
            await setDoc(categoryRef, { name: categoryName });
            alert('Category added!');
        }
    };

    // Add hardcoded category with a specific ID
    const addHardcodedCategory = async () => {
        if (firestore) {
            const categoryRef = doc(firestore, 'categories', 'hardcoded-category-id');
            await setDoc(categoryRef, { name: 'Hardcoded Category' });
            alert('Hardcoded category added!');
        }
    };

    // Add a new product with a specific ID
    const addProduct = async () => {
        if (firestore) {
            const categoryRef = doc(firestore, 'categories', categoryId); // Match categoryId with category.id
            const productRef = doc(firestore, 'products', productId); // Use productId as the document ID
            await setDoc(productRef, {
                name: productName,
                location: productLocation,
                pictures: productPictures,
                categoryId: categoryRef,
            });
            alert('Product added!');
        }
    };

    // Add hardcoded product with a specific ID
    const addHardcodedProduct = async () => {
        if (firestore) {
            const categoryRef = doc(firestore, 'categories', 'hardcoded-category-id');
            const productRef = doc(firestore, 'products', 'hardcoded-product-id');
            await setDoc(productRef, {
                name: 'Hardcoded Product',
                location: 'Hardcoded Location',
                pictures: ['hardcoded-picture1.jpg', 'hardcoded-picture2.jpg'],
                categoryId: categoryRef,
            });
            alert('Hardcoded product added!');
        }
    };

    // Add a new reservation with product and userId inputs
    const addReservation = async () => {
        if (firestore) {
            const productRef = doc(firestore, 'products', productName); // Use productName as product ID
            const userId = currentUser?.uid || 'unknown-user-id'; // Use current user ID or fallback
            await addDoc(collection(firestore, 'reservations'), {
                productId: productRef,
                userId: userId,
                from: new Date(reservationFrom),
                to: new Date(reservationTo),
            });
            alert('Reservation added!');
        }
    };

    // Add hardcoded reservation
    const addHardcodedReservation = async () => {
        if (firestore && currentUser) {
            const productRef = doc(firestore, 'products', 'hardcoded-product-id'); // Replace with actual product ID
            await addDoc(collection(firestore, 'reservations'), {
                productId: productRef,
                userId: currentUser.uid,
                from: new Date(),
                to: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // 1 day later
            });
            alert('Hardcoded reservation added!');
        }
    };

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
                            <strong>From:</strong> {reservation.from?.seconds ? new Date(reservation.from.seconds * 1000).toLocaleString() : 'N/A'} <br />
                            <strong>To:</strong> {reservation.to?.seconds ? new Date(reservation.to.seconds * 1000).toLocaleString() : 'N/A'} <br />
                            <strong>Product Reference:</strong> {reservation.productId?.id || 'N/A'}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No reservations found.</p>
            )}

            {/* Form for adding a category */}
            <div className="mt-4">
                <h3>Add Category</h3>
                <input
                    type="text"
                    placeholder="Category ID"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="form-control mb-2"
                />
                <input
                    type="text"
                    placeholder="Category Name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="form-control mb-2"
                />
                <button onClick={addCategory} className="btn btn-primary me-2">Add Category</button>
                <button onClick={addHardcodedCategory} className="btn btn-secondary">Add Hardcoded Category</button>
            </div>

            {/* Form for adding a product */}
            <div className="mt-4">
                <h3>Add Product</h3>
                <input
                    type="text"
                    placeholder="Product ID"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="form-control mb-2"
                />
                <input
                    type="text"
                    placeholder="Product Name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="form-control mb-2"
                />
                <input
                    type="text"
                    placeholder="Product Location"
                    value={productLocation}
                    onChange={(e) => setProductLocation(e.target.value)}
                    className="form-control mb-2"
                />
                <input
                    type="text"
                    placeholder="Product Pictures (comma-separated)"
                    value={productPictures.join(',')}
                    onChange={(e) => setProductPictures(e.target.value.split(','))}
                    className="form-control mb-2"
                />
                <input
                    type="text"
                    placeholder="Category ID"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="form-control mb-2"
                />
                <button onClick={addProduct} className="btn btn-primary me-2">Add Product</button>
                <button onClick={addHardcodedProduct} className="btn btn-secondary">Add Hardcoded Product</button>
            </div>

            {/* Form for adding a reservation */}
            <div className="mt-4">
                <h3>Add Reservation</h3>
                <input
                    type="text"
                    placeholder="Product ID"
                    value={productName} // Use productName as product ID
                    onChange={(e) => setProductName(e.target.value)}
                    className="form-control mb-2"
                />
                <input
                    type="text"
                    placeholder="User ID"
                    value={currentUser?.uid || ''} // Use current user ID
                    onChange={(e) => console.log('User ID is hardcoded for one button')}
                    className="form-control mb-2"
                />
                <input
                    type="datetime-local"
                    placeholder="From"
                    value={reservationFrom}
                    onChange={(e) => setReservationFrom(e.target.value)}
                    className="form-control mb-2"
                />
                <input
                    type="datetime-local"
                    placeholder="To"
                    value={reservationTo}
                    onChange={(e) => setReservationTo(e.target.value)}
                    className="form-control mb-2"
                />
                <button onClick={addReservation} className="btn btn-primary me-2">Add Reservation</button>
                <button onClick={addHardcodedReservation} className="btn btn-secondary">Add Hardcoded Reservation</button>
            </div>
        </div>
    );
};

export default Home;