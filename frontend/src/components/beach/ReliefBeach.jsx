import "./reliefbeach.css";
import { STATIC_BASE } from "../../lib/config";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import {isMobile} from 'react-device-detect';

const ReliefBeach = () => {
  const navigate = useNavigate(); 
  const goback = () =>{ 
    exitFullscreen();
    let path = `/`; 
    navigate(path);
  }
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [blurLevel, setBlurLevel] = useState(0);
  const [isVisible, setIsVisible] = useState(true); // Track visibility
  const [showAnswer, setshowAnswer] = useState(false); // Track visibility
  const blurTimerRef = useRef(null); // Ref for the blur timer
  const vanishTimerRef = useRef(null); // Ref for the vanish timer
  const reappearTimerRef = useRef(null); // Ref for the reappear timer

  // Function to request fullscreen
  const enterFullscreen = () => {
    if (!isMobile) {
      return;
    }
    const elem = document.documentElement; // Get the entire document (html)

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
      elem.msRequestFullscreen();
    }
  };

  // Function to exit fullscreen
  const exitFullscreen = () => {
    if (!isMobile) {
      return;
    }
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { // Firefox
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { // Chrome, Safari
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge
      document.msExitFullscreen();
    }
  };

  useEffect(() => {
    enterFullscreen();
  }, []);

  const handleChange = (event) => {
    setText(event.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    clearInterval(blurTimerRef.current); // Stop blur timer on focus
    clearTimeout(vanishTimerRef.current); // Clear vanish timer
    clearTimeout(reappearTimerRef.current); // Clear reappear timer
    setBlurLevel(0); // Reset blur
    setIsVisible(true); // Ensure it's visible
  };

  const handleBlur = () => {
    if (text === ''){
      return;
    }
    setIsFocused(false);

    blurTimerRef.current = setInterval(() => {
      setBlurLevel((prevBlur) => {
        const newBlur = prevBlur + 1;
        if (newBlur > 2) { // 3 blur steps * 5 seconds = 15 seconds
          clearInterval(blurTimerRef.current);
          vanishTimerRef.current = setTimeout(() => {
            setIsVisible(false); // Hide the text
            setshowAnswer(true)
            reappearTimerRef.current = setTimeout(() => {
              setIsVisible(true); // Show placeholder again
              setBlurLevel(0); // Reset blur
              setText("")
              setshowAnswer(false)
            }, 15000); // 3 seconds delay
          }, 5000); // Immediately vanish after max blur
          return 3; // Keep blur at max
        }
        return newBlur;
      });
    }, 8000); // 5 seconds interval
  };

  const getOpacityStyle = () => {
    if (blurLevel === 0) return {};
    const opacity = Math.max(0, 1 - blurLevel * 0.33); // Adjust 0.33 for opacity steps
    return { opacity };
  };

  const getAnimation1 = () => {
    // if (blurLevel === 0) return {};
    const animation = (blurLevel > 0) ? "seafoam11 6s infinite" : "seafoam1 6s infinite";
    return { animation };
  };

  const getAnimation2 = () => {
    // if (blurLevel === 0) return {};
    const animation = (blurLevel > 0) ? "seafoam22 6s infinite" : "seafoam2 6s infinite";
    return { animation };
  };
  
  return (
    <div className="beach" onClick={enterFullscreen}>
      {showAnswer  ?
      <div className="top-center-text">
        ทะเลได้ยินเสียง<br/>ของเธอแล้ว<br/>วันนี้เธอเก่งมากแล้วนะ
      </div> : <></>}
      <img className="goback" src={`${STATIC_BASE}/cross.svg`} onClick={goback}/>
      <div className="beach__waves" />
      <div className="beach__sand beach__sand--background" style={getAnimation1()}/>
      <div className="beach__sand beach__sand--foreground" style={getAnimation2()}/>

      <textarea
        type="text"
        value={text}
        onClick={exitFullscreen}
        onChange={handleChange}
        placeholder={isVisible ? "มีอะไรอยากระบาย\nเขียนที่ชายหาดนี้ได้เลยนะ" : ""} // Show placeholder when visible
        className={`bottom-input ${isFocused ? 'focused' : ''} ${!isVisible ? 'hidden' : ''}`}
        style={getOpacityStyle()}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      

    </div>

  );
};

export default ReliefBeach;
