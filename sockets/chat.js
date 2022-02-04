const { saveMessage } = require('../controller/chatController');

let users = [];

module.exports  = (io) => {
  io.on('connection', socket => {
    socket.on('saveNickname', nickName => {
      users.push(nickName);
        io.emit('usersOn', users);
    });
  
    socket.on('message', data => {
      saveMessage(data);
      io.emit('message', data);
      
      socket.on('disconnect', () => {
        users = users.filter((item) => item.id !== socket.id);
        socket.broadcast.emit('usersOn', users);
      })
    })
  })
}