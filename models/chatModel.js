const connection = require('./connection');

const saveMessage = async (nickName, message, time) => {
  const db = await connection();

  const newMessage = await db.collection('Chat')
    .insertOne({ nickName, message, time });
  return newMessage;
};

const getMessages = async () => {
  const db = await connection();
  return db.collection('Chat').find().limit(30).toArray();
};

module.exports = {
  saveMessage,
  getMessages,
};