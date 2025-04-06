import React from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home: React.FC = () => {
    return (
        <div className="container text-center mt-5">
            <h1>Welcome to the React Firebase PWA</h1>
            <p className="lead">This is the landing page of the application.</p>
            <div className="mt-4">
                <Link to="/profile" className="btn btn-primary">Go to Profile</Link>
                <Link to="/login" className="btn btn-secondary ml-2">Login</Link>
            </div>
        </div>
    );
};

export default Home;