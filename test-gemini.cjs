const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function test() {
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        const apiKey = env.match(/VITE_API_KEY=(.*)/)[1].trim().replace(/^["']|["']$/g, '');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        console.log("Testing gemini-2.5-flash...");
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log("Response:", response.text());
        console.log("SUCCESS!");
    } catch (e) {
        console.error("FAILURE:", e.message);
        if (e.response) {
            console.error("Response data:", e.response);
        }
    }
}

test();
