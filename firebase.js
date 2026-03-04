import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4IahzztFjZKZm4D4qpXuSEJqa_4A3bNU",
  authDomain: "qmap-2026.firebaseapp.com",
  projectId: "qmap-2026",
  storageBucket: "qmap-2026.firebasestorage.app",
  messagingSenderId: "257863222905",
  appId: "1:257863222905:web:ed20ebe061bbbe382e76a8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
