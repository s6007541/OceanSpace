import "./wishbeach.css";
import { STATIC_BASE } from "../../lib/config";
import { useNavigate } from "react-router-dom";

const WishBeach = () => {
  const navigate = useNavigate(); 
  const goback = () =>{ 
    let path = `/`; 
    navigate(path);
  }
  return (
    <div className="wishbeach">
      <img className="goback" src={`${STATIC_BASE}/cross.svg`} onClick={goback}/>
      <div className="wishbeach__waves" />
      <div className="wishbeach__sand wishbeach__sand--background" />
      <div className="wishbeach__sand wishbeach__sand--foreground" />
      {/* <div className="sand" /> */}

    </div>

  );
};

export default WishBeach;
