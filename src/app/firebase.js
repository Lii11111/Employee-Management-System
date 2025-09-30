// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA768i5K6aww8iU_sYTWuqbz8miuvatIqg",
  authDomain: "employee-f9adc.firebaseapp.com",
  databaseURL: "https://employee-f9adc-default-rtdb.firebaseio.com",
  projectId: "employee-f9adc",
  storageBucket: "employee-f9adc.firebasestorage.app",
  messagingSenderId: "866863665077",
  appId: "1:866863665077:web:6d72e7b666463905e753fc",
  measurementId: "G-QV6XN883W9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);
export default app;