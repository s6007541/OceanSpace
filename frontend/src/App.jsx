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
import Navbar from "./components/navbar/Navbar";

import Register from "./components/login/Register";
import Notification from "./components/notification/Notification";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

const App = () => {
  const { currentUser, isLoading, fetchCurrentUserInfo } = useUserStore()

  useEffect(() => {
    async function initialize() {
      if (currentUser === null || currentUser.id === null) {
        await fetchCurrentUserInfo();
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

            <Route path="/llmprofile" element={
              <div className="container">
                {currentUser ? (
                    <LLMprofile />
                ) : (
                  <Login />
                )}
                <Notification />
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
    </Router>
  );
};

export default App;
