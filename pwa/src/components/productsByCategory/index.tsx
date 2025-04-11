import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useParams, Link, useNavigate } from 'react-router-dom';

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
        <div className="container text-center mt-5">
            <div className="d-flex justify-content-between align-items-center">
                {editMode ? (
                    <input
                        type="text"
                        className="form-control w-50"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                ) : (
                    <h1>Products in {categoryName}</h1>
                )}
                {editMode ? (
                    <div>
                        <button className="btn btn-success me-2" onClick={handleSaveCategoryName}>
                            Save
                        </button>
                        <button className="btn btn-danger" onClick={handleDeleteCategory}>
                            Delete
                        </button>
                    </div>
                ) : (
                    <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                        Edit
                    </button>
                )}
            </div>
            {products.length > 0 ? (
                <ul className="list-group mt-4">
                    {products.map(product => (
                        <li key={product.id} className="list-group-item">
                            <Link to={`/categories/${categoryId}/products/${product.id}`}>
                                <strong>Name:</strong> {product.name}
                            </Link>
                            <br />
                            <strong>Location:</strong> {product.location?._lat !== undefined && product.location?._long !== undefined
                                ? `Lat: ${product.location._lat}, Long: ${product.location._long}`
                                : typeof product.location === 'string'
                                ? product.location
                                : 'N/A'}
                            <br />
                            <strong>Pictures:</strong> {product.pictures?.join(', ') || 'N/A'}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No products found for this category.</p>
            )}
            <Link to={`/categories/${categoryId}/products/new`} className="btn btn-primary mt-4">
                Add Product
            </Link>
        </div>
    );
};

export default ProductsByCategory;
