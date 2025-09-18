// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDTV-5AxanDsPq0q8E42cj2qHHmKHTBmAU",
    authDomain: "engagewise-66239.firebaseapp.com",
    projectId: "engagewise-66239",
    storageBucket: "engagewise-66239.appspot.com", // Fixed storage bucket URL
    messagingSenderId: "13190180128",
    appId: "1:13190180128:web:2cab53c99faed14bddfb45",
    measurementId: "G-N8M0MTJZCE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Auth
const auth = firebase.auth();
auth.useDeviceLanguage();

// Initialize Firestore with settings to avoid errors
const db = firebase.firestore();
db.settings({
    ignoreUndefinedProperties: true,
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true })
    .catch(err => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence.');
        }
    });

// Debug initialization
console.log('Firebase initialized successfully');
console.log('Auth initialized:', !!auth);
console.log('Firestore initialized:', !!db);