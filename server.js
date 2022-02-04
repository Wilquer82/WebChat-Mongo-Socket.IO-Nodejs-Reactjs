const express = require('express');
const app = express();
const { getMessages } = require('./controller/chatController');
const server = require('http').createServer(app);
const cors = require('cors')
const PORT = process.env.PORT || 3001;

const options = {
    methods: ['GET', 'POST'],
    origin:'*', 
    credentials: true,  
    optionSuccessStatus: 200,
  }

app.use(cors(options));

app.use(express.json());

const io = require('socket.io')(server, {
  cors: options
});

require('./sockets/chat')(io);

app.get('/', getMessages); 
app.use('/get', getMessages);

server.listen(PORT, () => {
  console.log(`Porta ${PORT}`);
});