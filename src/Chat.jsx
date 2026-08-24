import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const apiUrl = (import.meta.env.VITE_API_URL || 'https://backsocket-2jc4.onrender.com').replace(/\/$/, '');
const socket = io(apiUrl, { autoConnect: false });
const base64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const bytes = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

const translations = {
  pt: {
    title: 'Converse sem deixar a chave escapar.',
    subtitle: 'Crie uma conta para proteger sua identidade e suas salas.',
    nickname: 'Seu apelido',
    password: 'Senha',
    enter: 'Entrar',
    createAccount: 'Criar conta',
    registerPrompt: 'Ainda não tenho conta',
    loginPrompt: 'Já tenho uma conta',
    theme: 'Escolha o tema',
    language: 'Idioma',
    logout: 'Sair',
    protectedRoom: 'Sala protegida',
    roomMembers: 'Na sala',
    openRooms: 'Salas abertas',
    roomsAvailable: 'disponíveis',
    createRoom: 'Nova sala',
    roomName: 'Nome',
    roomId: 'Identificador',
    hiddenRoom: 'Sala invisível na lista',
    create: 'Criar sala',
    joinRoom: 'Entrar em',
    enterKey: 'Qual é a chave?',
    roomPassword: 'Senha da sala',
    chooseSpace: 'Escolha seu espaço.',
    blocked: 'Bloquear',
    unblocked: 'Desbloquear',
    send: 'Enviar',
    encryptedMessage: 'Mensagem cifrada...',
    createdBy: 'criada por',
    ghostAlias: 'Alias fantasma',
    ghostDescription: 'Digite um nome alternativo para entrar em modo fantasma',
    roomPasswordLabel: 'Senha da sala',
    checkMembers: 'Verificar quem está na sala',
    checkingMembers: 'Verificando...',
    membersFound: 'Pessoas na sala',
    noMembers: 'Ninguém está na sala.',
    memberCheckError: 'Não foi possível verificar quem está na sala.',
    firstRoom: 'Crie a primeira sala.',
    genericError: 'Não foi possível autenticar.',
    roomListError: 'Não foi possível carregar as salas.',
  },
  en: {
    title: 'Talk without letting the key slip away.',
    subtitle: 'Create an account to protect your identity and your rooms.',
    nickname: 'Your nickname',
    password: 'Password',
    enter: 'Log in',
    createAccount: 'Create account',
    registerPrompt: 'I do not have an account yet',
    loginPrompt: 'I already have an account',
    theme: 'Choose the theme',
    language: 'Language',
    logout: 'Log out',
    protectedRoom: 'Protected room',
    roomMembers: 'In the room',
    openRooms: 'Open rooms',
    roomsAvailable: 'available',
    createRoom: 'New room',
    roomName: 'Name',
    roomId: 'Identifier',
    hiddenRoom: 'Hidden room from the list',
    create: 'Create room',
    joinRoom: 'Join',
    enterKey: 'What is the key?',
    roomPassword: 'Room password',
    chooseSpace: 'Choose your space.',
    blocked: 'Block',
    unblocked: 'Unblock',
    send: 'Send',
    encryptedMessage: 'Encrypted message...',
    createdBy: 'created by',
    ghostAlias: 'Ghost alias',
    ghostDescription: 'Enter an alternate name to join in ghost mode',
    roomPasswordLabel: 'Room password',
    checkMembers: 'Check who is in the room',
    checkingMembers: 'Checking...',
    membersFound: 'People in the room',
    noMembers: 'Nobody is in the room.',
    memberCheckError: 'Could not check who is in the room.',
    firstRoom: 'Create the first room.',
    genericError: 'Could not authenticate.',
    roomListError: 'Could not load rooms.',
  },
};

const themeOptions = {
  casual: { label: 'Casual', page: 'linear-gradient(135deg, #f4f1e9 0%, #e5e8d8 100%)', paper: '#f4f1e9', surface: 'rgba(255,255,255,.55)', message: '#ffffff', ink: '#172321', muted: '#66736d', lime: '#c8f169', coral: '#ff735c', line: '#d6d9cb', buttonHover: '#2c403a' },
  galactic: { label: 'Galactic Empire', page: 'linear-gradient(135deg, #0b101c 0%, #182943 100%)', paper: '#101623', surface: 'rgba(31,48,75,.86)', message: '#1d2d49', ink: '#eef4ff', muted: '#a6b5d1', lime: '#8dd7ff', coral: '#ff6b6b', line: '#405675', buttonHover: '#263c61' },
  rebel: { label: 'Rebel Alliance', page: 'linear-gradient(135deg, #f6e9d6 0%, #ead9be 100%)', paper: '#f6e9d6', surface: 'rgba(255,255,255,.5)', message: '#fffaf1', ink: '#231b17', muted: '#7f6a5e', lime: '#f0d067', coral: '#d65a45', line: '#ead9be', buttonHover: '#4c2921' },
};

async function keyFor(password, room) {
  const source = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode(`ChatSocket:${room}`), iterations: 120000, hash: 'SHA-256' }, source, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function encrypt(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  return { ciphertext: base64(ciphertext), iv: base64(iv) };
}

async function decrypt(key, item) {
  try {
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(item.iv) }, key, bytes(item.ciphertext)));
  } catch (_error) {
    return '[mensagem protegida por outra senha]';
  }
}

export default function Chat() {
  const [token, setToken] = useState(localStorage.getItem('chat-token') || '');
  const [userId, setUserId] = useState(localStorage.getItem('chat-user-id') || '');
  const [nickName, setNickName] = useState(localStorage.getItem('chat-name') || '');
  const [accountMode, setAccountMode] = useState('login');
  const [accountPassword, setAccountPassword] = useState('');
  const [language, setLanguage] = useState('pt');
  const [theme, setTheme] = useState('casual');
  const [room, setRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ name: '', slug: '', password: '', hidden: false });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [ghost, setGhost] = useState('');
  const [roomUsersPreview, setRoomUsersPreview] = useState(null);
  const [checkingMembers, setCheckingMembers] = useState(false);
  const [error, setError] = useState('');
  const keyRef = useRef(null);
  const currentTheme = themeOptions[theme] || themeOptions.casual;
  const strings = translations[language] || translations.pt;
  const themeStyle = { '--page': currentTheme.page, '--paper': currentTheme.paper, '--surface': currentTheme.surface, '--message': currentTheme.message, '--ink': currentTheme.ink, '--muted': currentTheme.muted, '--lime': currentTheme.lime, '--coral': currentTheme.coral, '--line': currentTheme.line, '--button-hover': currentTheme.buttonHover };

  const loadRooms = async (currentToken = token) => {
    try {
      setRooms((await axios.get(`${apiUrl}/rooms`, auth(currentToken))).data);
    } catch (_error) {
      setError(strings.roomListError);
    }
  };

  useEffect(() => {
    if (token) {
      axios.get(`${apiUrl}/rooms`, auth(token))
        .then((response) => setRooms(response.data))
        .catch(() => setError(strings.roomListError));
    }
  }, [token, strings.roomListError]);

  useEffect(() => {
    const receiveMessage = async (item) => {
      const text = await decrypt(keyRef.current, item);
      setMessages((current) => [...current, { ...item, text }]);
    };

    socket.on('message', receiveMessage);
    socket.on('usersOn', setUsers);

    return () => {
      socket.off('message', receiveMessage);
      socket.off('usersOn', setUsers);
    };
  }, []);

  const login = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const result = (await axios.post(`${apiUrl}/auth/${accountMode}`, { nickName, password: accountPassword })).data;
      localStorage.setItem('chat-token', result.token);
      localStorage.setItem('chat-name', result.nickName);
      localStorage.setItem('chat-user-id', result.userId);
      setToken(result.token);
      setUserId(result.userId);
      setNickName(result.nickName);
      setAccountPassword('');
    } catch (caught) {
      setError(caught.response?.data?.error || strings.genericError);
    }
  };

  const createRoom = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await axios.post(`${apiUrl}/rooms`, form, auth(token));
      setForm({ name: '', slug: '', password: '', hidden: false });
      loadRooms();
    } catch (caught) {
      setError(caught.response?.data?.error || 'Não foi possível criar a sala.');
    }
  };

  const join = async (selectedRoomItem, secret = password, ghostSecret = ghost) => {
    setError('');
    try {
      const verification = (await axios.post(`${apiUrl}/rooms/${selectedRoomItem.slug}/verify`, { password: secret }, auth(token))).data;
      const key = await keyFor(secret, selectedRoomItem.slug);
      const history = (await axios.get(`${apiUrl}/`, { ...auth(verification.accessToken), params: { room: selectedRoomItem.slug } })).data.reverse();

      socket.connect();
      socket.emit('joinRoom', { room: selectedRoomItem.slug, nickName, userId, token, accessToken: verification.accessToken, ghost: ghostSecret }, async (result) => {
        if (!result?.ok) return setError(result?.error || 'Entrada recusada.');
        keyRef.current = key;
        setRoom({ ...selectedRoomItem, currentName: result.nickName });
        setSelectedRoom(null);
        setPassword('');
        setMessages(await Promise.all(history.map(async (item) => ({ ...item, text: await decrypt(key, item) }))));
      });
    } catch (caught) {
      setError(caught.response?.data?.error || 'Senha incorreta ou sala indisponível.');
    }
  };

  const checkRoomMembers = (selectedRoomItem) => {
    setCheckingMembers(true);
    setRoomUsersPreview(null);
    setError('');
    socket.connect();

    const timeout = window.setTimeout(() => {
      socket.disconnect();
      setCheckingMembers(false);
      setError(strings.memberCheckError);
    }, 5000);

    socket.emit('getRoomUsers', { room: selectedRoomItem.slug, token }, (result) => {
      window.clearTimeout(timeout);
      socket.disconnect();
      setCheckingMembers(false);
      if (!result?.ok) return setError(result?.error || strings.memberCheckError);
      setRoomUsersPreview(result.users || []);
    });
  };

  const send = async (event) => {
    event.preventDefault();
    if (!message.trim() || !keyRef.current) return;

    socket.emit('message', await encrypt(keyRef.current, message.trim()), (result) => {
      if (result?.ok) {
        setMessage('');
      } else {
        setError(result?.error || 'Mensagem não enviada.');
      }
    });
  };

  const exit = () => {
    socket.emit('userExit');
    socket.disconnect();
    keyRef.current = null;
    setRoom(null);
    setMessages([]);
    setUsers([]);
  };

  const toggleBlock = async () => {
    await axios.patch(`${apiUrl}/rooms/${room.slug}`, { blocked: !room.blocked }, auth(token));
    setRoom({ ...room, blocked: !room.blocked });
    loadRooms();
  };

  if (!token) {
    return (
      <main className="entry-page" style={themeStyle}>
        <section className="entry-panel">
          <div className="toolbar-top">
            <div className="language-switch" aria-label={strings.language}>
              <button type="button" className={language === 'pt' ? 'lang-button active' : 'lang-button'} onClick={() => setLanguage('pt')}>PT</button>
              <button type="button" className={language === 'en' ? 'lang-button active' : 'lang-button'} onClick={() => setLanguage('en')}>EN</button>
            </div>
          </div>
          <p className="eyebrow">CHATSOCKET / PRIVATE ROOMS</p>
          <h1>{strings.title}</h1>
          <p className="intro">{strings.subtitle}</p>
          <div className="theme-picker" aria-label={strings.theme}>
            {Object.entries(themeOptions).map(([id, item]) => (
              <button key={id} type="button" className={theme === id ? 'theme-button active' : 'theme-button'} onClick={() => setTheme(id)}>{item.label}</button>
            ))}
          </div>
          <form className="entry-form" onSubmit={login}>
            <label>{strings.nickname}<input value={nickName} onChange={(event) => setNickName(event.target.value)} minLength="2" maxLength="30" required /></label>
            <label>{strings.password}<input type="password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} minLength="8" required /></label>
            {error && <p className="error">{error}</p>}
            <button className="primary-button">{accountMode === 'login' ? strings.enter : strings.createAccount}</button>
          </form>
          <button className="quiet-button account-toggle" onClick={() => { setAccountMode(accountMode === 'login' ? 'register' : 'login'); setError(''); }}>
            {accountMode === 'login' ? strings.registerPrompt : strings.loginPrompt}
          </button>
        </section>
      </main>
    );
  }

  if (room) {
    return (
      <main className="chat-page" style={themeStyle}>
        <header className="chat-header">
          <div><p className="eyebrow">{strings.protectedRoom}</p><h1>#{room.slug}</h1></div>
          <div className="header-actions">
            {room.ownerId === userId && <button className="quiet-button" onClick={toggleBlock}>{room.blocked ? strings.unblocked : strings.blocked}</button>}
            <button className="quiet-button" onClick={exit}>{strings.logout}</button>
          </div>
        </header>
        <div className="chat-layout">
          <aside className="users-panel">
            <h2>{strings.roomMembers} <span>{users.length}</span></h2>
            {users.map((user) => <div className="user" key={user}><i />{user}</div>)}
          </aside>
          <section className="conversation">
            <div className="messages" aria-live="polite">
              {messages.map((item, index) => (
                <article className={item.nickName === room.currentName ? 'message own' : 'message'} key={`${item.time}-${index}`}>
                  <div><strong>{item.nickName}</strong><time>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
            <form className="message-form" onSubmit={send}>
              <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={strings.encryptedMessage} maxLength="2000" />
              <button className="primary-button">{strings.send}</button>
            </form>
            {error && <p className="error">{error}</p>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="rooms-page" style={themeStyle}>
      <header className="rooms-header">
        <div><p className="eyebrow">CHATSOCKET / {nickName.toUpperCase()}</p><h1>{strings.chooseSpace}</h1></div>
        <button className="quiet-button" onClick={() => { localStorage.clear(); setToken(''); }}>{strings.logout}</button>
      </header>
      <div className="rooms-grid">
        <section>
          <div className="section-heading">
            <h2>{strings.openRooms}</h2>
            <span>{rooms.length} {strings.roomsAvailable}</span>
          </div>
          {rooms.length ? rooms.map((item) => (
            <button className="room-card" key={item.slug} onClick={() => { setSelectedRoom(item); setPassword(''); }}>
              <strong>{item.name}</strong>
              <small>#{item.slug} · {strings.createdBy} {item.owner}</small>
            </button>
          )) : <p className="muted">{strings.firstRoom}</p>}
        </section>
        <section className="create-panel">
          <h2>{strings.createRoom}</h2>
          <form className="entry-form" onSubmit={createRoom}>
            <label>{strings.roomName}<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label>{strings.roomId}<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder={language === 'pt' ? 'minha-sala' : 'my-room'} required /></label>
            <label>{strings.password}<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength="8" required /></label>
            <label className="check"><input type="checkbox" checked={form.hidden} onChange={(event) => setForm({ ...form, hidden: event.target.checked })} /> {strings.hiddenRoom}</label>
            <button className="primary-button">{strings.create}</button>
          </form>
        </section>
      </div>

      {selectedRoom && (
        <div className="modal-backdrop">
          <form className="join-modal" onSubmit={(event) => { event.preventDefault(); join(selectedRoom); }}>
            <button type="button" className="modal-close" onClick={() => setSelectedRoom(null)}>×</button>
            <p className="eyebrow">{strings.joinRoom} #{selectedRoom.slug}</p>
            <h2>{strings.enterKey}</h2>
            <input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" placeholder={strings.roomPasswordLabel} required />
            <button type="button" className="quiet-button member-check-button" onClick={() => checkRoomMembers(selectedRoom)} disabled={checkingMembers}>
              {checkingMembers ? strings.checkingMembers : strings.checkMembers}
            </button>
            {roomUsersPreview && (
              <div className="members-preview">
                <strong>{strings.membersFound} ({roomUsersPreview.length})</strong>
                {roomUsersPreview.length ? roomUsersPreview.map((user) => <span key={user}>{user}</span>) : <span>{strings.noMembers}</span>}
              </div>
            )}
            <label className="ghost-field">
              <input type="text" value={ghost} onChange={(event) => setGhost(event.target.value)} maxLength="30" placeholder={strings.ghostAlias} />
              {strings.ghostDescription}
            </label>
            <button className="primary-button">{strings.enter}</button>
          </form>
        </div>
      )}
    </main>
  );
}
