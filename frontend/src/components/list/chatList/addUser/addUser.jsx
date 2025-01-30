import "./addUser.css";

import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";
import axios from "axios";
import { STATIC_BASE } from "../../../../lib/config";
import { useNavigate } from "react-router-dom";

const AddUser = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);

  const { currentUser } = useUserStore();
  const [isSlidingRight, setIsSlidingRight] = useState(false);

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
    setIsSlidingRight(true);

    try {
      const _ = await axios.post("/user-chats", { receiverId: user.id });
    } catch (err) {
      console.log(err);
      if (err.response.status === 401) {
        navigate("/Login");
      }
    }
  };

  return (
    <div className={`addUser ${isSlidingRight ? 'slide-right' : ''}`}>
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || `${STATIC_BASE}/avatar.png`} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
