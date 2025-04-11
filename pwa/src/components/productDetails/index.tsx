import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirebase } from '../../contexts/FirebaseContext';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const ProductDetails: React.FC = () => {
    const { firestore } = useFirebase() || {};
    const { productId, categoryId } = useParams<{ productId: string; categoryId: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<any>({});
    const [editMode, setEditMode] = useState<boolean>(!productId); // Start in edit mode if productId is not provided
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchProduct = async () => {
            if (firestore && productId) {
                const productRef = doc(firestore, 'products', productId);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                    setProduct(productDoc.data());
                }
            }
            setLoading(false);
        };

        if (productId) {
            fetchProduct();
        } else {
            setLoading(false);
        }
    }, [firestore, productId]);

    const handleSave = async () => {
        if (firestore) {
            const productRef = productId
                ? doc(firestore, 'products', productId)
                : doc(firestore, 'products', `${Date.now()}`); // Generate a new ID for new products
            await setDoc(productRef, {
                ...product,
                categoryId: doc(firestore, 'categories', categoryId || ''),
            });
            alert('Product saved successfully!');
            navigate(`/categories/${categoryId}`);
        }
    };

    const handleDelete = async () => {
        if (firestore && productId) {
            const productRef = doc(firestore, 'products', productId);
            await deleteDoc(productRef);
            alert('Product deleted successfully!');
            navigate(`/categories/${categoryId}`);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container text-center mt-5">
            <h1>{editMode ? 'Edit Product' : 'Product Details'}</h1>
            <div className="form-group">
                <label>Name:</label>
                {editMode ? (
                    <input
                        type="text"
                        className="form-control"
                        value={product.name || ''}
                        onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    />
                ) : (
                    <p>{product.name}</p>
                )}
            </div>
            <div className="form-group">
                <label>Location:</label>
                {editMode ? (
                    <input
                        type="text"
                        className="form-control"
                        value={
                            product.location?._lat !== undefined && product.location?._long !== undefined
                                ? `Lat: ${product.location._lat}, Long: ${product.location._long}`
                                : product.location || ''
                        }
                        onChange={(e) => setProduct({ ...product, location: e.target.value })}
                    />
                ) : (
                    <p>
                        {product.location?._lat !== undefined && product.location?._long !== undefined
                            ? `Lat: ${product.location._lat}, Long: ${product.location._long}`
                            : product.location || 'N/A'}
                    </p>
                )}
            </div>
            <div className="form-group">
                <label>Pictures:</label>
                {editMode ? (
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Comma-separated URLs"
                        value={product.pictures?.join(',') || ''}
                        onChange={(e) =>
                            setProduct({ ...product, pictures: e.target.value.split(',') })
                        }
                    />
                ) : (
                    <div>
                        {product.pictures?.map((url: string, index: number) => (
                            <img key={index} src={url} alt={`Product ${index}`} className="img-thumbnail" />
                        ))}
                    </div>
                )}
            </div>
            {editMode ? (
                <button className="btn btn-success mt-3" onClick={handleSave}>
                    Save
                </button>
            ) : (
                <div className="mt-3">
                    <button className="btn btn-primary me-2" onClick={() => setEditMode(true)}>
                        Edit
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
