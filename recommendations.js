// Load and parse the JSON data
async function loadStudyData() {
    try {
        const response = await fetch('/Users/nabilmateen/Desktop/Work/EngageWise-Project/engage-wise/assets/Merged JSON for demo.json');
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
        const metrics = getMetricIndicator(study, index);

        // Safely get the paper title and description
        const title = study?.study_metadata?.title || 'Untitled Study';
        const description = study?.findings_and_implications?.key_findings ||
            study?.intervention_details?.[0]?.description ||
            `Study examining ${study?.study_metadata?.disease_area_1 || 'research methods'}`;

        const card = document.createElement('div');
        card.className = 'strategy-card';

        card.innerHTML = `
            <div class="add-icon">+</div>
            <div class="strategy-content">
                <div class="strategy-title">${title}</div>
                <div class="strategy-description">${description}</div>

                <div class="metrics">
                    <div class="metric">
                        <span class="metric-label">Recruitment Rate</span>
                        <span class="arrow ${metrics.recruitment}"></span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Response Rate</span>
                        <span class="arrow ${metrics.response}"></span>
                    </div>
                </div>

                <button class="add-strategy-btn">Add Strategy</button>
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

    const metrics = getMetricIndicator(null, index);

    card.innerHTML = `
        <div class="add-icon">+</div>
        <div class="strategy-content">
            <div class="strategy-title">Recruitment Strategy ${index + 1}</div>
            <div class="strategy-description">Strategy for improving study recruitment and participation.</div>
            <div class="metrics">
                <div class="metric">
                    <span class="metric-label">Recruitment Rate</span>
                    <span class="arrow ${metrics.recruitment}"></span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Rate</span>
                    <span class="arrow ${metrics.response}"></span>
                </div>
            </div>
            <button class="add-strategy-btn">Add Strategy</button>
        </div>
    `;

    return card;
}

// Get recruitment and response rate indicators based on position
function getMetricIndicator(study, index) {
    // First paper gets up arrows, second middle, third down
    if (index === 0) return { recruitment: 'up', response: 'up' };
    if (index === 1) return { recruitment: 'middle', response: 'middle' };
    return { recruitment: 'down', response: 'down' };
}

// Display recommendations based on user input
async function displayRecommendations() {
    try {
        // Get user input from session storage
        const userInput = JSON.parse(sessionStorage.getItem('studyFormData'));
        if (!userInput) {
            console.error('No user input found');
            return;
        }
        console.log('User input:', userInput);

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
                score: calculateRelevance(study, userInput)
            }))
            .filter(item => item.score > 0) // Only include relevant studies
            .sort((a, b) => b.score - a.score)
            .slice(0, 3); // Get top 3 recommendations

        console.log('Scored studies:', scoredStudies);

        const cardsContainer = document.querySelector('.strategy-cards');
        if (!cardsContainer) {
            console.error('Could not find strategy-cards container');
            return;
        }
        cardsContainer.innerHTML = ''; // Clear existing cards

        if (scoredStudies.length === 0) {
            // If no relevant studies found, show default cards
            for (let i = 0; i < 3; i++) {
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
            for (let i = 0; i < 3; i++) {
                cardsContainer.appendChild(createDefaultCard(i));
            }
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', displayRecommendations); 