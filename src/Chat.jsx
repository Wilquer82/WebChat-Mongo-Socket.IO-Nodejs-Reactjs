import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const apiUrl = (import.meta.env.VITE_API_URL || 'https://backsocket-2jc4.onrender.com').replace(/\/$/, '');
const socket = io(apiUrl, { autoConnect: false });
const base64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const bytes = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

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
  try { return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(item.iv) }, key, bytes(item.ciphertext))); } catch (_error) { return '[mensagem protegida por outra senha]'; }
}

export default function Chat() {
  const [token, setToken] = useState(localStorage.getItem('chat-token') || '');
  const [userId, setUserId] = useState(localStorage.getItem('chat-user-id') || '');
  const [nickName, setNickName] = useState(localStorage.getItem('chat-name') || '');
  const [accountMode, setAccountMode] = useState('login');
  const [accountPassword, setAccountPassword] = useState('');
  const [room, setRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ name: '', slug: '', password: '', hidden: false });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [ghost, setGhost] = useState('');
  const [error, setError] = useState('');
  const keyRef = useRef(null);

  const loadRooms = async (currentToken = token) => { try { setRooms((await axios.get(`${apiUrl}/rooms`, auth(currentToken))).data); } catch (_error) { setError('Não foi possível carregar as salas.'); } };
  useEffect(() => { if (token) axios.get(`${apiUrl}/rooms`, auth(token)).then((response) => setRooms(response.data)).catch(() => setError('Não foi possível carregar as salas.')); }, [token]);
  useEffect(() => {
    const receiveMessage = async (item) => { const text = await decrypt(keyRef.current, item); setMessages((current) => [...current, { ...item, text }]); };
    socket.on('message', receiveMessage); socket.on('usersOn', setUsers);
    return () => { socket.off('message', receiveMessage); socket.off('usersOn', setUsers); };
  }, []);

  const login = async (event) => { event.preventDefault(); setError(''); try { const result = (await axios.post(`${apiUrl}/auth/${accountMode}`, { nickName, password: accountPassword })).data; localStorage.setItem('chat-token', result.token); localStorage.setItem('chat-name', result.nickName); localStorage.setItem('chat-user-id', result.userId); setToken(result.token); setUserId(result.userId); setNickName(result.nickName); setAccountPassword(''); } catch (caught) { setError(caught.response?.data?.error || 'Não foi possível autenticar.'); } };
  const createRoom = async (event) => { event.preventDefault(); setError(''); try { await axios.post(`${apiUrl}/rooms`, form, auth(token)); setForm({ name: '', slug: '', password: '', hidden: false }); loadRooms(); } catch (caught) { setError(caught.response?.data?.error || 'Não foi possível criar a sala.'); } };
  const join = async (selectedRoom, secret = password, ghostSecret = '') => {
    setError(''); try {
      const verification = (await axios.post(`${apiUrl}/rooms/${selectedRoom.slug}/verify`, { password: secret }, auth(token))).data;
      const key = await keyFor(secret, selectedRoom.slug); const history = (await axios.get(`${apiUrl}/`, { ...auth(verification.accessToken), params: { room: selectedRoom.slug } })).data.reverse();
      socket.connect(); socket.emit('joinRoom', { room: selectedRoom.slug, nickName, userId, token, accessToken: verification.accessToken, ghost: ghostSecret }, async (result) => { if (!result?.ok) return setError(result?.error || 'Entrada recusada.'); keyRef.current = key; setRoom({ ...selectedRoom, currentName: result.nickName }); setSelectedRoom(null); setPassword(''); setMessages(await Promise.all(history.map(async (item) => ({ ...item, text: await decrypt(key, item) })))); });
    } catch (caught) { setError(caught.response?.data?.error || 'Senha incorreta ou sala indisponível.'); }
  };
  const send = async (event) => { event.preventDefault(); if (!message.trim() || !keyRef.current) return; socket.emit('message', await encrypt(keyRef.current, message.trim()), (result) => result?.ok ? setMessage('') : setError(result?.error || 'Mensagem não enviada.')); };
  const exit = () => { socket.emit('userExit'); socket.disconnect(); keyRef.current = null; setRoom(null); setMessages([]); setUsers([]); };
  const toggleBlock = async () => { await axios.patch(`${apiUrl}/rooms/${room.slug}`, { blocked: !room.blocked }, auth(token)); setRoom({ ...room, blocked: !room.blocked }); loadRooms(); };

  if (!token) return <main className="entry-page"><section className="entry-panel"><p className="eyebrow">CHATSOCKET / PRIVATE ROOMS</p><h1>Converse sem deixar a chave escapar.</h1><p className="intro">Crie uma conta para proteger sua identidade e suas salas.</p><form className="entry-form" onSubmit={login}><label>Seu apelido<input value={nickName} onChange={(event) => setNickName(event.target.value)} minLength="2" maxLength="30" required /></label><label>Senha<input type="password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} minLength="8" required /></label>{error && <p className="error">{error}</p>}<button className="primary-button">{accountMode === 'login' ? 'Entrar' : 'Criar conta'}</button></form><button className="quiet-button account-toggle" onClick={() => { setAccountMode(accountMode === 'login' ? 'register' : 'login'); setError(''); }}>{accountMode === 'login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}</button></section></main>;
  if (room) return <main className="chat-page"><header className="chat-header"><div><p className="eyebrow">SALA PROTEGIDA</p><h1>#{room.slug}</h1></div><div className="header-actions">{room.ownerId === userId && <button className="quiet-button" onClick={toggleBlock}>{room.blocked ? 'Desbloquear' : 'Bloquear'}</button>}<button className="quiet-button" onClick={exit}>Sair</button></div></header><div className="chat-layout"><aside className="users-panel"><h2>Na sala <span>{users.length}</span></h2>{users.map((user) => <div className="user" key={user}><i />{user}</div>)}</aside><section className="conversation"><div className="messages" aria-live="polite">{messages.map((item, index) => <article className={item.nickName === room.currentName ? 'message own' : 'message'} key={`${item.time}-${index}`}><div><strong>{item.nickName}</strong><time>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><p>{item.text}</p></article>)}</div><form className="message-form" onSubmit={send}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Mensagem cifrada..." maxLength="2000" /><button className="primary-button">Enviar</button></form>{error && <p className="error">{error}</p>}</section></div></main>;
  return <main className="rooms-page"><header className="rooms-header"><div><p className="eyebrow">CHATSOCKET / {nickName.toUpperCase()}</p><h1>Escolha seu espaço.</h1></div><button className="quiet-button" onClick={() => { localStorage.clear(); setToken(''); }}>Sair</button></header><div className="rooms-grid"><section><div className="section-heading"><h2>Salas abertas</h2><span>{rooms.length} disponíveis</span></div>{rooms.length ? rooms.map((item) => <button className="room-card" key={item.slug} onClick={() => { setSelectedRoom(item); setPassword(''); }}><strong>{item.name}</strong><small>#{item.slug} · criada por {item.owner}</small></button>) : <p className="muted">Crie a primeira sala.</p>}</section><section className="create-panel"><h2>Nova sala</h2><form className="entry-form" onSubmit={createRoom}><label>Nome<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Identificador<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="minha-sala" required /></label><label>Senha<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength="8" required /></label><label className="check"><input type="checkbox" checked={form.hidden} onChange={(event) => setForm({ ...form, hidden: event.target.checked })} /> Sala invisível na lista</label><button className="primary-button">Criar sala</button></form></section></div>{selectedRoom && <div className="modal-backdrop"><form className="join-modal" onSubmit={(event) => { event.preventDefault(); join(selectedRoom); }}><button type="button" className="modal-close" onClick={() => setSelectedRoom(null)}>×</button><p className="eyebrow">ENTRAR EM #{selectedRoom.slug}</p><h2>Qual é a chave?</h2><input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" placeholder="Senha da sala" required /><label className="ghost-field">Admin fantasma<input type="password" value={ghost} onChange={(event) => setGhost(event.target.value)} placeholder="opcional" /></label><button className="primary-button">Entrar</button>{error && <p className="error">{error}</p>}</form></div>}</main>;
}