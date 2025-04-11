import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

interface UserRole {
  userId: string;
  email: string;
  name?: string;
  role: string;
}

const UserRoles: React.FC = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="container text-center mt-5">
      <h1>User Roles</h1>
      <ul className="list-group mt-4">
        {users.map((user) => (
          <li key={user.userId} className="list-group-item">
            <strong>User ID:</strong> {user.userId} <br />
            <strong>Email:</strong> {user.email} <br />
            {user.name && (
              <>
                <strong>Name:</strong> {user.name} <br />
              </>
            )}
            <strong>Role:</strong>
            <select
              value={user.role}
              onChange={(e) => handleRoleChange(user.userId, e.target.value)}
              className="form-select mt-2"
            >
              <option value="SuperUser">SuperUser</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserRoles;