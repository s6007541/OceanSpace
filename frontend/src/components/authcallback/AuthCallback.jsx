import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../provider/AuthProvider';
import { toast } from "react-toastify";

const AuthCallback = () => {
  const location = useLocation();
  const { setToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      setToken(token);
      toast.success("ยินดีต้อนรับสู่ Ocean Space!");
      navigate("/");
      navigate("0")
    } else {
      navigate("/Login");
    }
  }, [location]);

  return <div className="loading">Loading...</div>;
};

export default AuthCallback;