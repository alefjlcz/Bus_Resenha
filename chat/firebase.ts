/* FIREBASE */
import { initializeApp } from "firebase/app";
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
  where
} from "firebase/firestore";

/* CONFIGURAÇÃO SEGURA PUXANDO DO .ENV */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


// =============================
//  CRIAR CHAT POR BAIRRO/LINHA
// =============================
export async function criarChat(chatId: string, nomeLinha: string, bairro: string) {
  // Mudamos para setDoc! Assim a pasta ganha o nome exato (ex: "chat_linha_932")
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
    q = query(
      collection(db, "chats"),
      where("bairro", ">=", filtro),
      where("bairro", "<=", filtro + "\uf8ff")
    );
  } else {
    q = query(collection(db, "chats"), orderBy("criadoEm", "desc"));
  }

  return onSnapshot(q, (snapshot) => {
    const chats: any[] = [];

    snapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() });
    });

    callback(chats);
  });
}


// =============================
//       ENVIAR MENSAGEM
// =============================
export async function enviarMensagem(
  chatId: string,
  texto: string,
  usuario: string
) {
  await addDoc(collection(db, "chats", chatId, "mensagens"), {
    texto,
    usuario,
    timestamp: serverTimestamp(),
  });
}


// =============================
//        VER MENSAGENS
// =============================
export function ouvirMensagens(chatId: string, callback: any) {
  const q = query(
    collection(db, "chats", chatId, "mensagens"),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const mensagens: any[] = [];

    snapshot.forEach((doc) => {
      mensagens.push({ id: doc.id, ...doc.data() });
    });

    callback(mensagens);
  });
}


// =============================
//       FAVORITAR CHAT
// =============================
export async function favoritarChat(userId: string, chatId: string) {
  await setDoc(doc(db, "usuarios", userId, "favoritos", chatId), {
    chatId,
  });
}


// =============================
// ❌ DESFAVORITAR CHAT
// =============================
export async function desfavoritarChat(userId: string, chatId: string) {
  await deleteDoc(doc(db, "usuarios", userId, "favoritos", chatId));
}


// =============================
// ⭐ VER FAVORITOS
// =============================
export function ouvirFavoritos(userId: string, callback: any) {
  return onSnapshot(
    collection(db, "usuarios", userId, "favoritos"),
    (snapshot) => {
      const favoritos: string[] = [];

      snapshot.forEach((doc) => {
        favoritos.push(doc.id);
      });

      callback(favoritos);
    }
  );
}