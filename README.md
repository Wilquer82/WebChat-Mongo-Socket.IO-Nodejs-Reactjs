Web Chat Star Wars

Endereço do projeto: https://61fd31cc11a0ed0cbc3bb70f--kind-perlman-ef2623.netlify.app/
Back-End: https://wilquerwebchat.herokuapp.com/
Banco de dados: MongoDB

## 🚀 Começando

1.  Crie uma pasta para o projeto.

2. Realize "git clone https://github.com/Wilquer82/webchat.git"

3. E depois "git clone -b backend --single-branch https://github.com/Wilquer82/webchat.git"


### 📋 Pré-requisitos

4. Realize npm install nas duas pastas geradas. (https://nodejs.org/en/)

5. Para rodar localmente é necessário subistituir as linhas onde aparacem:

    const socket = io('https://wilquerwebchat.herokuapp.com/')-> Arquivo Chat.js linha 12 -> por const socket = io("localhost:3001")
    e
    ("https://wilquerwebchat.herokuapp.com/get") -> Arquivo Chat.js linha 97 -> por "localhost:3001/get")
    
    Obs.: Caso não faça isso o Front-end roda em sua máquina, e o Back-End no heroku.
    
## 🛠️ Construído com

- React.js
- Node.js
- Express.js
- Socket.io
- HTML5
- CSS
- Axios
- MongoDb
- Heroku
- Netlify

## ✒️ Autores

Wlquer Figueiredo

## 🎁 Expressões de gratidão

- A Deus em Primeiro lugar.
- A Minha esposa Silmara e filhas, Agnes e Melissa (pela paciência).
- A Trybe, pois hoje sou melhor que ontem graças a esta instituição.
-  Diego Fernandes da RocketSeat pelos videos que muito auxiliaram. (https://www.youtube.com/channel/UCSfwM5u0Kce6Cce8_S72olg)
-  Também a Matheus Castiglioni e seus vídeos muito didáticos. (https://www.youtube.com/channel/UCSrG4Y5uz0dcSfi_2qMQdGQ)
