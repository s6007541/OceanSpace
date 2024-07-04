import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../provider/AuthProvider';

const AuthCallback = () => {
  const location = useLocation();
  const { setToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      setToken(token);
      navigate("/ChatList");
    } else {
      navigate("/Login");
    }
  }, [location]);

  return <div className="loading">Loading...</div>;
};

export default AuthCallback;