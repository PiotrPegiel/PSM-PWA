import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const NewReservation: React.FC = () => {
    const { firestore, currentUser } = useFirebase() || {};
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                if (firestore) {
                    const categoriesRef = collection(firestore, 'categories');
                    const querySnapshot = await getDocs(categoriesRef);
                    const allCategories = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setCategories(allCategories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [firestore]);

    const fetchProducts = async (categoryId: string) => {
        try {
            if (firestore) {
                const productsRef = collection(firestore, 'products');
                const q = query(productsRef, where('categoryId', '==', doc(firestore, 'categories', categoryId)));
                const querySnapshot = await getDocs(q);
                const allProducts = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setProducts(allProducts);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const categoryId = e.target.value;
        setSelectedCategory(categoryId);
        fetchProducts(categoryId);
    };

    const handleProductClick = async (product: any) => {
        if (!currentUser) {
            alert("User not authenticated.");
            return;
        }

        try {
            // Fetch product details
            const productRef = doc(firestore, 'products', product.id);
            const productDoc = await getDoc(productRef);
            if (productDoc.exists()) {
                const productData = productDoc.data();

                // Prepare the new reservation object
                const newReservation = {
                    userId: currentUser.uid,
                    productId: product.id,
                    productName: productData.name || 'N/A',
                    productLocation: productData.location || 'N/A',
                    productPictures: productData.pictures || [],
                    from: '',
                    to: '',
                };

                navigate(`/reservations/new`, { state: { reservation: newReservation } });
            } else {
                alert("Product details not found.");
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
            alert("Failed to fetch product details.");
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container text-center mt-5">
            <h1>Create New Reservation</h1>
            <div className="form-group mt-4">
                <label htmlFor="categorySelect">Select Category:</label>
                <select
                    id="categorySelect"
                    className="form-control"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                >
                    <option value="">-- Select a Category --</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mt-4">
                <h3>Products</h3>
                {products.length > 0 ? (
                    <ul className="list-group">
                        {products.map(product => (
                            <li
                                key={product.id}
                                className="list-group-item"
                                onClick={() => handleProductClick(product)}
                                style={{ cursor: 'pointer' }}
                            >
                                {product.name}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>{selectedCategory ? 'No products available for this category.' : 'Please select a category.'}</p>
                )}
            </div>
        </div>
    );
};

export default NewReservation;
