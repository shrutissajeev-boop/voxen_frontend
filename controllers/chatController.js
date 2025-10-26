// controllers/chatController.js
const OpenAI = require("openai");
const pool = require("../config/db");

// Create OpenAI client using API key from .env
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Controller function to handle chat requests
exports.getChatResponse = async (req, res) => {
  try {
    const { message, conversationId, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    let convId = conversationId;

    // If no conversation ID, create a new conversation
    if (!convId && userId) {
      const newConv = await pool.query(
        `INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id`,
        [userId, 'New Chat']
      );
      convId = newConv.rows[0].id;
    }

    // Save user message to database
    if (convId) {
      await pool.query(
        `INSERT INTO messages (conversation_id, sender, content) VALUES ($1, $2, $3)`,
        [convId, 'user', message]
      );
    }

    // Get AI response
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo", // you can also use "gpt-4o"
      messages: [
        { role: "system", content: "You are VOXEN, an intelligent space exploration assistant." },
        { role: "user", content: message }
      ],
    });

    const reply = response.choices[0].message.content;

    // Save AI response to database
    if (convId) {
      await pool.query(
        `INSERT INTO messages (conversation_id, sender, content) VALUES ($1, $2, $3)`,
        [convId, 'ai', reply]
      );
    }

    res.json({ reply, conversationId: convId });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Failed to get chat response" });
  }
};

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT id, title, created_at, updated_at 
       FROM conversations 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [userId]
    );

    res.json({ conversations: result.rows });
  } catch (err) {
    console.error("Error fetching conversations:", err.message);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const result = await pool.query(
      `SELECT id, sender, content, created_at 
       FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC`,
      [conversationId]
    );

    res.json({ messages: result.rows });
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Create a new conversation
exports.createConversation = async (req, res) => {
  try {
    const { userId, title } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const result = await pool.query(
      `INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *`,
      [userId, title || 'New Chat']
    );

    res.json({ conversation: result.rows[0] });
  } catch (err) {
    console.error("Error creating conversation:", err.message);
    res.status(500).json({ error: "Failed to create conversation" });
  }
};

// Delete a conversation
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await pool.query(
      `DELETE FROM conversations WHERE id = $1`,
      [conversationId]
    );

    res.json({ message: "Conversation deleted successfully" });
  } catch (err) {
    console.error("Error deleting conversation:", err.message);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
};
