// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        updateUserInterface(user);

        // Try to load user studies
        try {
            loadUserStudies(user.uid);
        } catch (error) {
            console.error('Failed to load user studies:', error);
            showDemoData();
        }
    } else {
        // No user is signed in, redirect to login
        window.location.href = 'login.html'; // Fixed path: removed leading slash
    }
});

// Function to show demo data directly
function showDemoData() {
    console.log('Showing demo data directly');
    const studiesList = document.getElementById('studiesList');

    if (studiesList) {
        // Clear any existing content
        studiesList.innerHTML = '';

        // Get demo studies
        const demoStudies = createDemoStudies();

        // Create and append cards
        demoStudies.forEach(studyData => {
            try {
                const studyCard = createStudyCard(studyData.id, studyData);
                studiesList.appendChild(studyCard);
            } catch (error) {
                console.error('Error creating demo card:', error);
            }
        });
    } else {
        console.error('Could not find studiesList element');
    }
}

// Update UI with user information
function updateUserInterface(user) {
    // Update user display info
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');

    const displayName = user.displayName || 'User';
    userDisplayName.textContent = displayName;
    userEmail.textContent = user.email;
}

// Create demo data for testing
function createDemoStudies() {
    return [
        {
            id: 'demo_study_1',
            name: 'Brief counseling plus print materials',
            description: 'Nonphysician-delivered education session and informational brochure',
            createdAt: new Date().toISOString(),
            recommendations: [
                {
                    study_metadata: {
                        title: 'Brief counseling plus print materials',
                        disease_area_1: 'Cancer',
                        disease_area_2: 'Women\'s Health'
                    },
                    intervention_details: [{
                        name: 'Brief counseling plus print materials',
                        description: 'Nonphysician-delivered education session and informational brochure'
                    }],
                    outcomes: {
                        primary: [{
                            result: '72% overall; less with mention of side effects'
                        }]
                    }
                }
            ],
            isStarredCollection: true,
            _source: 'demo'
        },
        {
            id: 'demo_study_2',
            name: 'Video information intervention',
            description: 'A 10-minute professionally produced video describing the study',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            recommendations: [
                {
                    study_metadata: {
                        title: 'Video information intervention',
                        disease_area_1: 'Public Health'
                    },
                    intervention_details: [{
                        name: 'Patient information video',
                        description: 'A 10-minute professionally produced video describing the study'
                    }],
                    outcomes: {
                        primary: [{
                            result: '61.9% vs 35.4% control'
                        }]
                    }
                }
            ],
            _source: 'demo'
        }
    ];
}

// Load user's saved studies from localStorage and Firestore
async function loadUserStudies(userId) {
    console.log('Loading studies for user:', userId);
    const studiesList = document.getElementById('studiesList');

    if (!studiesList) {
        console.error('Could not find studiesList element');
        return;
    }

    // Clear loading message
    studiesList.innerHTML = '';

    try {
        // First try to load from localStorage
        console.log('Loading studies from localStorage...');
        const localStudies = loadStudiesFromLocalStorage(userId);
        console.log('Local studies loaded:', localStudies.length);

        // Then try to load from Firestore
        let firestoreStudies = [];
        try {
            console.log('Loading studies from Firestore...');

            // Check if Firestore is available
            if (!firebase.firestore) {
                throw new Error('Firestore is not available');
            }

            const db = firebase.firestore();
            console.log('Firestore instance:', !!db);

            const studiesRef = db.collection('users').doc(userId).collection('studies');
            console.log('Studies reference created');

            const snapshot = await studiesRef.orderBy('createdAt', 'desc').get();
            console.log('Snapshot received, empty:', snapshot.empty);

            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    console.log('Found Firestore document:', doc.id);
                    firestoreStudies.push({
                        id: doc.id,
                        ...doc.data(),
                        _source: 'firestore'
                    });
                });
            }
            console.log('Firestore studies loaded:', firestoreStudies.length);
        } catch (firestoreError) {
            console.warn('Could not load studies from Firestore:', firestoreError);
            // Continue with local studies only
        }

        // Add source marker to local studies
        const markedLocalStudies = localStudies.map(study => ({
            ...study,
            _source: 'local'
        }));

        // Merge studies from both sources (prioritize Firestore versions)
        const firestoreIds = firestoreStudies.map(study => study.id);
        const uniqueLocalStudies = markedLocalStudies.filter(study => !firestoreIds.includes(study.id));

        console.log('Unique local studies:', uniqueLocalStudies.length);

        // Combine all studies
        let allStudies = [...firestoreStudies, ...uniqueLocalStudies];
        console.log('Combined studies:', allStudies.length);

        // Add demo studies if no real studies exist
        if (allStudies.length === 0) {
            console.log('No real studies found, adding demo studies');
            allStudies = createDemoStudies();
        }

        // Sort by date if possible
        try {
            allStudies.sort((a, b) => {
                let dateA, dateB;

                try {
                    if (a.createdAt && typeof a.createdAt.toDate === 'function') {
                        dateA = a.createdAt.toDate();
                    } else if (typeof a.createdAt === 'string') {
                        dateA = new Date(a.createdAt);
                    } else {
                        dateA = new Date(0); // Default to old date
                    }
                } catch (e) {
                    dateA = new Date(0);
                }

                try {
                    if (b.createdAt && typeof b.createdAt.toDate === 'function') {
                        dateB = b.createdAt.toDate();
                    } else if (typeof b.createdAt === 'string') {
                        dateB = new Date(b.createdAt);
                    } else {
                        dateB = new Date(0);
                    }
                } catch (e) {
                    dateB = new Date(0);
                }

                return dateB - dateA; // Descending order (newest first)
            });
        } catch (sortError) {
            console.warn('Error sorting studies:', sortError);
            // Continue with unsorted studies
        }

        if (allStudies.length === 0) {
            // This should never happen now with demo data, but just in case
            console.log('No studies found even after adding demos');
            studiesList.innerHTML = `
                <div class="no-studies-message">
                    <p>You don't have any saved studies yet.</p>
                    <a href="create-study.html" class="get-started-btn">Get Started</a>
                </div>
            `;
            return;
        }

        // Display each study as a card
        console.log('Creating study cards...');
        allStudies.forEach((studyData, index) => {
            try {
                console.log(`Creating card ${index + 1}:`, studyData.name || studyData.id);
                const studyCard = createStudyCard(studyData.id, studyData);
                studiesList.appendChild(studyCard);
            } catch (cardError) {
                console.error('Error creating card:', cardError);
            }
        });

        console.log('All studies loaded and displayed');

    } catch (error) {
        console.error('Error loading studies:', error);

        // Even if there's an error, show demo data
        console.log('Showing demo data due to error');
        const demoStudies = createDemoStudies();

        studiesList.innerHTML = '';
        demoStudies.forEach((studyData, index) => {
            try {
                const studyCard = createStudyCard(studyData.id, studyData);
                studiesList.appendChild(studyCard);
            } catch (cardError) {
                console.error('Error creating demo card:', cardError);
            }
        });
    }
}

// Load studies from localStorage
function loadStudiesFromLocalStorage(userId) {
    try {
        console.log('Loading studies from localStorage for user:', userId);

        // Check all localStorage items for debugging
        console.log('All localStorage keys:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`- ${key}`);
        }

        // Get the projects index
        const projectsIndexKey = 'engagewise_projects_index';
        const projectsIndexJson = localStorage.getItem(projectsIndexKey);
        console.log('Projects index JSON:', projectsIndexJson);

        const projectsIndex = JSON.parse(projectsIndexJson || '[]');
        console.log('Parsed projects index:', projectsIndex);

        // Filter by user ID
        const userProjects = projectsIndex.filter(project => project.userId === userId);
        console.log('User projects from index:', userProjects);

        // Try to find any projects with this user ID in localStorage
        const allProjects = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // Check for both formats: engagewise_project_ and engagewise_ (the actual format used)
            if (key && (key.startsWith('engagewise_project_') || key.startsWith('engagewise_'))) {
                try {
                    console.log('Checking localStorage key:', key);
                    const projectData = JSON.parse(localStorage.getItem(key) || '{}');
                    console.log('Project data userId:', projectData.userId, 'Looking for:', userId);
                    if (projectData.userId === userId) {
                        console.log('Found project in localStorage:', projectData.name || projectData.id);
                        allProjects.push(projectData);
                    }
                } catch (e) {
                    console.warn('Error parsing localStorage item:', e);
                }
            }
        }

        // If we found projects directly but not in the index, use those
        if (allProjects.length > 0 && userProjects.length === 0) {
            console.log('Using projects found directly in localStorage:', allProjects.length);
            return allProjects;
        }

        // Load full project data for each index entry
        const indexProjects = userProjects.map(indexEntry => {
            const localStorageKey = `engagewise_${indexEntry.id}`;
            console.log('Looking for project with key:', localStorageKey);
            const projectJson = localStorage.getItem(localStorageKey);
            console.log('Project JSON:', projectJson ? projectJson.substring(0, 50) + '...' : 'null');

            const projectData = JSON.parse(projectJson || '{}');
            return projectData;
        }).filter(project => project.id); // Filter out any empty projects

        console.log('Loaded projects from localStorage:', indexProjects.length);
        return indexProjects;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return [];
    }
}

// Create a study card element
function createStudyCard(studyId, studyData) {
    const card = document.createElement('div');
    card.className = 'strategy-card';
    card.setAttribute('data-id', studyId);

    // Format date - handle both Firestore Timestamp and ISO string formats
    let date;
    if (studyData.createdAt) {
        if (typeof studyData.createdAt === 'string') {
            // ISO string from localStorage
            date = new Date(studyData.createdAt);
        } else if (studyData.createdAt.toDate && typeof studyData.createdAt.toDate === 'function') {
            // Firestore Timestamp
            date = studyData.createdAt.toDate();
        } else if (studyData.createdAt.seconds) {
            // Firestore Timestamp object
            date = new Date(studyData.createdAt.seconds * 1000);
        } else {
            date = new Date();
        }
    } else {
        date = new Date();
    }

    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Format time in hours and minutes
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Combine date and time
    const formattedDateTime = `${formattedDate} at ${formattedTime}`;

    // Count only starred recommendations
    let starredCount = 0;
    if (studyData.recommendations && Array.isArray(studyData.recommendations)) {
        starredCount = studyData.recommendations.filter(rec => rec.isStarred === true).length;
    }
    const recommendationsCount = starredCount;

    // Check if this is a starred collection
    const isStarred = studyData.isStarredCollection === true;
    const starIcon = isStarred ? '★' : '☆';
    const starClass = isStarred ? 'active' : '';

    // Create the main card content
    const mainContent = document.createElement('div');
    mainContent.className = 'strategy-card-main';

    // Create the content section
    const contentSection = document.createElement('div');
    contentSection.className = 'strategy-content';

    // Create star button
    const starButton = document.createElement('button');
    starButton.className = `star-icon ${starClass}`;
    starButton.setAttribute('aria-label', 'bookmark');
    starButton.textContent = starIcon;
    starButton.disabled = true; // Disable the star button in the My Studies view

    // Create text content
    const textContent = document.createElement('div');
    textContent.className = 'strategy-text';
    textContent.innerHTML = `
        <h3>${studyData.name}</h3>
        <p>${studyData.description || 'No description provided.'}</p>
        <div class="date">Created on ${formattedDateTime}</div>
        <button class="expand-button" onclick="toggleCardExpansion(this)">+</button>
    `;

    // Assemble the content section
    contentSection.appendChild(starButton);
    contentSection.appendChild(textContent);
    mainContent.appendChild(contentSection);

    // Create indicators section
    const indicatorsSection = document.createElement('div');
    indicatorsSection.className = 'effect-indicators';
    indicatorsSection.innerHTML = `
        <div class="recommendations-count">${recommendationsCount} strategies</div>
    `;

    mainContent.appendChild(indicatorsSection);
    card.appendChild(mainContent);

    // Create expanded content section (initially hidden)
    const expandedContent = document.createElement('div');
    expandedContent.className = 'expanded-content';
    expandedContent.style.display = 'none';
    expandedContent.innerHTML = `
        <button class="minimize-button" onclick="toggleCardExpansion(this)">−</button>
        <div class="study-details">
            <p><strong>${studyData.name}</strong></p>
            <p>${studyData.description || 'No description provided.'}</p>
            <p>Created on ${formattedDateTime}</p>
            <p><strong>Recommendations:</strong> ${recommendationsCount} strategies</p>
            <div class="view-details-btn">
                <a href="study-details.html?id=${studyId}" class="view-btn">View Full Details</a>
            </div>
        </div>
    `;

    card.appendChild(expandedContent);

    return card;
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

// Handle profile settings
document.getElementById('profileSettings').addEventListener('click', (e) => {
    e.preventDefault();
    // Add your profile settings logic here
    alert('Profile settings feature coming soon!');
});

// Expand/minimize card
function toggleCardExpansion(button) {
    const card = button.closest('.strategy-card');
    const expanded = card.querySelector('.expanded-content');
    const expandBtn = card.querySelector('.expand-button');
    const isOpen = expanded.style.display !== 'none';
    if (isOpen) {
        expanded.style.display = 'none';
        if (expandBtn) expandBtn.textContent = '+';
        card.classList.remove('expanded');
    } else {
        expanded.style.display = 'block';
        if (expandBtn) expandBtn.textContent = '−';
        card.classList.add('expanded');
    }
}

// Make toggleCardExpansion available globally
window.toggleCardExpansion = toggleCardExpansion;

// Ensure demo data is shown if page is loaded for 3 seconds with no content
// Use a longer timeout to give real data more time to load
setTimeout(() => {
    const studiesList = document.getElementById('studiesList');
    if (studiesList && (!studiesList.children.length ||
        (studiesList.children.length === 1 &&
            (studiesList.children[0].className === 'loading-message' ||
                studiesList.children[0].className === 'no-studies-message')))) {

        // Check localStorage directly one more time before showing demo data
        const user = firebase.auth().currentUser;
        if (user) {
            console.log('Checking localStorage directly before showing demos');
            const realProjects = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('engagewise_')) {
                    try {
                        const projectData = JSON.parse(localStorage.getItem(key));
                        if (projectData && projectData.userId === user.uid) {
                            realProjects.push(projectData);
                        }
                    } catch (e) {
                        console.warn('Error parsing localStorage item in final check:', e);
                    }
                }
            }

            if (realProjects.length > 0) {
                console.log('Found real projects in final check, displaying them');
                studiesList.innerHTML = '';
                realProjects.forEach(studyData => {
                    try {
                        const studyCard = createStudyCard(studyData.id, studyData);
                        studiesList.appendChild(studyCard);
                    } catch (error) {
                        console.error('Error creating real project card:', error);
                    }
                });
                return;
            }
        }

        console.log('No real content found after timeout, showing demo data');
        showDemoData();
    }
}, 3000);
