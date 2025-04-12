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
        <div className="flex flex-col items-center min-h-screen bg-white p-12 pt-16">
            <div className="relative w-full max-w-md mb-6">
                    <button
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2"
                        onClick={() => navigate(-1)} 
                    >
                        <img src="/assets/icons/fi-rr-angle-left.svg" alt="Back" className="w-6 h-6" />
                    </button>
                <h1 className="text-2xl font-semibold text-center mb-2">New Reservation</h1>
            </div>
                <select
                    id="categorySelect"
                    className="w-full max-w-md border-2 border-black rounded-[8px] bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                >
                    <option value="">Category</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            
                {products.length > 0 ? (
                    <ul className="w-full max-w-md space-y-4 mt-6">
                        {products.map(product => (
                            <li
                                key={product.id}
                                className="w-full max-w-md border-2 border-black rounded-[8px] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleProductClick(product)}
                                style={{ cursor: 'pointer' }}
                            >
                                <p className="text-center font-semibold">{product.name}</p>
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
