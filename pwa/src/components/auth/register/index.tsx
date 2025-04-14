import React, { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/authContext'
import { doCreateUserWithEmailAndPassword } from '../../../firebase/auth'

const SnackBar: React.FC<{ message: string; type: "success" | "error"; onClose: () => void }> = ({ message, type, onClose }) => {
    const [visible, setVisible] = useState(false);

    React.useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded text-white flex justify-between items-center transition-transform duration-300 ${
                visible ? "translate-y-0" : "translate-y-full"
            } ${type === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
            <span>{message}</span>
            <button className="ml-4 text-white" onClick={onClose}>
                <img src="assets/icons/fi-rr-cross.svg" alt="Close" className="w-6 h-6 filter invert" />
            </button>
        </div>
    );
};

const Register = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setconfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [snackBar, setSnackBar] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const { userLoggedIn } = useAuth();

    const onSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setSnackBar({ message: "Passwords do not match.", type: "error" });
            return;
        }
        if (!isRegistering) {
            setIsRegistering(true);
            try {
                await doCreateUserWithEmailAndPassword(email, password);
                setSnackBar({ message: "Registration successful!", type: "success" });
                navigate('/home');
            } catch (error: any) {
                setSnackBar({ message: error.message || "Registration failed.", type: "error" });
            } finally {
                setIsRegistering(false);
            }
        }
    };

    return (
        <>
            {userLoggedIn && <Navigate to={'/home'} replace={true} />}

            <main className="w-full h-screen flex items-center justify-center bg-white">
                <div className="w-full max-w-md p-6">
                    <h1 className="text-[24px] font-semibold text-center mb-8">Rezervix</h1>
                    <h2 className="text-lg font-semibold text-center mb-4">Create a New Account</h2>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="email@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setconfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isRegistering}
                            className={`w-full py-2 text-white font-medium rounded-[8px] ${
                                isRegistering ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
                            }`}
                        >
                            {isRegistering ? 'Signing Up...' : 'Sign Up'}
                        </button>
                    </form>
                    <p className="text-center text-sm mt-4">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-500 hover:underline">
                            Continue
                        </Link>
                    </p>
                </div>
            </main>
            {snackBar && (
                <SnackBar
                    message={snackBar.message}
                    type={snackBar.type}
                    onClose={() => setSnackBar(null)}
                />
            )}
        </>
    );
};

export default Register;