document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('studyForm');
    const generateBtn = form.querySelector('.generate-btn');

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

    const formFields = form.querySelectorAll('input, select');
    formFields.forEach(field => {
        field.addEventListener('input', checkFormValidity);
        field.addEventListener('change', checkFormValidity);
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = {
            studyTitle: form.studyTitle.value,
            diseaseArea: form.diseaseArea.value,
            gender: form.gender.value,
            ageGroup: form.ageGroup.value,
            studySetting: form.studySetting.value,
            timestamp: new Date().toISOString()
        };

        sessionStorage.setItem('studyFormData', JSON.stringify(formData));

        trackStudyInput(formData);

        window.location.href = 'recommendations.html';
    });

    function trackStudyInput(data) {
        try {
            const existingData = localStorage.getItem('studyAnalytics') || '[]';
            const analyticsData = JSON.parse(existingData);
            analyticsData.push(data);
            localStorage.setItem('studyAnalytics', JSON.stringify(analyticsData));

            if (typeof firebase !== 'undefined' && firebase.firestore) {
                firebase.firestore().collection('studyAnalytics')
                    .add({
                        ...data,
                        userAgent: navigator.userAgent,
                        screenSize: `${window.innerWidth}x${window.innerHeight}`,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    })
                    .catch(error => {
                        console.error("Error storing analytics: ", error);
                    });
            }
        } catch (error) {
            console.error("Error tracking study input: ", error);
        }
    }

    checkFormValidity();

    const existingData = sessionStorage.getItem('studyFormData');
    if (existingData) {
        const parsedData = JSON.parse(existingData);
        Object.keys(parsedData).forEach(key => {
            if (form[key]) {
                form[key].value = parsedData[key];
            }
        });
        checkFormValidity();
    }
});