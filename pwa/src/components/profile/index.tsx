import React, { useState, useEffect } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useFirebase } from "../../contexts/FirebaseContext";
import Header from "../header";

const SnackBar: React.FC<{ message: string; type: "success" | "error"; onClose: () => void }> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Trigger slide-in animation

    const timer = setTimeout(() => {
      setVisible(false); // Trigger slide-out animation
      setTimeout(onClose, 300); // Wait for animation to complete before closing
    }, 3000); // Snack bar disappears after 3 seconds

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
        <img src="/assets/icons/fi-rr-cross.svg" alt="Close" className="w-6 h-6 filter invert" />
      </button>
    </div>
  );
};

const UserProfile: React.FC = () => {
  const { currentUser } = useFirebase() || {};
  const [email, setEmail] = useState(currentUser?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [snackBar, setSnackBar] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [editMode, setEditMode] = useState<boolean>();

  const handleUpdate = async () => {
    try {
      if (currentUser) {
        // Update password
        if (password) {
          if (currentUser.email) {
            await reauthenticateWithCredential(
              currentUser,
              EmailAuthProvider.credential(currentUser.email, oldPassword)
            ).then(() => {
              updatePassword(currentUser, password)
                .then(() => {
                  setSnackBar({ message: "Profile updated successfully!", type: "success" });
                })
                .catch((error) => {
                  console.error("Error updating password:", error);
                  setSnackBar({ message: "Failed to update password.", type: "error" });
                });
            });
          } else {
            setSnackBar({ message: "Email is empty", type: "error" });
          }
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackBar({ message: "Failed to update profile. Please try again.", type: "error" });
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
          {!editMode && <p className="text-gray-600 mt-4">{currentUser?.email}</p>}
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
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="w-full bg-black text-white py-2 rounded-[8px]"
            >
              Edit
            </button>
          )}
        </form>
      </div>
      {snackBar && (
        <SnackBar
          message={snackBar.message}
          type={snackBar.type}
          onClose={() => setSnackBar(null)}
        />
      )}
    </div>
  );
};

export default UserProfile;