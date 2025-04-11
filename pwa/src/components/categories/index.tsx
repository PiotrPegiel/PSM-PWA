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
        return <div>Loading categories...</div>;
    }

    return (
        <div className="container text-center mt-5">
            <h1>Categories</h1>
            {categories.length > 0 ? (
                <ul className="list-group mt-4">
                    {categories.map(category => (
                        <li key={category.id} className="list-group-item">
                            <Link to={`/categories/${category.id}`} className="text-decoration-none">
                                {category.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No categories found.</p>
            )}
            <button
                className="btn btn-primary mt-4"
                onClick={() => setShowModal(true)}
            >
                Add Category
            </button>

            {showModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add New Category</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Category Name"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddCategory}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
