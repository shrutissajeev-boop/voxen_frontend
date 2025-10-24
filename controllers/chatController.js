// controllers/chatController.js
const OpenAI = require("openai");

// Create OpenAI client using API key from .env
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Controller function to handle chat requests
exports.getChatResponse = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo", // you can also use "gpt-4o"
      messages: [{ role: "system", content: "You are VOXEN, an intelligent space exploration assistant." },
                { role: "user", content: message }],
    });

    const reply = response.choices[0].message.content;

    res.json({ reply });
  } catch (err) {
    console.error("OpenAI API error:", err.message);
    res.status(500).json({ error: "Failed to get chat response" });
  }
};
