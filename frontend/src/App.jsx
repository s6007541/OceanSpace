import { useEffect } from "react";
import Home from "./components/home/Home";
import Chat from "./components/chat/Chat";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Monitor from "./components/monitor/Monitor";
import AddFriend from "./components/addfriend/Addfriend";
import Custom from "./components/custom/Custom";
import Myprofile from "./components/myprofile/Myprofile";
import LLMprofile from "./components/llmprofile/LLMprofile";
import Register from "./components/login/Register";
import Notification from "./components/notification/Notification";
import AuthProvider from "./components/provider/AuthProvider";
import { useUserStore } from "./lib/userStore";
import { useSocket } from "./lib/socket";
import { WEBSOCKET_URL } from "./lib/config";
import { BACKEND_URL } from "./lib/config";

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import axios from "axios";

function authInterceptor(config) {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const App = () => {
  axios.defaults.baseURL = BACKEND_URL;
  axios.defaults.headers.post['Content-Type'] = 'application/json';
  axios.interceptors.request.use(authInterceptor);

  const { currentUser, isLoading, fetchCurrentUserInfo } = useUserStore();
  const { socketConnected, socketConnect } = useSocket();

  useEffect(() => {
    async function initialize() {
      if (currentUser === null || currentUser.id === null) {
        try {
          await fetchCurrentUserInfo();
        } catch {}
        return;
      }

      if (!socketConnected) {
        socketConnect(WEBSOCKET_URL + "/wss");
      }
    }
    initialize();
  }, [currentUser]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <Router>
      <link rel="preconnect" href="https://fonts.googleapis.com"></link>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin></link>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet"></link>
      <link rel="preconnect" href="https://fonts.googleapis.com"></link>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin></link>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@100..900&display=swap" rel="stylesheet"></link>
      <link rel="preconnect" href="https://fonts.googleapis.com"></link>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin></link>
      <link href="https://fonts.googleapis.com/css2?family=Mitr:wght@200;300;400;500;600;700&display=swap" rel="stylesheet"></link>
      {/* <Navbar /> */}
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <div className="container">
              {currentUser ? (
                <Home />
              ) : (
                <Login />
              )}
              <Notification />
            </div>
          } />
          <Route path="/Home" element={
            <div className="container">
              {currentUser ? (
                <Home />
              ) : (
                <Login />
              )}
              <Notification />
            </div>
          } />

          <Route path="/ChatList" element={
            <div className="container">
              {currentUser ? (
                <List />
              ) : (
                <Login />
              )}
              <Notification />
            </div>
          } />

          <Route path="/Chat" element={
            <div className="container">
              {currentUser ? (
                <Chat />
              ) : (
                <Login />
              )}
              <Notification />
            </div>
          } />

          <Route path="/Monitor" element={
            <div className="container">
              {currentUser ? (
                  <Monitor />
              ) : (
                <Login />
              )}
              <Notification />
            </div>
          } />


          <Route path="/Login" element={
            <div className="container">
              <Login />
              <Notification />
            </div>
          } />

          <Route path="/Signup" element={
            <div className="container">
              <Register />
              <Notification />
            </div>
          } />

          <Route path="/AddFriend" element={
            <div className="container">
              {currentUser ? (
                  <AddFriend />
              ) : (
                <Login />
              )}
              <Notification />
            </div>
          } />

          <Route path="/Custom" element={
            <div className="container">
              {currentUser ? (
                  <Custom />
              ) : (
                <Login />
              )}
              <Notification />
            </div>
          } />

          <Route path="/myprofile" element={
            <div className="container">
              {currentUser ? (
                  <Myprofile />
              ) : (
                <Login />
              )}
              <Notification />
            </div>
          } />

          <Route path="/LLMProfile" element={
            <div className="container">
              {currentUser ? (
                  <LLMprofile />
              ) : (
                <Login />
              )}
              <Notification />
            </div>
          } />

          <Route path="/AuthCallback" element={
            <div className="container">
              <AuthCallback />
            </div>
          } />

          <Route path="*" element={
            <div className="container">
              {currentUser ? (
                <Home />
              ) : (
                <Login />
              )}
              <Notification />
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
