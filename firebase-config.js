// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDTV-5AxanDsPq0q8E42cj2qHHmKHTBmAU",
    authDomain: "engagewise-66239.firebaseapp.com",
    projectId: "engagewise-66239",
    storageBucket: "engagewise-66239.firebasestorage.app",
    messagingSenderId: "13190180128",
    appId: "1:13190180128:web:2cab53c99faed14bddfb45",
    measurementId: "G-N8M0MTJZCE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Auth
const auth = firebase.auth();
auth.useDeviceLanguage();

// Debug initialization
console.log('Firebase initialized successfully');
console.log('Auth initialized:', !!auth); 