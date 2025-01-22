const { GoogleGenerativeAI } =require("@google/generative-ai");
require("dotenv").config();

const geminiApiKey = process.env.GEMINI_KEY;
const googleAI = new GoogleGenerativeAI(geminiApiKey);

const geminiConfig = {
  temperature: 0.9,
  topP: 1,
  topK: 1,
  maxOutputTokens: 4096,
};

const geminiModel = googleAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Use "gemini-1.5-flash" if needed
  geminiConfig,
});

const generate = async (req, res) => {
  try {
    console.log("Ai is getting prompt");

    const prompt = req.body?.prompt;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const result = await geminiModel.generateContent(prompt);
    const response = result.response;

    console.log("Generated response:", response.text());
    res.status(200).json({ response: response.text() });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
};

module.exports={generate}