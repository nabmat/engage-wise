document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('studyForm');
    const generateBtn = form.querySelector('.generate-btn');

    // Function to check if all required fields are filled
    function checkFormValidity() {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
            }
        });

        generateBtn.disabled = !isValid;
        generateBtn.style.opacity = isValid ? '1' : '0.5';
    }

    // Add event listeners to all form fields
    const formFields = form.querySelectorAll('input, select');
    formFields.forEach(field => {
        field.addEventListener('input', checkFormValidity);
        field.addEventListener('change', checkFormValidity);
    });

    // Handle form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Collect form data
        const formData = {
            studyTitle: form.studyTitle.value,
            diseaseArea: form.diseaseArea.value,
            gender: form.gender.value,
            ageGroup: form.ageGroup.value,
            studySetting: form.studySetting.value
        };

        // Store form data in session storage
        sessionStorage.setItem('studyFormData', JSON.stringify(formData));
        console.log('Form data saved:', formData); // Debug log

        // Redirect to recommendations page
        window.location.href = 'recommendations.html';
    });

    // Initial check
    checkFormValidity();

    // Debug: Check if there's existing data
    const existingData = sessionStorage.getItem('studyFormData');
    if (existingData) {
        console.log('Existing form data:', JSON.parse(existingData));
    }
}); 