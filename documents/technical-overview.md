# EngageWise Technical Overview

## Architecture Overview

EngageWise is built as a client-side web application with a simple architecture that can be extended with backend services as needed. The current implementation focuses on providing a user-friendly interface for researchers to assess their study readiness and receive recommendations.

### Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Storage**: 
  - Client-side: LocalStorage, SessionStorage
  - Server-side (future): Firebase Firestore
- **Authentication** (planned): Firebase Authentication
- **Hosting**: Standard web hosting with HTTPS support

### Key Components

1. **Public Pages**
   - Homepage (`homepage.html`)
   - Our Story (`our-story.html`)
   - Insights (`insights.html`)
   - Terms and Privacy (`terms.html`, `privacy-policy.html`)

2. **Core Application**
   - Study Readiness Quiz (`quiz.html`)
   - Dashboard (`dashboard.html`)
   - Create Study Form (`create-study.html`)
   - Recommendations Engine (`recommendations.js`, `recommendations.html`)
   - Study Details (`study-details.html`)

3. **Data Flow**
   - User input is collected through forms
   - Data is temporarily stored in SessionStorage for immediate use
   - Analytics data is stored in LocalStorage and optionally sent to Firestore
   - Recommendations are generated based on predefined rules in `recommendations.js`

### File Structure

```
engage-wise/
├── assets/                  # Images and static assets
├── *.html                   # HTML pages
├── *.css                    # CSS stylesheets
├── *.js                     # JavaScript files
└── documentation/           # Documentation files
```

## Data Model

### Study Data
```json
{
  "studyTitle": "string",
  "diseaseArea": "string",
  "gender": "string",
  "ageGroup": "string",
  "studySetting": "string",
  "timestamp": "ISO date string"
}
```

### Analytics Data
```json
{
  "studyData": { /* Study Data Object */ },
  "userAgent": "string",
  "screenSize": "string",
  "timestamp": "ISO date string/Firestore timestamp"
}
```

### Recommendation Data
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "evidenceLevel": "number",
  "relevanceScore": "number",
  "references": ["string"]
}
```

## Extension Points

1. **Backend Integration**
   - The application is designed to be easily connected to a backend service
   - Firebase integration is partially implemented for analytics
   - Authentication can be added using Firebase Auth

2. **Recommendation Engine**
   - Currently uses client-side matching logic
   - Can be extended to use machine learning or more complex algorithms
   - API integration points are available in `recommendations.js`

3. **User Management**
   - User accounts and profiles can be implemented
   - Role-based access control can be added

## Browser Compatibility

The application is designed to work on:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Android Chrome)

Responsive design ensures compatibility with devices of all sizes.

## Performance Considerations

- Images are optimized for web
- CSS and JS are kept minimal
- No heavy frameworks are used
- Lazy loading is implemented for non-critical resources

## Security Considerations

- All form inputs should be validated
- No sensitive data is stored in client-side storage
- HTTPS should be enforced for all connections
- Content Security Policy should be implemented
- Regular security audits should be conducted
