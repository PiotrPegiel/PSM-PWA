import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const Categories: React.FC = () => {
    const { firestore } = useFirebase() || {};
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [newCategoryName, setNewCategoryName] = useState<string>('');

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

    useEffect(() => {
        fetchCategories();
    }, [firestore]);

    const handleAddCategory = async () => {
        if (firestore && newCategoryName.trim()) {
            try {
                const categoriesRef = collection(firestore, 'categories');
                await addDoc(categoriesRef, { name: newCategoryName });
                setNewCategoryName('');
                setShowModal(false);
                alert('Category added successfully!');
                fetchCategories(); // Refresh the category list
            } catch (error) {
                console.error('Error adding category:', error);
            }
        }
    };

    if (loading) {
        return <div className="text-center mt-10">Loading categories...</div>;
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-12 pt-16">
            <h1 className="text-xl font-bold mb-6">Categories</h1>
            {categories.length > 0 ? (
                <ul className="w-full max-w-md space-y-4">
                    {categories.map(category => (
                        <li
                            key={category.id}
                            className="w-full max-w-md flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-white shadow-sm"
                        >
                            <Link
                                to={`/categories/${category.id}`}
                                className="text-lg font-medium text-black"
                            >
                                {category.name}
                            </Link>

                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No categories found.</p>
            )}
            <button
                className="w-full max-w-md mt-6 py-3 text-white bg-black rounded-lg text-lg font-medium hover:bg-gray-800"
                onClick={() => setShowModal(true)}
            >
                Add
            </button>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="p-4 border-b">
                            <h5 className="text-lg font-bold">Add New Category</h5>
                        </div>
                        <div className="p-4">
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Category Name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end p-4 border-t space-x-2">
                            <button
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </button>
                            <button
                                className="px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-800"
                                onClick={handleAddCategory}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;