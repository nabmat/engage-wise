# EngageWise Administrator Guide

## Basic Maintenance Tasks

### Accessing Analytics Data

EngageWise collects anonymous usage data to help improve the platform. This data is stored in two locations:

1. **Local Storage** (for development and testing)
   - Open the website in a browser
   - Open Developer Tools (F12 or right-click > Inspect)
   - Go to the "Application" tab
   - Under "Storage" > "Local Storage", select your website
   - Look for the key "studyAnalytics"
   - This contains a JSON array of all study inputs

2. **Firebase** (for production)
   - Log in to the Firebase Console (https://console.firebase.google.com/)
   - Select your project
   - Navigate to "Firestore Database"
   - Browse the "studyAnalytics" collection
   - Each document represents one study input

### Exporting Analytics Data

To export analytics data for further analysis:

**From Firebase:**
1. Go to Firebase Console > Firestore
2. Click the three dots next to the "studyAnalytics" collection
3. Select "Export Collection"
4. Follow the prompts to download the data as JSON or CSV

**From Local Storage (Development):**
1. In Developer Tools > Application > Local Storage
2. Right-click on "studyAnalytics" and select "Copy Value"
3. Paste into a text file and save with .json extension

### Updating Recommendation Logic

The recommendation engine matches user inputs to appropriate strategies. To update this logic:

1. Open `recommendations.js`
2. Locate the `generateRecommendations` function
3. Modify the matching rules according to your requirements
4. Test thoroughly before deploying to production

Example of adding a new matching rule:
```javascript
// Find recommendations for specific disease area and setting
if (studyData.diseaseArea === "diabetes" && studyData.studySetting === "community") {
    relevantRecommendations.push(...recommendationsData.filter(rec => 
        rec.tags.includes("diabetes") || rec.tags.includes("community-setting")
    ));
}
```

### Adding New Recommendations

To add new recommendations to the database:

1. Open `recommendations.js`
2. Locate the `recommendationsData` array
3. Add new recommendation objects following the existing format

Example:
```javascript
{
    id: "rec123",
    title: "Use Community Health Workers for Recruitment",
    description: "Engaging local community health workers can improve recruitment rates in underserved populations by 40%.",
    category: "recruitment",
    evidenceLevel: 4,
    relevanceScore: 0, // Will be calculated dynamically
    tags: ["community", "underserved", "recruitment"],
    references: ["Smith et al., 2023. Journal of Community Health"]
}
```

### Website Maintenance

#### Updating Content

1. HTML pages can be edited directly to update content
2. For major content changes, consider:
   - Maintaining consistent styling
   - Testing on multiple devices
   - Checking for broken links

#### Adding New Pages

1. Create a new HTML file following the existing template structure
2. Include the standard header and footer
3. Link to the necessary CSS files
4. Add navigation links in the header as needed
5. Update the sitemap if one exists

### Troubleshooting Common Issues

#### Analytics Not Recording

1. Check browser console for JavaScript errors
2. Verify Firebase configuration in `firebase-config.js`
3. Ensure the user has completed the form correctly
4. Check network connectivity

#### Recommendations Not Displaying

1. Verify the form data is being passed correctly
2. Check the console for any JavaScript errors
3. Ensure the recommendations data array contains entries
4. Verify the matching logic is working as expected

#### Mobile Display Issues

1. Test on multiple devices or use browser developer tools to simulate
2. Check responsive CSS breakpoints
3. Verify media queries are working correctly
4. Test touch interactions for mobile-specific features

## Backup and Recovery

### Backing Up Data

1. **Firebase Data**
   - Regular exports should be scheduled from Firebase Console
   - Store exports in a secure location with version control

2. **Website Files**
   - Maintain a Git repository for all website files
   - Regularly commit changes with descriptive messages
   - Consider using branches for major updates

### Recovery Procedures

1. **Restoring Firebase Data**
   - Import the latest backup through Firebase Console
   - Verify data integrity after import

2. **Restoring Website Files**
   - Deploy the latest stable version from your Git repository
   - Test functionality after deployment

## Security Maintenance

### Regular Tasks

1. **Update Dependencies**
   - Check for updates to Firebase SDK
   - Update any third-party libraries used

2. **Security Audits**
   - Regularly review Firebase security rules
   - Check for exposed API keys or credentials
   - Verify proper input validation
   - Test for common vulnerabilities (XSS, CSRF)

3. **Access Control**
   - Regularly review admin access to Firebase
   - Rotate admin credentials periodically
   - Remove access for departed team members

## Performance Optimization

1. **Image Optimization**
   - Regularly check and optimize images for web
   - Consider implementing lazy loading for images

2. **Code Minification**
   - Minify JS and CSS files for production
   - Remove unused code and comments

3. **Caching Strategy**
   - Implement appropriate cache headers
   - Use versioning for assets to manage cache busting
