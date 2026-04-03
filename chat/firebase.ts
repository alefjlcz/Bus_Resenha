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

/* CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyCvARUCAOJZGCJALl73joOyXkBhbZP9Rho",
  authDomain: "chatbusresenha.firebaseapp.com",
  projectId: "chatbusresenha",
  storageBucket: "chatbusresenha.firebasestorage.app",
  messagingSenderId: "688189193387",
  appId: "1:688189193387:web:c5fc536c704c920585cbee",
  measurementId: "G-6K08YDN4LT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


// =============================
// 🏙️ CRIAR CHAT POR BAIRRO
// =============================
export async function criarChat(bairro: string) {
  await addDoc(collection(db, "chats"), {
    nome: bairro,
    bairro,
    criadoEm: serverTimestamp(),
  });
}


// =============================
// 🔍 VER CHATS (COM FILTRO)
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
// 📨 ENVIAR MENSAGEM
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
//  VER MENSAGENS
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
// ⭐ FAVORITAR CHAT
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