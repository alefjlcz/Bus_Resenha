/* FIREBASE */
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";

// @ts-ignore
import {
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc, // <-- Adicionado para a verificação de reset
  getDocs, // <-- Unificado aqui
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch // <-- Unificado aqui
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
// 📢 REGISTRAR RESENHA DA PARADA
// =============================
export async function registrarResenhaNoBanco(paradaId: string, novoStatus: string) {
  try {
    await setDoc(doc(db, "status_paradas", paradaId), {
      status: novoStatus,
      atualizadoEm: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar status:", error);
  }
}

// =============================
//       ENVIAR MENSAGEM COMUM
// =============================
export async function enviarMensagem(chatId: string, texto: string, usuario: string, tagLinha: string = "", avatarId: string = "padrao") {
  const dataValidade = new Date();
  dataValidade.setHours(dataValidade.getHours() + 48);

  await addDoc(collection(db, "chats", chatId, "mensagens"), {
    texto,
    usuario,
    tagLinha, 
    avatarId, 
    tipo: 'texto',
    timestamp: serverTimestamp(),
    expiraEm: Timestamp.fromDate(dataValidade) 
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
//     FAVORITAR PARADA
// =============================
export async function favoritarParada(userId: string, paradaId: string, isFavorito: boolean) {
  const userRef = doc(db, "usuarios", userId);
  try {
    if (isFavorito) {
      await updateDoc(userRef, { paradasFavoritas: arrayUnion(paradaId) });
    } else {
      await updateDoc(userRef, { paradasFavoritas: arrayRemove(paradaId) });
    }
  } catch (error) {
    console.error("Erro ao favoritar:", error);
  }
}

// =============================
//      COMPARTILHAR GPS
// =============================
export async function enviarLocalizacao(chatId: string, usuario: string, minutos: number, tagLinha: string = "", avatarId: string = "padrao") {
  const agora = new Date();
  const expiraViagem = new Date(agora.getTime() + minutos * 60000); 

  const dataValidade = new Date();
  dataValidade.setHours(dataValidade.getHours() + 48);

  const docRef = await addDoc(collection(db, "chats", chatId, "mensagens"), {
    usuario,
    texto: `Compartilhando viagem por ${minutos} min`,
    tagLinha,
    avatarId, 
    tipo: 'localizacao',
    latitude: 0,
    longitude: 0,
    expiraEmViagem: expiraViagem.toISOString(), 
    expiraEm: Timestamp.fromDate(dataValidade), 
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function atualizarPosicao(chatId: string, mensagemId: string, lat: number, lon: number) {
  const docRef = doc(db, "chats", chatId, "mensagens", mensagemId);
  await updateDoc(docRef, { latitude: lat, longitude: lon });
}

// =============================
//      ATUALIZAR PERFIL
// =============================
export async function atualizarTagLinha(userId: string, novaTag: string) {
  await updateDoc(doc(db, "usuarios", userId), { tagLinha: novaTag });
}

export async function atualizarAvatar(userId: string, idAvatar: string) {
  await updateDoc(doc(db, "usuarios", userId), { avatarId: idAvatar });
}

export async function atualizarPerfilUsuario(userId: string, nome: string, fotoUriOubase64: string) {
  try {
    const userRef = doc(db, "usuarios", userId);
    await setDoc(userRef, {
      nome: nome,
      fotoPerfil: fotoUriOubase64,
      atualizadoEm: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao salvar perfil:", error);
    return false;
  }
}

// ==========================================
// 🧹 RESET GLOBAL DE 48 HORAS
// ==========================================
export async function verificarEResetarChats() {
  try {
    const agora = new Date();
    const docRef = doc(db, "sistema", "controle");
    const docSnap = await getDoc(docRef);

    let realizarReset = false;

    if (docSnap.exists()) {
      const ultimoReset = docSnap.data().ultimoResetGlobal.toDate();
      const diferencaHoras = (agora.getTime() - ultimoReset.getTime()) / (1000 * 60 * 60);

      if (diferencaHoras >= 48) {
        realizarReset = true;
      } else {
        console.log(`⏳ Próximo reset em: ${Math.round(48 - diferencaHoras)}h`);
      }
    } else {
      await setDoc(docRef, { ultimoResetGlobal: serverTimestamp() });
    }

    if (realizarReset) {
      console.log("🚀 Iniciando limpeza global de 48h...");
      const chatsSnap = await getDocs(collection(db, "chats"));
      const batch = writeBatch(db);

      for (const chatDoc of chatsSnap.docs) {
        const msgsSnap = await getDocs(collection(db, "chats", chatDoc.id, "mensagens"));
        msgsSnap.forEach((msgDoc) => {
          batch.delete(msgDoc.ref);
        });
      }

      batch.update(docRef, { ultimoResetGlobal: serverTimestamp() });
      await batch.commit();
      console.log("✅ Sistema resetado com sucesso!");
    }
  } catch (error) {
    console.error("Erro no reset global:", error);
  }
}