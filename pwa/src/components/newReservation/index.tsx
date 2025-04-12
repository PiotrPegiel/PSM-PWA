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
            // Prepare the new reservation object
            const newReservation = {
                userId: currentUser.uid,
                productId: product.id,
                from: '',
                to: '',
            };

            navigate(`/reservations/new`, { state: { reservation: newReservation } });
        } catch (error) {
            console.error("Error preparing reservation:", error);
            alert("Failed to prepare reservation.");
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-12 pt-16">
            <h1 className="text-2xl font-bold text-center mb-2">Create New Reservation</h1>
                <label htmlFor="categorySelect" className="text-xl text-center mb-6">Select Category:</label>
                <select
                    id="categorySelect"
                    className="w-full max-w-md border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            
            
                <h3 className="text-xl text-center mb-2 mt-2">Products</h3>
                {products.length > 0 ? (
                    <ul className="w-full max-w-md space-y-4">
                        {products.map(product => (
                            <li
                                key={product.id}
                                className="w-full max-w-md border rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition"
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
    );
};

export default NewReservation;
