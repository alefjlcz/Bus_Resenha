// scripts/resetarParadas.ts
// Para rodar: npx ts-node scripts/resetarParadas.ts
import { initializeApp } from "firebase/app";
import {
  collection,
  getDocs,
  getFirestore,
  serverTimestamp,
  writeBatch,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbI_hrb6zQf-U93kPdIl_MBy6kpGSwxc0",
  authDomain: "resenhabus.firebaseapp.com",
  projectId: "resenhabus",
  storageBucket: "resenhabus.firebasestorage.app",
  messagingSenderId: "531865506051",
  appId: "1:531865506051:web:e2ae22ec6a05a7047c9936",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetarTudo() {
  console.log("🔄 Conectando ao Firebase...");
  const batch = writeBatch(db);

  // 1. Reseta status_paradas → todas viram "ok"
  const statusSnap = await getDocs(collection(db, "status_paradas"));
  console.log(`📍 ${statusSnap.size} paradas encontradas em status_paradas`);
  statusSnap.forEach((docSnap) => {
    batch.set(docSnap.ref, {
      status: "ok",
      atualizadoEm: serverTimestamp(),
      reportesVerdeSequencial: 0,
    });
  });

  // 2. Reseta contadores de perigo em paradas
  const paradasSnap = await getDocs(collection(db, "paradas"));
  console.log(`🚨 ${paradasSnap.size} paradas encontradas em paradas`);
  paradasSnap.forEach((docSnap) => {
    batch.set(docSnap.ref, {
      reportesVermelho: 0,
      reportes190: 0,
      policiaChamada: false,
    });
  });

  // 3. Limpa histórico de cooldowns dos usuários
  const controleSnap = await getDocs(collection(db, "controle_reportes"));
  console.log(`⏱️ ${controleSnap.size} registros de cooldown encontrados`);
  controleSnap.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();
  console.log("✅ Reset completo! Todas as paradas voltaram ao normal.");
  process.exit(0);
}

resetarTudo().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});