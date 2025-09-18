// Global variables
let currentStudyId = null;
let currentStudyData = null;

// Check authentication state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        updateUserInterface(user);
        loadStudyDetails(user.uid);
    } else {
        // No user is signed in, redirect to login
        window.location.href = 'login.html';
    }
});

// Update UI with user information
function updateUserInterface(user) {
    // Update user display info
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');

    const displayName = user.displayName || 'User';
    userDisplayName.textContent = displayName;
    userEmail.textContent = user.email;
}

// Get study ID from URL
function getStudyIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load study details from localStorage first, then try Firestore
async function loadStudyDetails(userId) {
    try {
        // Get study ID from URL
        currentStudyId = getStudyIdFromUrl();

        if (!currentStudyId) {
            showError('No study ID provided');
            return;
        }

        console.log('Loading study details for ID:', currentStudyId);

        // First try to get data from localStorage
        let studyData = null;
        const localStorageKey = `engagewise_${currentStudyId}`;

        try {
            const localData = localStorage.getItem(localStorageKey);
            console.log('Local storage data found:', !!localData);

            if (localData) {
                studyData = JSON.parse(localData);
                console.log('Study found in localStorage:', studyData.name);
            }
        } catch (localError) {
            console.warn('Error reading from localStorage:', localError);
        }

        // If not in localStorage, try Firestore
        if (!studyData) {
            console.log('Study not found in localStorage, trying Firestore...');
            try {
                const studyDoc = await firebase.firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('studies')
                    .doc(currentStudyId)
                    .get();

                if (studyDoc.exists) {
                    studyData = studyDoc.data();
                    console.log('Study found in Firestore:', studyData.name);
                }
            } catch (firestoreError) {
                console.warn('Error loading from Firestore:', firestoreError);
                // Continue with localStorage data if available
            }
        }

        // If study data was found in either place
        if (studyData) {
            // Store study data
            currentStudyData = studyData;

            // Update UI with study data
            displayStudyDetails(currentStudyData);

            // Check if recommendations exist
            if (currentStudyData.recommendations && currentStudyData.recommendations.length > 0) {
                console.log('Found recommendations:', currentStudyData.recommendations.length);
                displayRecommendations(currentStudyData.recommendations);
            } else {
                console.warn('No recommendations found in study data');
                showError('No recommendations found in this study');
            }
        } else {
            // If not found in either place
            console.error('Study not found in localStorage or Firestore');
            showError('Study not found');
        }

    } catch (error) {
        console.error('Error loading study details:', error);
        showError(`Failed to load study details: ${error.message}`);
    }
}

// Display study details
function displayStudyDetails(studyData) {
    document.getElementById('studyTitle').textContent = studyData.name || 'Untitled Study';
    document.getElementById('studyDescription').textContent = studyData.description || 'No description provided';
}

// Display recommendations
function displayRecommendations(recommendations) {
    const cardsContainer = document.getElementById('strategyCards');
    cardsContainer.innerHTML = ''; // Clear loading message

    if (!recommendations || recommendations.length === 0) {
        cardsContainer.innerHTML = '<div class="loading-message">No recommendations found</div>';
        return;
    }

    // Filter to only show starred recommendations
    const starredRecommendations = recommendations.filter(study => study.isStarred === true);

    console.log('Total recommendations:', recommendations.length);
    console.log('Starred recommendations:', starredRecommendations.length);

    // If no starred recommendations, show a message
    if (starredRecommendations.length === 0) {
        cardsContainer.innerHTML = '<div class="loading-message">No starred recommendations found</div>';
        return;
    }

    // Create and append cards for starred recommendations only
    starredRecommendations.forEach((study, index) => {
        const card = createStrategyCard(study, index);
        cardsContainer.appendChild(card);
    });

    // Update the page title to show the number of starred recommendations
    const studyTitle = document.getElementById('studyTitle');
    if (studyTitle) {
        const currentTitle = studyTitle.textContent;
        // Check if the title already contains a count in parentheses
        if (currentTitle.includes('(')) {
            studyTitle.textContent = currentTitle.replace(/\(\d+\)/, `(${starredRecommendations.length})`);
        } else {
            studyTitle.textContent = `${currentTitle} (${starredRecommendations.length})`;
        }
    }
}

// Create a strategy card element (copied from recommendations.js)
function createStrategyCard(study, index) {
    try {
        const metrics = getEffectIndicators(study, index);

        // Get intervention details
        const interventionName = study?.intervention_details?.[0]?.name || 'Intervention Strategy';
        const interventionDescription = study?.intervention_details?.[0]?.description ||
            study?.findings_and_implications?.key_findings ||
            'Detailed intervention description';

        // Check if this recommendation was starred
        const isStarred = study.isStarred === true;
        const starClass = isStarred ? 'active' : '';
        const starIcon = isStarred ? '★' : '☆';

        const card = document.createElement('div');
        card.className = 'strategy-card';
        // Store study on the element for expansion
        card.studyData = { study };

        card.innerHTML = `
            <div class="strategy-card-main">
                <div class="strategy-content">
                    <button class="star-icon ${starClass}" aria-label="bookmark" disabled>${starIcon}</button>
                    <div class="strategy-text">
                        <h3>${interventionName}</h3>
                        <p>${interventionDescription}</p>
                        <button class="expand-button" onclick="toggleCardExpansion(this)">+</button>
                    </div>
                </div>
                <div class="effect-indicators">
                    <div class="indicator">
                        <span class="arrow ${metrics.response.type}">${metrics.response.symbol}</span>
                        <span class="label">Response</span>
                    </div>
                    <div class="indicator">
                        <span class="arrow ${metrics.recruitment.type}">${metrics.recruitment.symbol}</span>
                        <span class="label">Recruitment</span>
                    </div>
                    <div class="indicator">
                        <span class="arrow ${metrics.retention.type}">${metrics.retention.symbol}</span>
                        <span class="label">Retention</span>
                    </div>
                </div>
            </div>
            <div class="expanded-content" style="display:none;">
                <button class="minimize-button" onclick="toggleCardExpansion(this)">−</button>
                <div class="study-details"></div>
            </div>
        `;

        return card;
    } catch (error) {
        console.error('Error creating strategy card:', error);
        return createDefaultCard(index);
    }
}

// Create a default card if there's an error
function createDefaultCard(index) {
    const card = document.createElement('div');
    card.className = 'strategy-card';

    const metrics = getEffectIndicators(null, index);

    card.innerHTML = `
        <div class="strategy-card-main">
            <div class="strategy-content">
                <button class="star-icon" aria-label="bookmark" disabled>☆</button>
                <div class="strategy-text">
                    <h3>[Intervention details: name]</h3>
                    <p>[Intervention details: description]</p>
                    <button class="expand-button" onclick="toggleCardExpansion(this)">+</button>
                </div>
            </div>
            <div class="effect-indicators">
                <div class="indicator">
                    <span class="arrow ${metrics.response.type}">${metrics.response.symbol}</span>
                    <span class="label">Response</span>
                </div>
                <div class="indicator">
                    <span class="arrow ${metrics.recruitment.type}">${metrics.recruitment.symbol}</span>
                    <span class="label">Recruitment</span>
                </div>
                <div class="indicator">
                    <span class="arrow ${metrics.retention.type}">${metrics.retention.symbol}</span>
                    <span class="label">Retention</span>
                </div>
            </div>
        </div>
        <div class="expanded-content" style="display:none;">
            <button class="minimize-button" onclick="toggleCardExpansion(this)">−</button>
            <div class="study-details"></div>
        </div>
    `;

    return card;
}

// Get effect indicators (copied from recommendations.js)
function getEffectIndicators(study, index) {
    const patternsByIndex = [
        // Card 1 (most recommended)
        { response: { type: 'up', symbol: '↑' }, recruitment: { type: 'up', symbol: '↑' }, retention: { type: 'na', symbol: 'NA' } },
        // Card 2
        { response: { type: 'up', symbol: '↑' }, recruitment: { type: 'up', symbol: '↑' }, retention: { type: 'right', symbol: '→' } },
        // Card 3
        { response: { type: 'up', symbol: '↑' }, recruitment: { type: 'down', symbol: '↓' }, retention: { type: 'na', symbol: 'NA' } },
        // Card 4
        { response: { type: 'up', symbol: '↑' }, recruitment: { type: 'up', symbol: '↑' }, retention: { type: 'right', symbol: '→' } }
    ];

    return patternsByIndex[index % patternsByIndex.length];
}

// Toggle bookmark star
function toggleStar(button) {
    const isFilled = button.classList.toggle('active');
    button.textContent = isFilled ? '★' : '☆';
}

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
        if (!expanded.dataset.populated) {
            populateExpanded(card, expanded);
            expanded.dataset.populated = 'true';
        }
    }
}

// Populate expanded with study metadata
function populateExpanded(card, expanded) {
    try {
        const study = card.studyData?.study;
        if (!study) return;

        const details = expanded.querySelector('.study-details');

        // Get metadata
        const md = study.study_metadata || {};
        const title = md.title || '[title]';
        const authors = (md.authors || []).join(', ') || '';
        const pubBits = [md.year, md.journal, md.doi].filter(Boolean).join(', ') || '';
        const disease1 = md.disease_area_1 || '';
        const disease2 = md.disease_area_2 || '';

        // Get intervention details
        const iv = (study.intervention_details && study.intervention_details[0]) || {};
        const interventionName = iv.name || '';
        const interventionDescription = iv.description || '';
        const comparisonGroup = iv.comparison_group || '';

        // Get study context and sample
        const sample = study.sample?.sample_size ?? '';
        const context = study.study_context?.setting || '';

        // Get outcomes
        const outcome = study.outcomes?.primary?.[0]?.result || '';
        const notes = study.notes || '';

        // Format the content in a grey box similar to recommendations.js
        details.innerHTML = `
            <div class="expanded-details">
                <div class="detail-section">
                    <h4>${title}</h4>
                    ${authors ? `<p><strong>Authors:</strong> ${authors}</p>` : ''}
                    ${pubBits ? `<p>${pubBits}</p>` : ''}
                </div>
                
                ${(disease1 || disease2) ? `
                <div class="detail-section">
                    <p><strong>Disease Area:</strong> ${[disease1, disease2].filter(Boolean).join(', ')}</p>
                </div>
                ` : ''}
                
                <div class="detail-section">
                    <p><strong>Intervention:</strong> ${interventionName}</p>
                    <p>${interventionDescription}</p>
                    ${comparisonGroup ? `
                    <p><strong>Comparison:</strong></p>
                    <p>${comparisonGroup}</p>
                    ` : ''}
                </div>
                
                ${sample ? `
                <div class="detail-section">
                    <p><strong>Sample size:</strong> ${sample}</p>
                </div>
                ` : ''}
                
                ${context ? `
                <div class="detail-section">
                    <p><strong>Study context:</strong> ${context}</p>
                </div>
                ` : ''}
                
                ${outcome ? `
                <div class="detail-section">
                    <p><strong>Outcomes:</strong> ${outcome}</p>
                </div>
                ` : ''}
                
                ${notes ? `
                <div class="detail-section">
                    <p><strong>Notes:</strong> ${notes}</p>
                </div>
                ` : ''}
            </div>
        `;
    } catch (e) {
        console.error('populateExpanded failed', e);
    }
}

// Show error message
function showError(message) {
    const cardsContainer = document.getElementById('strategyCards');
    cardsContainer.innerHTML = `<div class="loading-message">${message}</div>`;
}

// Delete study
async function deleteStudy() {
    try {
        if (!currentStudyId) return;

        const user = firebase.auth().currentUser;
        if (!user) return;

        await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .collection('studies')
            .doc(currentStudyId)
            .delete();

        // Redirect back to My Studies page
        window.location.href = 'my-studies.html?deleted=true';
    } catch (error) {
        console.error('Error deleting study:', error);
        alert('Failed to delete study. Please try again.');
    }
}

// Setup delete modal
function setupDeleteModal() {
    const modal = document.getElementById('deleteModal');
    const deleteBtn = document.getElementById('deleteStudyBtn');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    // Open modal
    deleteBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Close modal
    function closeModal() {
        modal.style.display = 'none';
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Handle delete confirmation
    confirmBtn.addEventListener('click', async () => {
        await deleteStudy();
        closeModal();
    });
}

// Handle edit button click
document.getElementById('editStudyBtn').addEventListener('click', () => {
    // For now, just redirect to create-study page
    window.location.href = `create-study.html?edit=${currentStudyId}`;
});

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

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setupDeleteModal();
});
