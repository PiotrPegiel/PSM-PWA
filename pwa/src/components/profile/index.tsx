import React, { useState } from "react";
import { EmailAuthCredential, EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword, User } from "firebase/auth";
import { useAuth } from "../../contexts/authContext";
import { useFirebase } from "../../contexts/FirebaseContext";

const UserProfile: React.FC = () => {
  const { currentUser } = useFirebase() || {};
  const [email, setEmail] = useState(currentUser?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleUpdate = async () => {
    try {
      if (currentUser) {

        // Update password
        if (password) {
            if (currentUser.email) {
              await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, oldPassword)).then(() => {
                updatePassword(currentUser, password).then(() => {
                  console.log("Password updated successfully!");
                }).catch((error) => {
                  console.error("Error updating password:", error);
                });
              });
            } else {
              throw new Error("User email is null");
            }
        }
        setMessage("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l-9-5m9 5l9-5"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold">User Profile</h2>
          <p className="text-gray-600">{currentUser?.email}</p>
          <p className="text-gray-600">Change Password</p>
        </div>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdate();
          }}
        >
          <div>
            <input
              type="email"
              placeholder="Current mail@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800"
          >
            Update
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
};

export default UserProfile;