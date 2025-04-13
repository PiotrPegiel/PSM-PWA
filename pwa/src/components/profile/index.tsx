import React, { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useFirebase } from "../../contexts/FirebaseContext";
import Header from "../header";

const UserProfile: React.FC = () => {
  const { currentUser } = useFirebase() || {};
  const [email, setEmail] = useState(currentUser?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [editMode, setEditMode] = useState<boolean>();

  const handleUpdate = async () => {
    try {
      if (currentUser) {
        // Update password
        if (password) {
            if (currentUser.email) {
              await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, oldPassword)).then(() => {
                updatePassword(currentUser, password).then(() => {
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
    <div className="flex flex-col items-center min-h-screen mt-10">
      <Header />
      <h1 className="text-2xl font-bold">User Profile</h1>
      <div className="bg-white p-6 rounded-lg">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mb-2">
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
          {!editMode && (
            <p className="text-gray-600 mt-4">{currentUser?.email}</p>
          )}
        </div>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {editMode && (
          <div className="space-y-4">
            <div>
            <input
              type="email"
              placeholder="Current mail@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none"
              disabled={!editMode} 
            />
          </div>
            <div>
              <input
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-[8px] focus:outline-none"
              />
            </div>
          </div>
          )}
          
          {editMode ? (
            <>
              <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-[8px]"
              onClick={() => {
                setEditMode(false);
                handleUpdate();
              }}
            >
              Update
            </button>
            <button
              className="w-full bg-white text-black border-2 border-black py-2 rounded-[8px]"
              onClick={() => {
                setEditMode(false);
              }}
            >
              Cancel
            </button>
            </>
          ):(
            <button
              onClick={() => setEditMode(true)}
              className="w-full bg-black text-white py-2 rounded-[8px]"
            >
              Edit
            </button>
          )
            
          }
          
        </form>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
};

export default UserProfile;