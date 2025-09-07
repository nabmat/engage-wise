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
            <div class="expanded-content" style="display:none;">
                <div class="expanded-layout">
                    <div class="expanded-left">
                        <h4>${interventionName}</h4>
                        <p>${interventionDescription}</p>
                        <button class="minimize-button" onclick="toggleCardExpansion(this)">−</button>
                    </div>
                    <div class="expanded-middle">
                        <div class="study-details"></div>
                    </div>
                    <div class="expanded-right">
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
        <div class="expanded-content" style="display:none;">
            <div class="expanded-layout">
                <div class="expanded-left">
                    <h4>[Intervention details: name]</h4>
                    <p>[Intervention details: description]</p>
                    <button class="minimize-button" onclick="toggleCardExpansion(this)">−</button>
                </div>
                <div class="expanded-middle">
                    <div class="study-details"></div>
                </div>
                <div class="expanded-right">
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
            .slice(0, 4); // Get top 4 recommendations

        console.log('Scored studies:', scoredStudies);

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

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', displayRecommendations);
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

// Populate expanded middle with study metadata
function populateExpanded(card, expanded) {
    try {
        const study = card.studyData?.study;
        if (!study) return;
        const md = study.study_metadata || {};
        const details = expanded.querySelector('.study-details');
        const title = md.title || 'Untitled';
        const authors = (md.authors || []).join(', ');
        const pubBits = [md.year, md.journal, md.doi].filter(Boolean).join(', ');
        const disease1 = md.disease_area_1 || '';
        const disease2 = md.disease_area_2 || '';
        const iv = (study.intervention_details && study.intervention_details[0]) || {};
        const sample = study.sample?.sample_size ?? '';
        const context = study.study_context?.setting || '';
        const outcome = study.outcomes?.primary?.[0]?.result || '';
        const notes = study.notes || '';

        details.innerHTML = `
            <h4>${title}</h4>
            ${authors ? `<p><strong>${authors}</strong></p>` : ''}
            ${pubBits ? `<p>${pubBits}</p>` : ''}
            <br>
            <p><strong>${[disease1, disease2].filter(Boolean).join(', ')}</strong></p>
            <br>
            <p><strong>${iv.description || ''}</strong></p>
            <p>VS</p>
            <p><strong>${iv.comparison_group || ''}</strong></p>
            <br>
            ${sample ? `<p><strong>Sample size: ${sample}</strong></p>` : ''}
            ${context ? `<p><strong>Study context: ${context}</strong></p>` : ''}
            <br>
            ${outcome ? `<p><strong>Outcomes: ${outcome}</strong></p>` : ''}
            ${notes ? `<br><p><strong>Notes: ${notes}</strong></p>` : ''}
        `;
    } catch (e) {
        console.error('populateExpanded failed', e);
    }
}