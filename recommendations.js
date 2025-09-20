// Global variables to store recommendations
let currentRecommendations = [];
let userFormData = null;
let starredRecommendations = new Set(); // Track starred recommendations by title

// Load and parse the JSON data
async function loadStudyData() {
    try {
        const response = await fetch('assets/Merged JSON for demo.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading study data:', error);
        // For testing, return some dummy data
        return [
            {
                study_metadata: {
                    title: "Inclusion of home safety questionnaire in invitation",
                    disease_area_1: "Public Health"
                },
                intervention_details: [{
                    name: "Inclusion of home safety questionnaire in invitation",
                    description: "Randomisation to receive an invitation with a 16-page safety questionnaire"
                }],
                outcomes: {
                    primary: [{
                        name: "Recruitment Rate",
                        result: "Improved by 30%"
                    }],
                    secondary: [{
                        name: "Response Rate",
                        result: "Increased significantly"
                    }]
                }
            },
            {
                study_metadata: {
                    title: "Video information intervention",
                    disease_area_1: "Public Health"
                },
                intervention_details: [{
                    name: "Patient information video",
                    description: "A 10-minute professionally produced video describing the study"
                }],
                outcomes: {
                    primary: [{
                        name: "Willingness to participate",
                        result: "61.9% vs 35.4% control"
                    }]
                }
            },
            {
                study_metadata: {
                    title: "Telephone reminders for non-responders",
                    disease_area_1: "Public Health"
                },
                intervention_details: [{
                    name: "Telephone reminder to nonresponders",
                    description: "Follow-up calls to those who didn't respond to initial invitation"
                }],
                outcomes: {
                    primary: [{
                        name: "Recruitment rate",
                        result: "12.1% vs 4.5% control"
                    }]
                }
            }
        ];
    }
}

// Calculate relevance score for a study based on user input
function calculateRelevance(study, userInput) {
    try {
        let score = 0;

        // Safely check disease area match (highest priority)
        const diseaseArea1 = study?.study_metadata?.disease_area_1?.toLowerCase() || '';
        const diseaseArea2 = study?.study_metadata?.disease_area_2?.toLowerCase() || '';
        const userDiseaseArea = userInput?.diseaseArea?.toLowerCase() || '';

        if (diseaseArea1 === userDiseaseArea || diseaseArea2 === userDiseaseArea) {
            score += 5;
        }

        // Safely check study setting match
        const studySetting = study?.study_context?.setting?.toLowerCase() || '';
        const userSetting = userInput?.studySetting?.toLowerCase() || '';
        if (studySetting.includes(userSetting)) {
            score += 3;
        }

        // Safely check age group match
        const userAgeTerms = (userInput?.ageGroup || '').toLowerCase().split(/[,\s]+/);
        const studyAgeCategories = study?.sample?.age?.categories || [];
        const studyAge = studyAgeCategories.join(' ').toLowerCase();

        if (userAgeTerms.some(term => studyAge.includes(term))) {
            score += 2;
        }

        // Safely check gender match
        const studySex = study?.sample?.sex || {};
        const userGender = userInput?.gender;

        // Handle gender matching
        if (userGender === 'all') {
            // For 'all', give points if the study includes any gender data
            if (studySex.male > 0 || studySex.female > 0) {
                score += 2;
            }
        } else if (userGender === 'male' && studySex.male > 0) {
            score += 2;
        } else if (userGender === 'female' && studySex.female > 0) {
            score += 2;
        }

        return score;
    } catch (error) {
        console.error('Error calculating relevance:', error);
        return 0;
    }
}

// Create a strategy card element
function createStrategyCard(study, index) {
    try {
        const metrics = getEffectIndicators(study, index);

        // Get intervention details
        const interventionName = study?.intervention_details?.[0]?.name || 'Intervention Strategy';
        const interventionDescription = study?.intervention_details?.[0]?.description ||
            study?.findings_and_implications?.key_findings ||
            'Detailed intervention description';

        // Stars appear on every card (outline by default)

        const card = document.createElement('div');
        card.className = 'strategy-card';
        // Store study on the element for expansion
        card.studyData = { study };

        card.innerHTML = `
            <div class="strategy-card-main">
                <div class="strategy-content">
                    <button class="star-icon" aria-label="bookmark" onclick="toggleStar(this)">☆</button>
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

    // Stars appear on every card (outline by default)

    card.innerHTML = `
        <div class="strategy-card-main">
            <div class="strategy-content">
                <button class="star-icon" aria-label="bookmark" onclick="toggleStar(this)">☆</button>
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

// Get effect indicators strictly by card rank to match the provided screenshot
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

// Display recommendations based on user input
async function displayRecommendations() {
    try {
        // Get user input from session storage
        userFormData = JSON.parse(sessionStorage.getItem('studyFormData'));
        if (!userFormData) {
            console.error('No user input found');
            return;
        }
        console.log('User input:', userFormData);

        // Load JSON data
        const response = await fetch('assets/Merged JSON for demo.json');
        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${response.status}`);
        }
        const studies = await response.json();
        console.log('Loaded studies:', studies);

        // Score and sort studies by relevance
        const scoredStudies = studies
            .map(study => ({
                study,
                score: calculateRelevance(study, userFormData)
            }))
            .filter(item => item.score > 0) // Only include relevant studies
            .sort((a, b) => b.score - a.score)
            .slice(0, 4); // Get top 4 recommendations

        console.log('Scored studies:', scoredStudies);

        // Store current recommendations for saving later
        currentRecommendations = scoredStudies.map(item => item.study);

        const cardsContainer = document.querySelector('.strategy-cards');
        if (!cardsContainer) {
            console.error('Could not find strategy-cards container');
            return;
        }
        cardsContainer.innerHTML = ''; // Clear existing cards

        if (scoredStudies.length === 0) {
            // If no relevant studies found, show default cards
            for (let i = 0; i < 4; i++) {
                cardsContainer.appendChild(createDefaultCard(i));
            }
            return;
        }

        // Create and append cards
        scoredStudies.forEach((item, index) => {
            console.log(`Creating card ${index + 1}:`, item.study.study_metadata?.title);
            const card = createStrategyCard(item.study, index);
            cardsContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Error displaying recommendations:', error);
        // Show default cards if there's an error
        const cardsContainer = document.querySelector('.strategy-cards');
        if (cardsContainer) {
            for (let i = 0; i < 4; i++) {
                cardsContainer.appendChild(createDefaultCard(i));
            }
        }
    }
}

// Toggle bookmark star
function toggleStar(button) {
    const card = button.closest('.strategy-card');
    const study = card.studyData?.study;

    if (!study) {
        console.error('No study data found for this card');
        return;
    }

    const isFilled = button.classList.toggle('active');
    button.textContent = isFilled ? '★' : '☆';

    // Get a unique identifier for this recommendation
    const title = study.study_metadata?.title || '';

    if (isFilled) {
        // Add to starred recommendations
        starredRecommendations.add(title);
        console.log(`Starred recommendation: ${title}`);
        console.log('Current starred items:', Array.from(starredRecommendations));
    } else {
        // Remove from starred recommendations
        starredRecommendations.delete(title);
        console.log(`Unstarred recommendation: ${title}`);
        console.log('Current starred items:', Array.from(starredRecommendations));
    }
}

// Save a starred recommendation
async function saveStarredRecommendation(study) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('Please sign in to save recommendations');
            return;
        }

        console.log('Saving starred recommendation');

        // Clean the study object to ensure it's storage-compatible
        const cleanStudy = JSON.parse(JSON.stringify(study));

        // First save to localStorage for immediate feedback
        saveStarredToLocalStorage(cleanStudy, user.uid);

        // Then try to save to Firestore in the background
        try {
            // Check if "Starred Items" project exists
            const userRef = firebase.firestore().collection('users').doc(user.uid);
            const starredQuery = await userRef.collection('studies')
                .where('isStarredCollection', '==', true)
                .limit(1)
                .get();

            let starredDocRef;
            let starredId;

            if (starredQuery.empty) {
                // Create a new "Starred Items" project
                starredId = `starred_items_${Date.now()}`;
                const starredData = {
                    id: starredId,
                    name: "Starred Items",
                    description: "Recommendations you've marked with a star",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: user.uid,
                    isStarredCollection: true,
                    recommendations: [cleanStudy]
                };

                starredDocRef = userRef.collection('studies').doc(starredId);
                await starredDocRef.set(starredData);
                console.log('Created new starred collection in Firestore');
            } else {
                // Update existing "Starred Items" project
                starredDocRef = starredQuery.docs[0].ref;
                starredId = starredQuery.docs[0].id;

                // Get current recommendations
                const starredDoc = await starredDocRef.get();
                const starredData = starredDoc.data();
                const currentRecs = starredData.recommendations || [];

                // Check if this recommendation is already saved
                const isDuplicate = currentRecs.some(rec =>
                    rec.study_metadata?.title === cleanStudy.study_metadata?.title);

                if (!isDuplicate) {
                    // Add the new recommendation
                    await starredDocRef.update({
                        recommendations: [...currentRecs, cleanStudy],
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('Added to starred collection in Firestore');
                }
            }
        } catch (firestoreError) {
            console.error('Error saving to Firestore (will retry later):', firestoreError);
            // Continue with localStorage version
        }

    } catch (error) {
        console.error('Error saving starred recommendation:', error);
        console.error('Error details:', error.stack);
    }
}

// Save starred item to localStorage
function saveStarredToLocalStorage(study, userId) {
    try {
        // Get or create starred items collection
        const starredKey = 'engagewise_starred_items';
        let starredItems = JSON.parse(localStorage.getItem(starredKey) || '{}');

        if (!starredItems.id) {
            // Create new starred items collection
            const starredId = `starred_items_${Date.now()}`;
            starredItems = {
                id: starredId,
                name: "Starred Items",
                description: "Recommendations you've marked with a star",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: userId,
                isStarredCollection: true,
                recommendations: []
            };
        }

        // Check for duplicates
        const isDuplicate = starredItems.recommendations.some(rec =>
            rec.study_metadata?.title === study.study_metadata?.title);

        if (!isDuplicate) {
            // Add the study to recommendations
            starredItems.recommendations.push(study);
            starredItems.updatedAt = new Date().toISOString();

            // Save back to localStorage
            localStorage.setItem(starredKey, JSON.stringify(starredItems));

            // Also save to projects index
            updateProjectsIndex(starredItems);

            console.log('Added to starred collection in localStorage');
        }
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Update projects index in localStorage
function updateProjectsIndex(project) {
    try {
        const indexKey = 'engagewise_projects_index';
        let projectsIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');

        // Check if project is already in index
        const existingIndex = projectsIndex.findIndex(p => p.id === project.id);

        if (existingIndex >= 0) {
            // Update existing entry
            projectsIndex[existingIndex] = {
                id: project.id,
                name: project.name,
                description: project.description,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                userId: project.userId,
                isStarredCollection: true
            };
        } else {
            // Add new entry
            projectsIndex.push({
                id: project.id,
                name: project.name,
                description: project.description,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                userId: project.userId,
                isStarredCollection: true
            });
        }

        // Save updated index
        localStorage.setItem(indexKey, JSON.stringify(projectsIndex));

        // Also save full project data
        localStorage.setItem(`engagewise_${project.id}`, JSON.stringify(project));

        console.log('Updated projects index in localStorage');
    } catch (error) {
        console.error('Error updating projects index:', error);
    }
}

// Remove a recommendation from starred items
async function removeStarredRecommendation(study) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        console.log('Removing starred recommendation');

        // First remove from localStorage
        removeStarredFromLocalStorage(study);

        // Then try to remove from Firestore
        try {
            const userRef = firebase.firestore().collection('users').doc(user.uid);
            const starredQuery = await userRef.collection('studies')
                .where('isStarredCollection', '==', true)
                .limit(1)
                .get();

            if (starredQuery.empty) return;

            const starredDocRef = starredQuery.docs[0].ref;
            const starredDoc = await starredDocRef.get();
            const starredData = starredDoc.data();
            const currentRecs = starredData.recommendations || [];

            // Filter out the recommendation to remove
            const updatedRecs = currentRecs.filter(rec =>
                rec.study_metadata?.title !== study.study_metadata?.title);

            // Use a transaction to ensure atomicity
            await firebase.firestore().runTransaction(async (transaction) => {
                transaction.update(starredDocRef, {
                    recommendations: updatedRecs,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            console.log('Removed from starred collection in Firestore');
        } catch (firestoreError) {
            console.error('Error removing from Firestore:', firestoreError);
            // Continue with localStorage version
        }

    } catch (error) {
        console.error('Error removing starred recommendation:', error);
        console.error('Error details:', error.stack);
    }
}

// Remove starred item from localStorage
function removeStarredFromLocalStorage(study) {
    try {
        // Get starred items collection
        const starredKey = 'engagewise_starred_items';
        let starredItems = JSON.parse(localStorage.getItem(starredKey) || '{}');

        if (!starredItems.id || !starredItems.recommendations) {
            return; // Nothing to remove
        }

        // Filter out the recommendation to remove
        const updatedRecs = starredItems.recommendations.filter(rec =>
            rec.study_metadata?.title !== study.study_metadata?.title);

        // Update the collection
        starredItems.recommendations = updatedRecs;
        starredItems.updatedAt = new Date().toISOString();

        // Save back to localStorage
        localStorage.setItem(starredKey, JSON.stringify(starredItems));

        // Also update in projects index and full data
        updateProjectsIndex(starredItems);

        console.log('Removed from starred collection in localStorage');
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
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
        const md = study.study_metadata || {};
        const details = expanded.querySelector('.study-details');
        const title = md.title || '[title]';
        const authors = (md.authors || []).join(', ') || '[authors]';
        const pubBits = [md.year, md.journal, md.doi].filter(Boolean).join(', ') || '[year/journal/doi]';
        const disease1 = md.disease_area_1 || '';
        const disease2 = md.disease_area_2 || '';
        const iv = (study.intervention_details && study.intervention_details[0]) || {};
        const sample = study.sample?.sample_size ?? '';
        const context = study.study_context?.setting || '';
        const outcome = study.outcomes?.primary?.[0]?.result || '';
        const notes = study.notes || '';

        details.innerHTML = `
            <p><strong>${title}</strong></p>
            <p>${authors}</p>
            <p>${pubBits}</p>
            
            <p><strong>${[disease1, disease2].filter(Boolean).join(', ')}</strong></p>
            
            <p><strong>${iv.description || ''}</strong></p>
            <p>VS</p>
            <p>${iv.comparison_group || ''}</p>
            
            <p><strong>Sample size</strong><br>${sample || ''}</p>
            <p><strong>Study context</strong><br>${context || ''}</p>
            
            <p><strong>Outcomes</strong><br>${outcome || ''}</p>
            <p><strong>Notes</strong><br>${notes || ''}</p>
        `;
    } catch (e) {
        console.error('populateExpanded failed', e);
    }
}

// Check authentication state
function checkAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user.displayName);
            // Update UI if needed
            document.getElementById('saveProjectBtn').style.display = 'block';
        } else {
            // No user is signed in
            console.log('No user is signed in');
            // Hide save button if user is not signed in
            document.getElementById('saveProjectBtn').style.display = 'none';
        }
    });
}

// Save project primarily to localStorage with optional Firestore sync
async function saveProject(name, description) {
    try {
        console.log('Starting saveProject function');

        // Basic validation
        if (!name || name.trim() === '') {
            alert('Please enter a project name');
            return false;
        }

        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('No user is signed in');
            alert('Please sign in to save projects');
            return false;
        }

        console.log('User is signed in:', user.uid);

        // Ensure we have recommendations to save
        if (!currentRecommendations || currentRecommendations.length === 0) {
            console.error('No recommendations to save');
            alert('No recommendations to save. Please try refreshing the page.');
            return false;
        }

        // Create a minimal version of recommendations with only essential data
        const minimalRecommendations = currentRecommendations.map(rec => {
            // Extract only the most essential data to reduce size
            const minimal = {};

            // Study metadata - only keep title and disease areas
            if (rec.study_metadata) {
                minimal.study_metadata = {
                    title: rec.study_metadata.title || '',
                    disease_area_1: rec.study_metadata.disease_area_1 || '',
                    disease_area_2: rec.study_metadata.disease_area_2 || ''
                };
            }

            // Intervention details - only keep name and description
            if (rec.intervention_details && rec.intervention_details[0]) {
                minimal.intervention_details = [{
                    name: rec.intervention_details[0].name || '',
                    description: rec.intervention_details[0].description || ''
                }];
            }

            // Outcomes - only keep primary outcome result
            if (rec.outcomes && rec.outcomes.primary && rec.outcomes.primary[0]) {
                minimal.outcomes = {
                    primary: [{
                        result: rec.outcomes.primary[0].result || ''
                    }]
                };
            }

            // Add isStarred flag based on our tracked starred recommendations
            const title = rec.study_metadata?.title || '';
            minimal.isStarred = starredRecommendations.has(title);

            return minimal;
        });

        // Stringify and re-parse to ensure clean data
        const cleanRecommendations = JSON.parse(JSON.stringify(minimalRecommendations));

        // Clean user form data - keep only essential fields
        const cleanUserInput = userFormData ? {
            diseaseArea: userFormData.diseaseArea || '',
            studySetting: userFormData.studySetting || '',
            ageGroup: userFormData.ageGroup || '',
            gender: userFormData.gender || ''
        } : {};

        // Generate a unique ID for this project
        const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        // Create project data
        const projectData = {
            id: projectId,
            name: name,
            description: description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            recommendations: cleanRecommendations,
            userInput: cleanUserInput,
            userId: user.uid,
            isStarredCollection: true // Automatically star all new studies
        };

        console.log('Project data prepared:', projectData.name);

        // Save to localStorage as primary storage
        const localStorageKey = `engagewise_${projectId}`;
        localStorage.setItem(localStorageKey, JSON.stringify(projectData));

        // Also save to projects index for easy retrieval
        let projectsIndex = JSON.parse(localStorage.getItem('engagewise_projects_index') || '[]');
        projectsIndex.push({
            id: projectId,
            name: name,
            description: description || '',
            createdAt: projectData.createdAt,
            userId: user.uid
        });
        localStorage.setItem('engagewise_projects_index', JSON.stringify(projectsIndex));

        console.log('Project saved to localStorage');

        // Try to sync with Firestore in the background (don't wait for it)
        setTimeout(() => {
            syncProjectToFirestore(projectData)
                .then(success => {
                    if (success) {
                        console.log('Project synced to Firestore successfully');
                    } else {
                        console.warn('Failed to sync project to Firestore');
                    }
                })
                .catch(error => {
                    console.error('Error syncing to Firestore:', error);
                });
        }, 100);

        return true;
    } catch (error) {
        console.error('Error saving project:', error);
        console.error('Error details:', error.stack);
        alert(`Error saving project: ${error.message}`);
        return false;
    }
}

// Background sync function to Firestore
async function syncProjectToFirestore(projectData) {
    try {
        // Don't block the main thread with this operation
        const user = firebase.auth().currentUser;
        if (!user) return false;

        // Convert dates to Firestore timestamps
        const firestoreData = {
            ...projectData,
            createdAt: firebase.firestore.Timestamp.fromDate(new Date(projectData.createdAt)),
            updatedAt: firebase.firestore.Timestamp.fromDate(new Date(projectData.updatedAt))
        };

        // Use a document ID based on the project ID
        const db = firebase.firestore();
        const userRef = db.collection('users').doc(user.uid);
        const studyRef = userRef.collection('studies').doc(projectData.id);

        // Set the data
        await studyRef.set(firestoreData);
        return true;
    } catch (error) {
        console.error('Firestore sync error:', error);
        return false;
    }
}

// Modal functionality
function setupModal() {
    const modal = document.getElementById('saveProjectModal');
    const saveBtn = document.getElementById('saveProjectBtn');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    const form = document.getElementById('saveProjectForm');
    const projectNameInput = document.getElementById('projectName');

    // Open modal
    saveBtn.addEventListener('click', () => {
        // Auto-fill project name from study title in userFormData
        if (userFormData && userFormData.studyTitle) {
            projectNameInput.value = userFormData.studyTitle;
        }
        modal.style.display = 'block';
    });

    // Close modal
    function closeModal() {
        modal.style.display = 'none';
        form.reset();
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        // Get form values
        const projectName = document.getElementById('projectName').value.trim();
        const projectDescription = document.getElementById('projectDescription').value.trim();

        if (!projectName) {
            alert('Please enter a project name');
            return;
        }

        console.log('Project name:', projectName);
        console.log('Project description:', projectDescription);

        // Disable form elements
        const saveBtn = form.querySelector('.save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        // Show saving indicator
        const savingIndicator = document.createElement('div');
        savingIndicator.className = 'saving-indicator';
        savingIndicator.innerHTML = `
            <div class="spinner"></div>
            <p>Saving your project...</p>
        `;
        form.appendChild(savingIndicator);

        try {
            // Save to localStorage (fast operation)
            const success = await saveProject(projectName, projectDescription);

            if (success) {
                // Replace saving indicator with success message
                savingIndicator.className = 'success-message';
                savingIndicator.innerHTML = `
                    <p>Project saved successfully!</p>
                    <p class="sync-note">Syncing in background...</p>
                `;

                // Show the My Studies button
                document.getElementById('myStudiesBtn').style.display = 'block';

                // Close modal after a short delay
                setTimeout(() => {
                    closeModal();
                }, 1500);
            } else {
                // Show error
                form.removeChild(savingIndicator);
                alert('Failed to save project. Please try again.');
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        } catch (error) {
            // Show error
            form.removeChild(savingIndicator);
            console.error('Error in form submission:', error);
            alert(`Error: ${error.message}`);
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    displayRecommendations();
    checkAuth();
    setupModal();
});