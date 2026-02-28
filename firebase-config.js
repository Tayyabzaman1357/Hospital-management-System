// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjRpHEYPn529KJXbhAHEaztHThqLrIZYc",
  authDomain: "health-9b03f.firebaseapp.com",
  projectId: "health-9b03f",
  storageBucket: "health-9b03f.firebasestorage.app",
  messagingSenderId: "112496956645",
  appId: "1:112496956645:web:442db267324b8a0f86b00c",
  measurementId: "G-G05EZTP09H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export Firebase services
export { auth, db, storage, app };

// Export Firestore functions
export { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  setDoc
};

// Export Storage functions
export { ref, uploadBytes, getDownloadURL };
