// Function to show error messages
const showError = (message) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    // Remove any existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Add the new error message
    const activeForm = document.querySelector('.tab-content.active .auth-form');
    activeForm.insertBefore(errorDiv, activeForm.firstChild);

    // Remove the error message after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
};

// Function to show success messages
const showSuccess = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;

    // Remove any existing success messages
    document.querySelectorAll('.success-message').forEach(el => el.remove());

    // Add the new success message
    const activeForm = document.querySelector('.tab-content.active .auth-form');
    activeForm.insertBefore(successDiv, activeForm.firstChild);

    // Remove the success message after 5 seconds
    setTimeout(() => successDiv.remove(), 5000);
};

// Function to set loading state
const setLoading = (element, isLoading) => {
    // If element is a form, find the submit button
    const button = element.tagName === 'FORM'
        ? element.querySelector('.auth-submit')
        : element;

    if (!button) return;

    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
};

// Function to redirect to dashboard
const redirectToDashboard = () => {
    window.location.href = '/dashboard.html';
};

// Handle auth state changes
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        localStorage.setItem('user', JSON.stringify({
            email: user.email,
            name: user.displayName,
            uid: user.uid
        }));
        redirectToDashboard();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is already signed in
    const user = firebase.auth().currentUser;
    if (user) {
        redirectToDashboard();
        return;
    }

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Login form submission
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        setLoading(loginForm, true);

        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            showSuccess('Login successful!');
            // Redirect will happen automatically through onAuthStateChanged
        } catch (error) {
            console.error('Login error:', error);
            showError(error.message);
            setLoading(loginForm, false);
        }
    });

    // Registration form submission
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;

        if (password !== confirmPassword) {
            showError('Passwords do not match!');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }

        setLoading(registerForm, true);

        try {
            // Create user
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);

            // Update profile with name
            await userCredential.user.updateProfile({
                displayName: name
            });

            showSuccess('Registration successful!');
            // Redirect will happen automatically through onAuthStateChanged
        } catch (error) {
            console.error('Registration error:', error);
            showError(error.message);
            setLoading(registerForm, false);
        }
    });

    // Google Sign-in
    const googleButtons = document.querySelectorAll('.google');
    googleButtons.forEach(button => {
        button.addEventListener('click', async () => {
            try {
                console.log('Starting Google Sign-in process...');
                setLoading(button, true);

                // Create Google Auth Provider
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.addScope('profile');
                provider.addScope('email');

                console.log('Google Auth Provider created');

                // Sign in with popup
                console.log('Opening sign-in popup...');
                const result = await firebase.auth().signInWithPopup(provider);
                console.log('Sign-in successful:', result);

                const user = result.user;
                console.log('User info:', {
                    email: user.email,
                    name: user.displayName,
                    uid: user.uid
                });

                // Store user info
                localStorage.setItem('user', JSON.stringify({
                    email: user.email,
                    name: user.displayName,
                    uid: user.uid,
                    photoURL: user.photoURL
                }));

                showSuccess('Google Sign-in successful!');
                // Redirect will happen automatically through onAuthStateChanged
            } catch (error) {
                console.error('Detailed Google Sign-in Error:', {
                    code: error.code,
                    message: error.message,
                    fullError: error
                });

                let errorMessage = 'Failed to sign in with Google';

                // More specific error messages
                switch (error.code) {
                    case 'auth/popup-blocked':
                        errorMessage = 'Please enable popups for this website to use Google Sign-In';
                        break;
                    case 'auth/popup-closed-by-user':
                        errorMessage = 'Sign-in cancelled. Please try again.';
                        break;
                    case 'auth/cancelled-popup-request':
                        errorMessage = 'Only one sign-in window allowed at a time.';
                        break;
                    case 'auth/unauthorized-domain':
                        errorMessage = 'This domain is not authorized for Google Sign-In. Please contact support.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = 'Google Sign-In is not enabled. Please contact support.';
                        break;
                    default:
                        errorMessage = `Sign-in error: ${error.message}`;
                }

                showError(errorMessage);
            } finally {
                setLoading(button, false);
            }
        });
    });

    // Check URL parameters for direct tab access
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');

    if (tabParam === 'register') {
        document.querySelector('[data-tab="register"]').click();
    }
}); 