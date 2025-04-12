import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';

const ProductsByCategory: React.FC = () => {
    const { firestore } = useFirebase() || {};
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [categoryName, setCategoryName] = useState<string>('');
    const [newCategoryName, setNewCategoryName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [editMode, setEditMode] = useState<boolean>(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                if (firestore && categoryId) {
                    // Fetch category name
                    const categoryDoc = await getDoc(doc(firestore, 'categories', categoryId));
                    if (categoryDoc.exists()) {
                        const name = categoryDoc.data().name || 'Unknown Category';
                        setCategoryName(name);
                        setNewCategoryName(name);
                    }

                    // Fetch products for the category
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
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [firestore, categoryId]);

    const handleSaveCategoryName = async () => {
        if (firestore && categoryId) {
            try {
                const categoryRef = doc(firestore, 'categories', categoryId);
                await updateDoc(categoryRef, { name: newCategoryName });
                setCategoryName(newCategoryName);
                setEditMode(false);
                alert('Category name updated successfully!');
            } catch (error) {
                console.error('Error updating category name:', error);
            }
        }
    };

    const handleDeleteCategory = async () => {
        if (firestore && categoryId) {
            try {
                // Delete all products in the category
                const productsRef = collection(firestore, 'products');
                const q = query(productsRef, where('categoryId', '==', doc(firestore, 'categories', categoryId)));
                const querySnapshot = await getDocs(q);
                const deletePromises = querySnapshot.docs.map(productDoc => deleteDoc(doc(firestore, 'products', productDoc.id)));
                await Promise.all(deletePromises);

                // Delete the category
                const categoryRef = doc(firestore, 'categories', categoryId);
                await deleteDoc(categoryRef);

                alert('Category and its products deleted successfully!');
                navigate('/categories');
            } catch (error) {
                console.error('Error deleting category or products:', error);
            }
        }
    };

    if (loading) {
        return <div>Loading products...</div>;
    }

    return (
        <div className="container mx-auto p-14">
    <div className="flex flex-grow mb-2 items-center">
        {editMode ? (
            <div className="w-full space-y-2">
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <div className="flex space-x-2">
                    <button
                        className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        onClick={handleSaveCategoryName}
                    >
                        Save
                    </button>
                    <button
                        className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        onClick={handleDeleteCategory}
                    >
                        Delete
                    </button>
                </div>
            </div>
        ) : (
            <div className="w-full flex justify-center items-center space-x-4">
                <div className="w-5 h-5"></div>
                <h1 className="text-xl font-bold">{categoryName}</h1>
                <img
                    src="/assets/icons/fi-rr-edit.svg"
                    className="w-5 h-5"
                    onClick={() => setEditMode(true)}
                />
                </div>
        )}
    </div>
    <div className="space-y-4">
        {products.map(product => (
            <div
                key={product.id}
                className="flex justify-center items-center border-2 border-black rounded-[8px] p-2 hover:cursor-pointer"
                onClick = {() => navigate(`/categories/${categoryId}/products/${product.id}`)}
            >
                    <p>{product.name}</p>
            </div>
        ))}
    </div>
    <button
        className="bg-black text-white w-full py-2 mt-4 rounded-[8px]"
        onClick={() => navigate(`/categories/${categoryId}/products/new`)}
    >
        Add
    </button>
</div>
    );
};

export default ProductsByCategory;



