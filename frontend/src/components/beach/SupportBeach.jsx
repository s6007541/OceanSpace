import "./supportbeach.css";
import { STATIC_BASE } from "../../lib/config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";
import { supportive_text } from "./supportive_text"; // Import the list here
import {isMobile} from 'react-device-detect';

const FloatingImage = ({ sendUnrolling, id, show}) => {
  const [x, setX] = useState(-1);
  const [y, setY] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const imageRef = useRef(null);
  const [bottlesize, setBottlesize] = useState(0);
  const [bottleid, setBottleid] = useState(0);

  useEffect(() => {
    const maxX = window.innerWidth - (imageRef.current?.width || 50);
    const maxY = window.innerHeight;

    setX((Math.random() * maxX * 0.8) + (0.1 * maxX));
    const y_ = (Math.random() * maxY * 0.05) + (maxY * 0.1 * (id + 1))
    setY(y_);

    setRotation(Math.random() * 60 - 30);

    const bottle_id = Math.floor(Math.random() * 2) + 1;
    setBottleid(bottle_id);

    const img = new Image();
    img.onload = () => {
      const bottlesize_ = Math.random() * 75 + 50
      setBottlesize(bottlesize_)
      const originalHeight = bottlesize_;
      
      
      // Calculate rotated height (approximation)
      const radians = Math.abs(rotation) * Math.PI / 180;
      const rotatedHeight = originalHeight * Math.cos(radians) + img.width * Math.sin(radians);

      const minCropHeight = rotatedHeight * 0.3; // 30% of rotated height
      const maxCropHeight = rotatedHeight * 0.9; // 90% of rotated height
      
      setCropHeight(Math.random() * (maxCropHeight - minCropHeight) + minCropHeight);
    };
    img.src = `${STATIC_BASE}/bottle${bottle_id}.png`;
    
    const float = () => {
      const amplitude = Math.random() * 20 + 10;
      const frequency = 1/6;

      let startTime = null;

      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime + (Math.random() * 2000) - 1000;
        const timeElapsed = (currentTime - startTime) / 1000;

        const offsetY = Math.sin(timeElapsed * frequency * 2 * Math.PI) * amplitude;
        setY(y_ + offsetY);

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    };

    float();
  }, []);

  const handleClick = () => {
    sendUnrolling(id);
    setIsVisible(false); // Hide the bottle

  };

  return (
      <div className="floating-object-outer" style={{opacity: show ? 1 : 0}}>
        {isVisible ? 
        <div
          className="floating-bottle"
          style={{
            position: 'absolute',
            top: 0,
            left: x,
            transform: `translateY(${y}px) rotate(${rotation}deg)`,
            width: 'auto',
            height: cropHeight,
            overflow: 'hidden',
          }}>
          <img
            ref={imageRef}
            src={`${STATIC_BASE}/bottle${bottleid}.png`}
            alt="Floating Image"
            onClick={handleClick}
            style={{
              // width: '100%',
              height: bottlesize,
              display: 'block',
            }}/>
        </div> : <></>}
        
      </div>
  );
};

const SupportBeach = () => {
  const navigate = useNavigate(); 
  
  const [selectedid, setselectedid] = useState([]);
  const [isShowingScroll, setIsShowingScroll] = useState(false);
  const [idxs, setIdxs] = useState([]);
  const [idx, setIdx] = useState(null);
  const handleUnrollFromChild = (x) => {
    setselectedid([...selectedid, x]);
    setIsShowingScroll(true);
    if (idxs.length === 0) {
      let numbers = new Set();

      while (numbers.size < 5) {
        let randomNumber = Math.floor(Math.random() * supportive_text.length);
        numbers.add(randomNumber);
      }
      let arr = Array.from(numbers)
      setIdxs(arr);
      setIdx(arr[x])
    }
    else {
      setIdx(idxs[x])
    }
    
     // Update parent state with the data from child
  };
  const goback = () =>{ 
    if (isShowingScroll) {
      setIsShowingScroll(false);
    }
    else {
      exitFullscreen()
      let path = `/`; 
      navigate(path);
    }
  }
  // Function to request fullscreen
  const enterFullscreen = () => {
    if (!isMobile) {
      return ;
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
      return ;
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
  return (
    <div className="supportbeach">
      <img className="supportgoback" src={`${STATIC_BASE}/cross_white.svg`} onClick={goback}/>
      <div className="supportbeach__waves" />
      <div className="supportbeach__sand supportbeach__sand--background" />
      <div className="supportbeach__sand supportbeach__sand--foreground" />
      {[0, 1, 2, 3, 4].map((id) => (
          <FloatingImage 
            key={id} 
            id={id} 
            sendUnrolling={handleUnrollFromChild} 
            show={!isShowingScroll && !(selectedid.includes(id))}
          />
      ))}

      <img
        src={`${STATIC_BASE}/paper-scroll.png`}
        className={`magic-scroll ${(isShowingScroll) ? "visible" : ""}`}/>

      <div className={`paper-scroll-text ${(isShowingScroll) ? "visible" : ""}`}>{supportive_text[idx]}</div>

      <p className="support-bottom-text">
        ทะเลเขียนจดหมายมาให้<br/>ลองหยิบมาอ่านดูนะ
      </p>
    </div>

  );
};

export default SupportBeach;
