const path = require('path');
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = {
        email: document.getElementById('email').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    // alert("Email: " + formData.email + "\nUsername: " + formData.username + "\nPassword: " + formData.password);
    try {
        const response = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            alert('Failed to sign up.');
        }

        const result = await response.text();
        alert('Success: ' + result);
    } catch (error) {
        console.error('Signup error:', error);
        alert('Failed to sign up: ' + error.message);
    }
});