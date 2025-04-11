import React, { useEffect, useState } from 'react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useParams, Link } from 'react-router-dom';

const ProductsByCategory: React.FC = () => {
    const { firestore } = useFirebase() || {};
    const { categoryId } = useParams<{ categoryId: string }>();
    const [products, setProducts] = useState<any[]>([]);
    const [categoryName, setCategoryName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                if (firestore && categoryId) {
                    // Fetch category name
                    const categoryDoc = await getDoc(doc(firestore, 'categories', categoryId));
                    if (categoryDoc.exists()) {
                        setCategoryName(categoryDoc.data().name || 'Unknown Category');
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

    if (loading) {
        return <div>Loading products...</div>;
    }

    return (
        <div className="container text-center mt-5">
            <h1>Products in {categoryName}</h1>
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
