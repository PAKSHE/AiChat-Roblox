// server.js

// 1. Import all necessary modules using ES Module syntax (import)
import express from 'express';
import bodyParser from 'body-parser';
import { default as fetch, Headers, Request, Response } from 'node-fetch'; // Import specific exports from node-fetch
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'; // Named imports
import fs from 'fs'; // Import fs if it's used elsewhere (though not directly used in the provided snippet)

// 2. Initialize Express app
const app = express();
const PORT = 8080;

// 3. Middleware to parse JSON request bodies
app.use(bodyParser.json());

// 4. Set globalThis properties for fetch API compatibility if needed by @google/generative-ai
// Note: With node-fetch v3+, this might not be strictly necessary if @google/generative-ai handles fetch itself,
// but it's a common pattern for libraries expecting global fetch.
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;


// IMPORTANT: Ensure you have an environment variable named AI_KEY set with your Google AI API key.
// Example: AI_KEY="YOUR_API_KEY_HERE"
const apiKey = process.env.AI_KEY;

// Check if API Key is provided
if (!apiKey) {
    console.error("Error: AI_KEY environment variable is not set.");
    console.error("Please set the AI_KEY environment variable with your Google AI API key.");
    process.exit(1); // Exit the process if API key is missing
}

const genai = new GoogleGenerativeAI(apiKey);

// Configuration for text generation
const generationConfig = {
    temperature: 0,
    topP: 0.95,
    topK: 64,
    responseMimeType: "text/plain"
};

/**
 * Runs a chat session with the Google Generative AI model.
 * @param {string} prompt - The user's input prompt.
 * @param {Array} history - The chat history (array of { role: string, parts: Array<{ text: string }> }).
 * @returns {Promise<{ Response: boolean, text?: string }>} - An object indicating success and the response text if successful.
 */
async function run(prompt, history) {
    try {
        const model = genai.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "Make every response very short,maximum 150 characters length",
        });

        // Start a chat session with the provided history and generation configuration
        const chatSession = model.startChat({
            generationConfig,
            history: history,
        });

        // Send the user's prompt and get the response
        const result = await chatSession.sendMessage(prompt);
        return { Response: true, text: result.response.text() };
    } catch (err) {
        console.error("Error during AI model interaction:", err); // Use console.error for errors
        return { Response: false };
    }
}

// Define the POST endpoint for chat interaction
app.post("/", async (req, res) => {
    const prompt = req.body.prompt;
    // Ensure history is an array, default to empty if not provided
    const history = req.body.history || [];

    // Validate prompt
    if (!prompt) {
        return res.status(400).send("Prompt is required.");
    }

    // Call the run function with prompt and history
    const response = await run(prompt, history);

    if (response.Response === true) {
        res.status(200).send(response.text);
    } else {
        res.status(500).send("Error processing request. Check server logs for details.");
    }
});

// Start the server
app.listen(PORT, () =>
    console.log(`Server is running on http://localhost:${PORT}`)
);

// 5. If you need to export 'app' for testing or other modules in an ES Module context, use 'export default'
// export default app; // Uncomment if you intend to import 'app' in other ES Modules
// Note: If this file is the main entry point and not intended to be imported, you don't need 'export default'.
// module.exports is not available in ES Modules.