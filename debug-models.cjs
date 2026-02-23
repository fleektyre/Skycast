const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
    }
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

if (!apiKey) {
    console.error("API Key not found in .env.local");
    process.exit(1);
}

// Remove quotes if present
apiKey = apiKey.replace(/^"|"$/g, '').replace(/^'|'$/g, '');

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error);
            } else {
                console.log("Available Models:");
                if (json.models) {
                    json.models.forEach(m => console.log(`- ${m.name}`));

                    const hasFlash = json.models.some(m => m.name.includes('gemini-1.5-flash'));
                    console.log("\nHas gemini-1.5-flash?", hasFlash);
                } else {
                    console.log("No models returned. Response:", json);
                }
            }
        } catch (e) {
            console.error("Error parsing response:", e);
            console.log("Raw response:", data);
        }
    });

}).on('error', (err) => {
    console.error("Network Error:", err);
});
