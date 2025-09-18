// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        updateUserInterface(user);
    } else {
        // No user is signed in, redirect to login
        window.location.href = '/login.html';
    }
});

// Update UI with user information
function updateUserInterface(user) {
    // Update welcome message
    const welcomeName = document.getElementById('welcomeName');
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');

    const displayName = user.displayName || 'User';
    welcomeName.textContent = displayName;
    userDisplayName.textContent = displayName;
    userEmail.textContent = user.email;
}

// Handle user dropdown
const userProfileBtn = document.getElementById('userProfileBtn');
const userDropdown = document.getElementById('userDropdown');

userProfileBtn.addEventListener('click', () => {
    userDropdown.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    if (!userProfileBtn.contains(event.target) && !userDropdown.contains(event.target)) {
        userDropdown.classList.remove('active');
    }
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await firebase.auth().signOut();
        // Redirect will happen automatically due to onAuthStateChanged
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Handle button clicks
document.querySelector('.create-study-btn').addEventListener('click', () => {
    window.location.href = 'create-study.html';
});

document.querySelector('.my-studies-btn').addEventListener('click', () => {
    window.location.href = 'my-studies.html';
});

document.querySelector('.watch-tutorial-btn').addEventListener('click', () => {
    // Add your tutorial logic here
    alert('Tutorial feature coming soon!');
});

// Handle profile settings
document.getElementById('profileSettings').addEventListener('click', (e) => {
    e.preventDefault();
    // Add your profile settings logic here
    alert('Profile settings feature coming soon!');
}); 