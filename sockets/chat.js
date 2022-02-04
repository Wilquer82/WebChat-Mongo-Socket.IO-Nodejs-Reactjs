const { saveMessage } = require('../controller/chatController');

module.exports = (io) => {
  let users = [];
  io.on('connection', socket => {
    socket.on('saveNickname', nickName => {
      users.push(nickName);
      io.emit('usersOn', users);
  
      socket.on('message', data => {
        saveMessage(data);
        io.emit('message', data);
      
        socket.on('disconnect', () => {
          let usersActual = users.filter((item) => item !== nickName);
          console.log(usersActual);
          socket.emit('usersOn', usersActual);
        })
      })
    })
  })
}