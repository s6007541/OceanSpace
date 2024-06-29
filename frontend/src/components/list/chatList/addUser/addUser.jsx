import "./addUser.css";

import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";
import { BACKEND_URL } from "../../../../lib/config";

const AddUser = () => {
  const [user, setUser] = useState(null);

  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const res = await fetch(`${BACKEND_URL}/user-info/name/${username}`, {
        credentials: "include",
      });
      if (res.status === 404) {
        setUser(null);
      }
      if (!res.ok) {
        throw new Error("Unexpected error");
      }
      const user = await res.json();
      setUser(user);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/user-chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: user.id,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to create new chat");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
