import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

const SnackBar: React.FC<{ message: string; type: "success" | "error"; onClose: () => void }> = ({ message, type, onClose }) => {
    const [visible, setVisible] = useState(false);
  
    useEffect(() => {
      setVisible(true); // Trigger slide-in animation
  
      const timer = setTimeout(() => {
        setVisible(false); // Trigger slide-out animation
        setTimeout(onClose, 300); // Wait for animation to complete before closing
      }, 3000); // Snack bar disappears after 3 seconds
  
      return () => clearTimeout(timer);
    }, [onClose]);
  
    return (
      <div
        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded text-white flex justify-between items-center transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        } ${type === "success" ? "bg-green-500" : "bg-red-500"}`}
      >
        <span>{message}</span>
        <button className="ml-4 text-white" onClick={onClose}>
          <img src="assets/icons/fi-rr-cross.svg" alt="Close" className="w-6 h-6 filter invert" />
        </button>
      </div>
    );
  };

const Categories: React.FC = () => {
    const { firestore, storage } = useFirebase() || {};
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [newCategoryName, setNewCategoryName] = useState<string>('');
    const [snackBar, setSnackBar] = useState<{ message: string; type: "success" | "error" } | null>(null);    
    

    const navigate = useNavigate(); 

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
                setSnackBar({ message: "Category added successfully!", type: "success" });
                fetchCategories(); // Refresh the category list
            } catch (error) {
                console.error('Error adding category:', error);
            }
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (firestore && categoryId) {
            const confirmDelete = window.confirm('Are you sure you want to delete this category and all its products?');
            if (!confirmDelete) return;

            try {
                // Delete all products in the category
                const productsRef = collection(firestore, 'products');
                const q = query(productsRef, where('categoryId', '==', doc(firestore, 'categories', categoryId)));
                const querySnapshot = await getDocs(q);

                const deletePromises = querySnapshot.docs.map(async (productDoc) => {
                    const productData = productDoc.data();

                    // Delete associated pictures from Firebase Storage
                    if (productData.pictures && productData.pictures.length > 0) {
                        await Promise.all(
                            productData.pictures.map(async (path: string) => {
                                const storageRef = ref(storage, path);
                                await deleteObject(storageRef);
                            })
                        );
                    }

                    // Delete the product document from Firestore
                    return deleteDoc(doc(firestore, 'products', productDoc.id));
                });

                await Promise.all(deletePromises);

                // Delete the category
                const categoryRef = doc(firestore, 'categories', categoryId);
                await deleteDoc(categoryRef);

                setSnackBar({ message: "Category and its products deleted successfully!", type: "success" });
                fetchCategories(); // Refresh the category list
            } catch (error) {
                console.error('Error deleting category or products:', error);
                setSnackBar({ message: "Error deleting category or products", type: "error" });
            }
        }
    };

    if (loading) {
        return <div className="text-center mt-10">Loading categories...</div>;
    }

    return (
        <div className="flex flex-col items-center min-h-screen p-2  ">
            <div className="relative w-full max-w-md mb-6 mt-6">
                <button
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2"
                    onClick={() => navigate(-1)} 
                >
                    <img src="/assets/icons/fi-rr-angle-left.svg" alt="Back" className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-center">Categories</h1>
            </div>
            {categories.length > 0 ? (
                <div className="w-full max-w-md space-y-4">
                    {categories.map(category => (
                        <div
                            key={category.id}
                            className="w-full max-w-md flex justify-between items-center p-4 border-2 border-black rounded-[8px] bg-white hover:cursor-pointer"
                            onClick={() => navigate(`/categories/${category.id}`)}
                        >
                            <p className='font-semibold text-center flex-grow'>{category.name}</p>
                            <img
                                src="/assets/icons/fi-rr-trash-xmark.svg"
                                alt="Delete"
                                className="w-5 h-5 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(category.id);
                                }}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No categories found.</p>
            )}
            <button
                className="w-full max-w-md mt-6 py-3 text-white bg-black rounded-[8px] text-lg font-medium"
                onClick={() => setShowModal(true)}
            >
                Add
            </button>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="px-4 pt-4">
                            <input
                                type="text"
                                className="w-full p-2 border-2 border-black rounded-[8px]"
                                placeholder="Category Name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-row justify-center align-center px-4 pb-4 mt-3 space-x-2">
                            <button
                                className="w-full px-4 py-2 text-white bg-black rounded-[8px]"
                                onClick={handleAddCategory}
                            >
                                Save
                            </button>
                            <button
                                className="w-full px-4 py-2 text-gray-700 border-2 border-black rounded-[8px] font-medium"
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {snackBar && (
                <SnackBar
                message={snackBar.message}
                type={snackBar.type}
                onClose={() => setSnackBar(null)}
                />
            )}
        </div>
    );
};

export default Categories;