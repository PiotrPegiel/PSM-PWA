import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'
import { doSignOut } from '../../firebase/auth'

const Header = () => {
    const navigate = useNavigate()
    const { userLoggedIn, currentUser } = useAuth()
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
                <div className='absolute top-12 right-0 w-24 bg-white shadow-md h-auto rounded-md'>
                    <ul className='flex flex-col items-center p-2 right-0' >
                        <li className='py-1' >
                            <Link to='/' className='text-sm text-stone-950 no-underline'>Home</Link>
                        </li>
                        <li className='py-1'>
                            <Link to='/profile' className='text-sm text-stone-950 no-underline'>Profile</Link>
                        </li>
                        <li className='py-1'>
                            <Link to='/history' className='text-sm text-stone-950 no-underline'>History</Link>
                        </li>
                        {["Admin", "SuperUser"].includes(currentUser?.role || "") && (
                            <>
                                <li className='py-1'>
                                    <Link to='/categories' className='text-sm text-stone-950 no-underline'>Categories</Link>
                                </li>
                                <li className='py-1'>
                                    <Link to='/user-roles' className='text-sm text-stone-950 no-underline'>User Roles</Link>
                                </li>
                            </>
                        )}
                        <li className='py-1'>
                            <button onClick={handleLogout}className='text-sm text-stone-950'>Logout
                            </button>
                        </li>  
                    </ul>
                </div>
            )}
        </nav>
    )
}

export default Header