import React from 'react';
import { Link } from 'react-router-dom';
import Header from "../header";

const Admin: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            {<Header />}
            <h1 className="text-xl font-bold mb-6">Admin page</h1>
            <div className="space-y-4 w-full max-w-xs">
                <Link
                    to="/categories"
                    className="block w-full py-3 text-center text-lg font-medium text-black border border-black rounded-lg no-underline hover:bg-gray-200"
                >
                    Categories
                </Link>
                <Link
                    to="/user-roles"
                    className="block w-full py-3 text-center text-lg font-medium text-black border border-black rounded-lg no-underline hover:bg-gray-200"
                >
                    Users
                </Link>
            </div>
        </div>
    );
};

export default Admin;