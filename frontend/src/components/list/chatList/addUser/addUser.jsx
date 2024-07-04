import "./addUser.css";

import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";
import axios from "axios";

const AddUser = () => {
  const [user, setUser] = useState(null);

  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    let res;
    try {
      res = await axios.get(`/user-info/name/${username}`)
    } catch (err) {
      if (err.response.status === 404) {
        setUser(null);
      }
    }

    try {
      if (res.status !== 200) {
        throw new Error("Unexpected error");
      }
      const user = res.data;
      setUser(user);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = async () => {
    try {
      const _ = await axios.post("/user-chats", { receiverId: user.id });
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
