import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, deleteObject } from 'firebase/storage';

const ProductsByCategory: React.FC = () => {
    const { firestore, storage } = useFirebase() || {};
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

    const handleDeleteProduct = async (productId: string, pictures: string[]) => {
        if (firestore && productId) {
            const confirmDelete = window.confirm('Are you sure you want to delete this product?');
            if (!confirmDelete) return;

            try {
                // Delete all associated pictures from Firebase Storage
                if (pictures && pictures.length > 0) {
                    await Promise.all(
                        pictures.map(async (path) => {
                            const storageRef = ref(storage, path);
                            await deleteObject(storageRef);
                        })
                    );
                }

                // Delete the product document from Firestore
                const productRef = doc(firestore, 'products', productId);
                await deleteDoc(productRef);

                setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId));
                alert('Product and associated pictures deleted successfully!');
            } catch (error) {
                console.error('Error deleting product or pictures:', error);
                alert('Failed to delete product or associated pictures.');
            }
        }
    };

    if (loading) {
        return <div>Loading products...</div>;
    }

    return (
        <div className="container w-full max-w-md pt-8 px-2">
            <div className="w-full flex justify-center items-center space-x-4 mb-6">
                {editMode ? (
                    <div className="w-full flex space-x-5 items-center">
                                                    <button
                            className=""
                            onClick={() => navigate(-1)} 
                            >
                                <img src="/assets/icons/fi-rr-angle-left.svg" alt="Back" className="w-6 h-6" />
                            </button>
                        <input
                            type="text"
                            className="flex-grow border border-gray-300 rounded px-2 py-1"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <div className="flex space-x-5">
                            <img
                                className="w-5 h-5 hover:cursor-pointer"
                                src="/assets/icons/fi-rr-check.svg"
                                onClick={handleSaveCategoryName}
                            />
                            <img
                                className="w-5 h-5 hover:cursor-pointer"
                                src="/assets/icons/fi-rr-cross.svg"
                                onClick={() => setEditMode(false)}
                            />
                        </div>
                    </div>
                ) : (
                        <div className="relative w-full max-w-md">
                            <button
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2"
                            onClick={() => navigate(-1)} 
                            >
                                <img src="/assets/icons/fi-rr-angle-left.svg" alt="Back" className="w-6 h-6" />
                            </button>
                            
                            <h1 className="text-2xl font-bold text-center">{categoryName}</h1>
                            <img
                                src="/assets/icons/fi-rr-edit.svg"
                                className="w-5 h-5 absolute right-0 top-1/2 transform -translate-y-1/2 hover:cursor-pointer"
                                onClick={() => setEditMode(true)}
                            />
                        </div>
                )}
            </div>
            <div className="space-y-4 mt-5">
                {products.map(product => (
                    <div
                        key={product.id}
                        className="flex justify-between items-center border-2 border-black rounded-[8px] p-2 hover:cursor-pointer"
                        onClick={() => navigate(`/categories/${categoryId}/products/${product.id}`)}
                    >
                        <div className="w-5 h-5"></div>
                        <p className='font-semibold'>{product.name}</p>
                        <img
                            src="/assets/icons/fi-rr-trash-xmark.svg"
                            alt="Delete"
                            className="w-5 h-5 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product.id, product.pictures || []);
                            }}
                        />
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

