import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import io from 'socket.io-client';
import languages from './data';
import Br from './img/brazil.png';
import Usa from './img/Usa.png';
import Casual from './img/casual.jpg';
import Rebel from './img/rebel.jpg';
import Imperial from './img/imperial.jpg';

const socket = io('https://backsocket-xmm01sbe.b4a.run/');

// const socket = io('http://localhost:3002');

export default function Chat() {

  const [language, setLanguage] = useState(languages[0]);
  const [visible, setVisible] = useState(true);
  const [disabled, setDisabled] = useState(true);
  const [disabledM, setDisabledM] = useState(true);
  const [nickName, setNickName] = useState("");
  const [users, setUsers] = useState([]);
  const [theme, setTheme] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, upMessages] = useState([]);
  const [dbMessage, setDbMessage] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);

  const nickNameRef = useRef(null);
  const messageInputRef = useRef(null);

  const socket = socketIOClient('https://backsocket-xmm01sbe.b4a.run/');

  function handleLanguage(lan) {
    if (lan === 'Português') {
      setLanguage(languages[0]);
    } else {
      setLanguage(languages[1]);
    }
  }

  function emitNick() {
    if (nickName.length !== 0) {
      socket.emit('saveNickname', nickName);
    } else {
      nickNameRef.current.value = "";
      nickNameRef.current.focus();
      setVisible(false);
    }
  }

  function emitMessage() {
    var date = new Date().toString();
    var dateFormated = `${date.slice(8, 10)}/${date.slice(4, 7)}/${date.slice(11, 15)} ${date.slice(16, 24)}`;
    if (message.length) {
      var messageObj = {
        nickName: nickName,
        message: message,
        time: dateFormated,
      }
      socket.emit('message', messageObj)
      setDisabledM(false);
      messageInputRef.current.value = "";
      messageInputRef.current.focus();
      setMessage("");
    }
  }

  //Atualizando Users
  useEffect(() => {
    const addUser = newUser => setUsers([...users, newUser])
    socket.on('usersOn', addUser)
    return () => socket.off('usersOn', addUser);
  }, [users]);

  //Disable do Button Nick
  useEffect(() => {
    if (nickName.length && theme === true) {
      setDisabled(false);
    }
  }, [nickName, theme]);

  //Disable do Button MSG
  useEffect(() => {
    if (message.length > 0) {
      setDisabledM(false);
    }
  }, [message])

  //Atualizando Messages
  useEffect(() => {
    const addNewMessage = newMessage => upMessages([...messages, newMessage])
    socket.on('message', addNewMessage)
    return () => socket.off('message', addNewMessage);
  }, [messages])

  const fetchMessages = async () => {
    try {
      const result = await axios.get("https://backsocket-xmm01sbe.b4a.run/");
      const { data } = result;
      console.log(data)
      if (data.length > 0) {
        setDbMessage(data);
      };
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div id="main">
      <div className={visible ? "visible" : "inVisible"}>
        <div className="Mascara">
          <img className="Casual" src={Casual} alt='Casual' />
          <img className="Rebel" src={Rebel} alt='Rebel' />
          <img className="Imperial" src={Imperial} alt='Imperial' />
        </div>
        <div className="Modal">
          <div id="Idioma">
            <div className="center">
              <p>Escolha o Idioma - Choose your Language</p>
            </div>
            <div className="buttonCont center">
              <button
                className="langButton"
                onClick={() => {
                  handleLanguage('Português');
                }}>
                <img src={Br} alt="Português" />
              </button>
              <button
                className="langButton"
                onClick={() => {
                  handleLanguage('English');
                }}
              >
                <img src={Usa} alt="English" />
              </button>
            </div>
          </div>
          <div id="Theme">
            <div className="center">
              <p>{language.Theme}</p>
            </div>
            <br/>
            <br/>
            <div className="themeb">
              <button
                className={`send ${selectedTheme === Casual ? 'selected' : ''}`}
                onClick={() => {
                  document.getElementById("mainChat").style.backgroundImage = "url(" + Casual + ")";
                  setTheme(true);
                  setSelectedTheme(Casual);
                }}
              >{
                  language.Casual}
              </button>
              <button
                className={`send ${selectedTheme === Rebel ? 'selected' : ''}`}
                onClick={() => {
                  document.getElementById("mainChat").style.backgroundImage = "url(" + Rebel + ")";
                  setTheme(true);
                  setSelectedTheme(Rebel);
                }}
              >
                {language.Rebel}
              </button>
              <button
                className={`send ${selectedTheme === Imperial ? 'selected' : ''}`}
                onClick={() => {
                  document.getElementById("mainChat").style.backgroundImage = "url(" + Imperial + ")";
                  document.getElementById("ttusers").style.color = "#fff";
                  document.getElementById("ttusers").style.textShadow = "#000";
                  document.getElementById("ttmsg").style.color = "#fff";
                  document.getElementById("ttmsg").style.textShadow = "#000";
                  setTheme(true);
                  setSelectedTheme(Imperial);
                }}
              >
                {language.Galactic}
              </button>
            </div>
          </div>
              <div className="buttonCont center">
              <p>{language.Init}</p>
            </div>
            <form
              className="buttonCont center"
              onSubmit={(event) => {
                event.preventDefault(); // Isso impede que a página seja recarregada
                emitNick();
              }}
            >
              <div className="inpbut">
                <input
                  id="nickName"
                  type="text"
                  className="nickName"
                  onChange={(event) => {
                    setNickName(event.target.value);
                  }}
                />
                <button
                  id="Goin"
                  className="send"
                  disabled={disabled}
                  onClick={() => {
                    emitNick();
                  }}
                >
                  {language.GoIn}
                </button>
              </div>
            </form>
        </div>
      </div>
      <div id="mainChat">
        <br/>
        <br/>

        <h3 className="title">STAR WARS WEB CHAT</h3>
        <div className="container" >
          <div id="ttusers"><p>{language.Users}</p></div>
          <div id="ttmsg"><p>{language.Messages}</p></div>
        </div>
        <div className="container">
          {console.log(users)}
          <div id="users" >
            {users.map((user, index) => (
              <div
                className="baloonUsers"
                key={index}
              >
                {user[index]}
              </div>
            ))}
          </div>
          <div id="messages">
            {dbMessage.map((m, index) => (
              <div
                className="baloonbd"
                key={index}
              >
                <p className="time">{m.time}</p>
                <p className="nick">{m.nickName}:</p>
                <p>{m.message}</p>
              </div>
            ))}
            {messages.map((m, index) => (
              <div
                className="baloon"
                key={index}
              >
                <p className="time">{m.time}</p>
                <p className="nick">{m.nickName}:</p>
                <p>{m.message}</p>
              </div>
            ))}
          </div>
        </div>
        <br/>

        <div className="container">
          <form
            onSubmit={(event) => {
              event.preventDefault(); // Isso impede que a página seja recarregada
              emitMessage();
            }}
          >
            <div className="inpbut">
              <input
                id="MessInput"
                className="minput"
                type="text"
                autoComplete="off"
                placeholder={language.Place}
                onChange={(event) => {
                  setMessage(event.target.value)
                }}
              />
              <button
                disabled={disabledM}
                onClick={() => {
                  emitMessage();
                }}
                className="send"
              >{language.Send}
              </button>
            </div>
          </form>
        </div>
        <br/>

        <button
          className="exit"
          onClick={() => {
            socket.emit('userExit', nickName); // Emita um evento com o nome de usuário
            socket.disconnect();
            window.location.reload()
          }}
        >
          {language.Exit}
        </button>
      </div>
    </div >
  )
}
