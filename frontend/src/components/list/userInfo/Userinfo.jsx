import "./userInfo.css"
import { useUserStore } from "../../../lib/userStore";
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL, STATIC_BASE } from "../../../lib/config";

const Userinfo = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  return (
    <div className='userInfo'>
      {/* <div className="user"> */}
      {/* <img src={`${BACKEND_URL}/profile-image` || `${STATIC_BASE}/avatar.png`} alt="" /> */}
      {/* <h2>{currentUser.username}</h2> */}
      <img className="logo" src={`${STATIC_BASE}/OceanSpaceLogo.svg`} alt="" />
      <img className="user_profile "src={`${BACKEND_URL}/profile-image/${currentUser.id}`} alt="" onClick={()=>{navigate('/myprofile', { replace: true })}}/>
        
      {/* </div> */}
      {/* <div className="icons">
        <img src={`${STATIC_BASE}/more.png`} alt="" />
        <img src={`${STATIC_BASE}/video.png`} alt="" />
        <img src={`${STATIC_BASE}/edit.png`} alt="" />
      </div> */}
    </div>
  )
}
export default Userinfo
