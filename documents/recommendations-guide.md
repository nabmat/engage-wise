# EngageWise Recommendations System Guide

## Input to Recommendations Logic

The EngageWise recommendation system uses a rule-based matching algorithm to connect user study inputs with relevant evidence-based strategies. This document explains how the system works and how to modify it.

### Data Flow Overview

1. **User Input Collection**
   - Users provide study details through the Create Study form
   - Key data points collected:
     - Study Title
     - Disease Area
     - Target Gender
     - Age Group
     - Study Setting

2. **Data Processing**
   - Input data is standardized (lowercase, trimmed)
   - Keywords are extracted from free-text fields
   - Categorical fields are mapped to predefined categories

3. **Matching Algorithm**
   - The system compares processed input against a database of strategies
   - Multiple matching criteria are applied in sequence
   - Each strategy receives a relevance score based on match quality
   - Strategies are sorted by relevance score and presented to the user

### Matching Logic in Detail

The matching algorithm uses several techniques to find relevant strategies:

1. **Direct Category Matching**
   ```javascript
   // Example: Match by disease area
   if (studyData.diseaseArea === strategy.targetDiseaseArea) {
     strategy.relevanceScore += 3;
   }
   ```

2. **Keyword Extraction and Matching**
   ```javascript
   // Example: Extract keywords from study title
   const keywords = extractKeywords(studyData.studyTitle);
   
   // Match keywords against strategy tags
   const matchingKeywords = keywords.filter(kw => 
     strategy.tags.includes(kw)
   );
   
   strategy.relevanceScore += matchingKeywords.length;
   ```

3. **Demographic Matching**
   ```javascript
   // Example: Match by age group
   if (studyData.ageGroup === strategy.targetAgeGroup) {
     strategy.relevanceScore += 2;
   }
   ```

4. **Setting-Based Matching**
   ```javascript
   // Example: Match by study setting
   if (studyData.studySetting === strategy.recommendedSetting) {
     strategy.relevanceScore += 2;
   }
   ```

5. **Combination Rules**
   ```javascript
   // Example: Special case for combination of factors
   if (studyData.diseaseArea === "cancer" && 
       studyData.ageGroup === "elderly" && 
       studyData.studySetting === "community") {
     strategy.relevanceScore += 5;
   }
   ```

## Updating the Recommendation System

### Adding New Strategies

To add new evidence-based strategies to the system:

1. Open `recommendations.js`
2. Locate the `strategiesDatabase` array
3. Add a new strategy object following this structure:

```javascript
{
  id: "strategy123",              // Unique identifier
  title: "Community Engagement",  // Strategy name
  description: "Detailed description of the strategy...",
  evidenceLevel: 4,               // 1-5 scale (5 being strongest)
  targetDiseaseArea: "diabetes",  // Primary disease area
  targetAgeGroup: "adults",       // Target age group
  recommendedSetting: "community", // Ideal setting
  tags: [                         // Keywords for matching
    "community", 
    "engagement", 
    "underserved", 
    "recruitment"
  ],
  references: [                   // Scientific references
    "Author et al. (2023). Title. Journal, Vol(Issue), pages."
  ],
  implementationTips: [           // Practical implementation advice
    "Start by identifying community leaders",
    "Develop culturally appropriate materials"
  ]
}
```

### Modifying Matching Rules

To update how the system matches studies to strategies:

1. Open `recommendations.js`
2. Locate the `matchStudyToStrategies` function
3. Modify the scoring rules according to your requirements

Example of adding a new matching rule:
```javascript
// Add special consideration for pediatric studies
if (studyData.ageGroup.toLowerCase().includes("child") || 
    studyData.ageGroup.toLowerCase().includes("pediatric")) {
  
  // Boost strategies specifically designed for children
  if (strategy.tags.includes("pediatric") || 
      strategy.tags.includes("children")) {
    strategy.relevanceScore += 3;
  }
  
  // Reduce score for strategies designed for adults only
  if (strategy.tags.includes("adults-only")) {
    strategy.relevanceScore -= 2;
  }
}
```

### Tuning the Algorithm

To adjust how different factors are weighted:

1. Modify the scoring values in the matching rules
2. Higher values give more importance to that factor
3. Test with various study inputs to ensure balance

Example of reweighting factors:
```javascript
// Original weights
if (matchesDiseaseArea) score += 2;
if (matchesAgeGroup) score += 2;
if (matchesSetting) score += 2;

// Reweighted to prioritize disease area
if (matchesDiseaseArea) score += 4;  // Increased
if (matchesAgeGroup) score += 1;     // Decreased
if (matchesSetting) score += 1;      // Decreased
```

### Adding New Data Fields

To incorporate additional study characteristics:

1. Update the Create Study form in `create-study.html`
2. Modify the data collection in `create-study.js`
3. Add new matching rules in `recommendations.js`

Example of adding a new field:
```javascript
// In create-study.html
<div class="form-group">
  <label for="fundingSource">Funding Source</label>
  <select id="fundingSource" name="fundingSource">
    <option value="government">Government</option>
    <option value="industry">Industry</option>
    <option value="nonprofit">Non-profit</option>
    <option value="academic">Academic</option>
  </select>
</div>

// In recommendations.js
if (studyData.fundingSource === "industry" && 
    strategy.tags.includes("industry-compliance")) {
  strategy.relevanceScore += 3;
}
```

## Testing Recommendation Changes

After making changes to the recommendation system:

1. **Test with Diverse Inputs**
   - Create test cases covering different disease areas
   - Test with various demographic combinations
   - Test with different study settings

2. **Verify Expected Outcomes**
   - Check that high-relevance strategies appear at the top
   - Verify that inappropriate strategies are filtered out
   - Ensure edge cases are handled correctly

3. **Get Expert Feedback**
   - Have subject matter experts review the recommendations
   - Compare system output to expert manual recommendations
   - Adjust weights and rules based on feedback

## Maintenance Best Practices

1. **Regular Updates**
   - Review and update the strategy database quarterly
   - Add new evidence-based strategies as they emerge
   - Remove outdated strategies or mark them as legacy

2. **Version Control**
   - Document major changes to the matching algorithm
   - Consider implementing A/B testing for significant changes
   - Keep a changelog of modifications

3. **Performance Monitoring**
   - Track which strategies are frequently recommended
   - Monitor user engagement with recommendations
   - Identify gaps in the strategy database based on user inputs
