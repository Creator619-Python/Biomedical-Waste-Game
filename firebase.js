// Firebase SDK (Module imports)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBoVl_bc3V-DzSzza-1Ymuh13FROKaLxAM",
    authDomain: "biomedicalwastegame.firebaseapp.com",
    projectId: "biomedicalwastegame",
    storageBucket: "biomedicalwastegame.firebasestorage.app",
    messagingSenderId: "502355834534",
    appId: "1:502355834534:web:e7cd3369f7a4b174f3e667",
    measurementId: "G-BBXXM9BXFM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Save score to Firestore
export async function saveScore(name, score) {
    try {
        await addDoc(collection(db, "leaderboard"), {
            name: name,
            score: score,
            createdAt: serverTimestamp()
        });
        return true;
    } catch (err) {
        console.error("Error saving score:", err);
        return false;
    }
}
