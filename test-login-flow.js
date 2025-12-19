

// Actually node 18+ has global fetch.

async function main() {
    const baseUrl = "http://localhost:3000";

    console.log("Fetching CSRF token...");
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    console.log("CSRF Token:", csrfToken);

    // Cookies are needed for NextAuth to verify CSRF
    const cookies = csrfRes.headers.get("set-cookie");

    console.log("Attempting login...");
    const params = new URLSearchParams();
    params.append("email", "test2@example.com");
    params.append("password", "password123");
    params.append("csrfToken", csrfToken);
    params.append("json", "true");

    const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": cookies
        },
        body: params
    });

    console.log("Login status:", loginRes.status);
    const text = await loginRes.text();
    console.log("Login response:", text);
}

main().catch(console.error);
