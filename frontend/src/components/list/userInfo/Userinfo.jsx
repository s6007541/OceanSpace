import "./userInfo.css"
import { useUserStore } from "../../../lib/userStore";
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from "../../../lib/config";

const Userinfo = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  return (
    <div className='userInfo'>
      {/* <div className="user"> */}
      {/* <img src={`${BACKEND_URL}/profile-image` || "./avatar.png"} alt="" /> */}
      {/* <h2>{currentUser.username}</h2> */}
      <img src={"./avatar.png"} alt="" />
      <img src={`${BACKEND_URL}/profile-image/${currentUser.id}`} alt="" onClick={()=>{navigate('/myprofile', { replace: true })}}/>
        
      {/* </div> */}
      {/* <div className="icons">
        <img src="./more.png" alt="" />
        <img src="./video.png" alt="" />
        <img src="./edit.png" alt="" />
      </div> */}
    </div>
  )
}
export default Userinfo
