import React, { useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';

const Profile: React.FC = () => {
    const firebaseContext = useContext(FirebaseContext);

    if (!firebaseContext) {
        throw new Error('FirebaseContext is null. Ensure that FirebaseContext.Provider is wrapping your component tree.');
    }

    const { currentUser, updateUserProfile } = firebaseContext;
    const [displayName, setDisplayName] = React.useState(currentUser?.displayName || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser) {
            updateUserProfile({ displayName });
        }
    };

    return (
        <div className="container mt-5">
            <h2>User Profile</h2>
            {currentUser ? (
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="displayName">Display Name</label>
                        <input
                            type="text"
                            className="form-control"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Update Profile</button>
                </form>
            ) : (
                <p>Please log in to view your profile.</p>
            )}
        </div>
    );
};

export default Profile;