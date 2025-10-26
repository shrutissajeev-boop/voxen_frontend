// routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const { 
  getChatResponse, 
  getConversations, 
  getMessages, 
  createConversation, 
  deleteConversation 
} = require("../controllers/chatController");

// POST /api/chat - Send a message and get AI response
router.post("/", getChatResponse);

// GET /api/chat/conversations/:userId - Get all conversations for a user
router.get("/conversations/:userId", getConversations);

// GET /api/chat/messages/:conversationId - Get all messages in a conversation
router.get("/messages/:conversationId", getMessages);

// POST /api/chat/conversations - Create a new conversation
router.post("/conversations", createConversation);

// DELETE /api/chat/conversations/:conversationId - Delete a conversation
router.delete("/conversations/:conversationId", deleteConversation);

module.exports = router;
