import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'
import { doSignOut } from '../../firebase/auth'

const Header = () => {
    const navigate = useNavigate()
    const { userLoggedIn } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = () => {
        doSignOut().then(() => {
            navigate('/login')
        })
    }

    return (
        <nav className='flex flex-row w-full z-20 fixed top-0 left-0 h-12 border-b items-center bg-gray-200 px-4'>
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className='text-lg font-bold ml-auto'
            >
                ☰
            </button>
            {menuOpen && (
                <div className='absolute top-12 right-0 w-full bg-white shadow-md'>
                    <ul className='flex flex-col items-start p-2'>
                        <li className='py-1'>
                            <Link to='/' className='text-sm text-blue-600'>Home</Link>
                        </li>
                        {userLoggedIn && (
                            <>
                                <li className='py-1'>
                                    <Link to='/profile' className='text-sm text-blue-600'>Profile</Link>
                                </li>
                                <li className='py-1'>
                                    <Link to='/history' className='text-sm text-blue-600'>history</Link>
                                </li>
                                <li className='py-1'>
                                    <button
                                        onClick={handleLogout}
                                        className='text-sm text-blue-600 underline'
                                    >
                                        Logout
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            )}
        </nav>
    )
}

export default Header