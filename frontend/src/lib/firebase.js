import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA7vYcc5gnVAnqIfBOrs2FZe5OFCvma02Y",
  authDomain: "test101-a8370.firebaseapp.com",
  projectId: "test101-a8370",
  storageBucket: "test101-a8370.appspot.com",
  messagingSenderId: "425745785141",
  appId: "1:425745785141:web:b69290aad44b817cdb6c7c",
  measurementId: "G-PPEZBD6D0N"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()