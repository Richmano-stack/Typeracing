
async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            })
        });

        const text = await res.text();
        try {
            const data = JSON.parse(text);
            console.log('Status:', res.status);
            console.log('Response:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('Status:', res.status);
            console.log('Response (Text):', text);
        }
    } catch (err) {
        console.error('Error:', err);
    }
}
test();
