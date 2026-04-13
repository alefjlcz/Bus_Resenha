/* FIREBASE */
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";

// @ts-ignore
import { createUserWithEmailAndPassword, getAuth, getReactNativePersistence, initializeAuth, sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";

/* CONFIGURAÇÃO COM A SUA CHAVE DIRETA */
const firebaseConfig = {
  apiKey: "AIzaSyAbI_hrb6zQf-U93kPdIl_MBy6kpGSwxc0",
  authDomain: "resenhabus.firebaseapp.com",
  projectId: "resenhabus",
  storageBucket: "resenhabus.firebasestorage.app",
  messagingSenderId: "531865506051",
  appId: "1:531865506051:web:e2ae22ec6a05a7047c9936",
  measurementId: "G-8YJ271DM1T"
};

// 1. ESCUDO ANTI TELA VERMELHA
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializa o Banco
export const db = getFirestore(app);

// 3. ESCUDO DO AUTH
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  authInstance = getAuth(app);
}

export const auth = authInstance;

// =============================
// 🔐 AUTENTICAÇÃO E PERFIL
// =============================
export async function criarConta(nome: string, email: string, senha: string) {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  const usuario = credencial.user;

  await sendEmailVerification(usuario);
  
  const isUniversitario = email.endsWith('.edu.br') || 
                          email.includes('@alunos.estacio.br') || 
                          email.includes('@ufpa.br') || 
                          email.includes('@uepa.br');

  await setDoc(doc(db, "usuarios", usuario.uid), {
    id: usuario.uid,
    nome: nome,
    email: email,
    isUniversitario: isUniversitario,
    contaCriadaEm: serverTimestamp(),
    verificado: usuario.emailVerified
  });

  return usuario;
}

export async function entrarNaConta(email: string, senha: string) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  return credencial.user;
}

export async function sairDaConta() {
  await signOut(auth);
}

// =============================
//  CRIAR CHAT POR BAIRRO/LINHA
// =============================
export async function criarChat(chatId: string, nomeLinha: string, bairro: string) {
  await setDoc(doc(db, "chats", chatId), {
    nome: nomeLinha,
    bairro: bairro,
    criadoEm: serverTimestamp(),
  });
}

// =============================
//          VER CHATS
// =============================
export function verChats(filtro: string, callback: any) {
  let q;
  if (filtro) {
    q = query(collection(db, "chats"), where("bairro", ">=", filtro), where("bairro", "<=", filtro + "\uf8ff"));
  } else {
    q = query(collection(db, "chats"), orderBy("criadoEm", "desc"));
  }

  return onSnapshot(q, (snapshot) => {
    const chats: any[] = [];
    snapshot.forEach((doc) => { chats.push({ id: doc.id, ...doc.data() }); });
    callback(chats);
  });
}

// =============================
//       ENVIAR MENSAGEM COMUM
// =============================
export async function enviarMensagem(chatId: string, texto: string, usuario: string) {
  await addDoc(collection(db, "chats", chatId, "mensagens"), {
    texto,
    usuario,
    tipo: 'texto',
    timestamp: serverTimestamp(),
  });
}

// =============================
//        VER MENSAGENS
// =============================
export function ouvirMensagens(chatId: string, callback: any) {
  const q = query(collection(db, "chats", chatId, "mensagens"), orderBy("timestamp", "asc"));
  return onSnapshot(q, (snapshot) => {
    const mensagens: any[] = [];
    snapshot.forEach((doc) => { mensagens.push({ id: doc.id, ...doc.data() }); });
    callback(mensagens);
  });
}

export async function favoritarChat(userId: string, chatId: string) {
  await setDoc(doc(db, "usuarios", userId, "favoritos", chatId), { chatId });
}

export async function desfavoritarChat(userId: string, chatId: string) {
  await deleteDoc(doc(db, "usuarios", userId, "favoritos", chatId));
}

export function ouvirFavoritos(userId: string, callback: any) {
  return onSnapshot(collection(db, "usuarios", userId, "favoritos"), (snapshot) => {
    const favoritos: string[] = [];
    snapshot.forEach((doc) => { favoritos.push(doc.id); });
    callback(favoritos);
  });
}

// =============================
// 📍 COMPARTILHAR GPS
// =============================
export async function enviarLocalizacao(chatId: string, usuario: string, minutos: number) {
  const agora = new Date();
  const expiraEm = new Date(agora.getTime() + minutos * 60000);

  const docRef = await addDoc(collection(db, "chats", chatId, "mensagens"), {
    usuario,
    texto: `Compartilhando viagem por ${minutos} min`,
    tipo: 'localizacao',
    latitude: 0,
    longitude: 0,
    expiraEm: expiraEm.toISOString(),
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function atualizarPosicao(chatId: string, mensagemId: string, lat: number, lon: number) {
  const docRef = doc(db, "chats", chatId, "mensagens", mensagemId);
  await updateDoc(docRef, { latitude: lat, longitude: lon });
}