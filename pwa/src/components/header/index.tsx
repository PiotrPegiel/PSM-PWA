import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext';
import { doSignOut } from '../../firebase/auth';

const Header = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        doSignOut().then(() => {
            navigate('/login');
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            {/* Desktop Hamburger Menu */}
            <nav className="hidden md:flex items-center justify-between w-full z-20 fixed top-0 left-0 h-12 bg-transparent px-4">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="text-lg font-bold ml-auto"
                >
                    ☰
                </button>
                {menuOpen && (
                    <div
                        ref={menuRef}
                        className="absolute top-12 right-0 w-24 bg-white shadow-md h-auto rounded-md"
                    >
                        <ul className="flex flex-col items-center p-2">
                            <li className="py-1">
                                <Link to="/" className="text-sm text-stone-950 no-underline">Home</Link>
                            </li>
                            <li className="py-1">
                                <Link to="/history" className="text-sm text-stone-950 no-underline">History</Link>
                            </li>
                            {["Admin", "SuperUser"].includes(currentUser?.role || "") && (
                                <li className="py-1">
                                    <Link to="/admin" className="text-sm text-stone-950 no-underline">Admin</Link>
                                </li>
                            )}
                            <li className="py-1">
                                <Link to="/profile" className="text-sm text-stone-950 no-underline">Profile</Link>
                            </li>
                            <li className="py-1">
                                <button onClick={handleLogout} className="text-sm text-stone-950">Logout</button>
                            </li>
                        </ul>
                    </div>
                )}
            </nav>

            {/* Phone/Tablet Bottom Menu */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-white border-t flex justify-around items-center">
                <Link to="/" className="flex flex-col items-center">
                    <img src="/assets/icons/fi-rr-home.svg" alt="Home" className="w-6 h-6" />
                </Link>
                <Link to="/history" className="flex flex-col items-center">
                    <img src="/assets/icons/fi-rr-time-past.svg" alt="History" className="w-6 h-6" />
                </Link>
                {["Admin", "SuperUser"].includes(currentUser?.role || "") && (
                    <Link to="/admin" className="flex flex-col items-center">
                        <img src="/assets/icons/fi-rr-admin-alt.svg" alt="Admin" className="w-6 h-6" />
                    </Link>
                )}
                <Link to="/profile" className="flex flex-col items-center">
                    <img src="/assets/icons/fi-rr-user.svg" alt="Profile" className="w-6 h-6" />
                </Link>
                <button onClick={handleLogout} className="flex flex-col items-center">
                    <img src="/assets/icons/fi-rr-exit.svg" alt="Logout" className="w-6 h-6" />
                </button>
            </nav>
        </>
    );
};

export default Header;