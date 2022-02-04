const chatModel = require('../models/chatModel'); 

async function saveMessage({ nickName, message, time }) {
  try {
    await chatModel.saveMessage(nickName, message, time);
  } catch (error) {
    console.log(error);
  }
}

async function getMessages(_req, res) {
  try {
    const result = await chatModel.getMessages();
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  saveMessage,
  getMessages,
};