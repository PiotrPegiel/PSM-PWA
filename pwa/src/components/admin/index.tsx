import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'

const Admin: React.FC = () => {
    const { userLoggedIn, currentUser } = useAuth()

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-8">Admin page</h1>
            <div className="space-y-4 w-full max-w-xs">
                <Link
                    to="/categories"
                    className="block w-full py-4 text-center text-lg font-medium text-black border border-black rounded-lg no-underline hover:bg-gray-200 "
                >
                    Categories
                </Link>
                <Link
                    to="/user-roles"
                    className="block w-full py-4 text-center text-lg font-medium text-black border border-black rounded-lg no-underline hover:bg-gray-200 "
                >
                    Users
                </Link>
            </div>
        </div>
    )
}

export default Admin