import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useJwtStore } from "../../lib/jwtStore";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const {token, setToken_} = useJwtStore();

  const setToken = (newToken) => {
    setToken_(newToken);
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Memoized value of the authentication context
  const contextValue = useMemo(
    () => ({
      token,
      setToken,
    }),
    [token]
  );

  // Provide the authentication context to the children components
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;