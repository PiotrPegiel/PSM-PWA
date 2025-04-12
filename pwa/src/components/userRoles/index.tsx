import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";
import Header from "../header";
import { useNavigate } from "react-router-dom";

interface UserRole {
  userId: string;
  email: string;
  name?: string;
  role: string;
}

const UserRoles: React.FC = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); 
  

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const userRolesRef = collection(firestore, "userRoles");
        const querySnapshot = await getDocs(userRolesRef);
        const roles = querySnapshot.docs.map((doc) => doc.data() as UserRole);
        setUsers(roles);
      } catch (error) {
        console.error("Error fetching user roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const userDocRef = doc(firestore, "userRoles", userId);
      await updateDoc(userDocRef, { role: newRole });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-12">
      {<Header />}
      <div className="relative w-full max-w-md mb-6">
                <button
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2"
                    onClick={() => navigate(-1)} 
                >
                    <img src="/assets/icons/fi-rr-angle-left.svg" alt="Back" className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-center">Users</h1>
            </div>
      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.userId}
            className="border rounded-lg p-4 border bg-white"
          >
            <p className="text-sm font-medium">
              <strong>User ID:</strong> {user.userId}
            </p>
            <p className="text-sm font-medium">
              <strong>Email:</strong> {user.email}
            </p>
            {user.name && (
              <p className="text-sm font-medium">
                <strong>Name:</strong> {user.name}
              </p>
            )}
            <div className="mt-4">
              <label
                htmlFor={`role-${user.userId}`}
                className="block text-sm font-medium"
              >
                Role:
              </label>
              <select
                id={`role-${user.userId}`}
                value={user.role}
                onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="SuperUser">SuperUser</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserRoles;