import "./reliefbeach.css";
import { STATIC_BASE } from "../../lib/config";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';

const ReliefBeach = () => {
  const navigate = useNavigate(); 
  const goback = () =>{ 
    let path = `/`; 
    navigate(path);
  }
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [blurLevel, setBlurLevel] = useState(0);
  const [isVisible, setIsVisible] = useState(true); // Track visibility
  const blurTimerRef = useRef(null); // Ref for the blur timer
  const vanishTimerRef = useRef(null); // Ref for the vanish timer
  const reappearTimerRef = useRef(null); // Ref for the reappear timer

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
    setIsFocused(false);

    blurTimerRef.current = setInterval(() => {
      setBlurLevel((prevBlur) => {
        const newBlur = prevBlur + 1;
        if (newBlur > 3) { // 3 blur steps * 5 seconds = 15 seconds
          clearInterval(blurTimerRef.current);
          vanishTimerRef.current = setTimeout(() => {
            setIsVisible(false); // Hide the text
            reappearTimerRef.current = setTimeout(() => {
              setIsVisible(true); // Show placeholder again
              setBlurLevel(0); // Reset blur
              setText("")
            }, 3000); // 3 seconds delay
          }, 0); // Immediately vanish after max blur
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
    console.log(blurLevel);
    const animation = (blurLevel > 0) ? "seafoam11 6s infinite" : "seafoam1 5s infinite";
    return { animation };
  };

  const getAnimation2 = () => {
    // if (blurLevel === 0) return {};
    console.log(blurLevel);
    const animation = (blurLevel > 0) ? "seafoam22 6s infinite" : "seafoam2 5s infinite";
    return { animation };
  };
  
  return (
    <div className="beach">
      <img className="goback" src={`${STATIC_BASE}/cross.svg`} onClick={goback}/>
      <div className="beach__waves" />
      <div className="beach__sand beach__sand--background" style={getAnimation1()}/>
      <div className="beach__sand beach__sand--foreground" style={getAnimation2()}/>

      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder={isVisible ? "มีอะไรอยากระบาย เขียนที่ชายหาดนี้ได้เลยนะ" : ""} // Show placeholder when visible
        className={`bottom-input ${isFocused ? 'focused' : ''} ${!isVisible ? 'hidden' : ''}`}
        style={getOpacityStyle()}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      

    </div>

  );
};

export default ReliefBeach;
