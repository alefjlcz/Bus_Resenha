// scripts/corrigirNomesHistorico.ts
// Como rodar: npx ts-node --skipIgnore scripts/corrigirNomesHistorico.ts

/* eslint-disable @typescript-eslint/no-var-requires */
const { initializeApp } = require("firebase/app");
const { collection, doc, getDocs, getFirestore, updateDoc } = require("firebase/firestore");

// Ajuste o caminho se necessário
const bancoParadas: any[] = require("C:/Users/alessandrolb.CIIR/Desktop/Bus/Bus Resenha/assets/dados/banco_de_paradas.json");


const firebaseConfig = {
  apiKey: "AIzaSyAbI_hrb6zQf-U93kPdIl_MBy6kpGSwxc0",
  authDomain: "resenhabus.firebaseapp.com",
  projectId: "resenhabus",
  storageBucket: "resenhabus.firebasestorage.app",
  messagingSenderId: "531865506051",
  appId: "1:531865506051:web:e2ae22ec6a05a7047c9936",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

async function corrigir() {
  // 1. Mapa userId → nome
  const usuariosSnap = await getDocs(collection(db, "usuarios"));
  const mapaUsuarios: Record<string, string> = {};
  usuariosSnap.docs.forEach((d: any) => {
    if (d.data().nome) mapaUsuarios[d.id] = d.data().nome;
  });
  console.log(`👤 ${Object.keys(mapaUsuarios).length} usuários carregados`);

  // 2. Mapa paradaId → nome
  const mapaParadas: Record<string, string> = {};
  bancoParadas.forEach((p: any) => {
    mapaParadas[p.id] = p.nome;
  });
  console.log(`📍 ${Object.keys(mapaParadas).length} paradas carregadas`);

  // 3. Corrige o histórico
  const historico = await getDocs(collection(db, "historico_ocorrencias"));
  let corrigidos = 0;

  for (const docSnap of historico.docs) {
    const data = (docSnap as any).data();
    const updates: Record<string, string> = {};

    // Corrige nome do usuário
    const nomeUsuario = mapaUsuarios[data.userId];
    if (nomeUsuario && (!data.nomeUsuario || data.nomeUsuario === "Anônimo")) {
      updates.nomeUsuario = nomeUsuario;
    }

    // Corrige nome da parada (se for um ID do Google Places começando com ChIJ)
    const nomeParada = mapaParadas[data.paradaId];
    if (
      nomeParada &&
      (!data.paradaNome ||
        data.paradaNome === data.paradaId ||
        data.paradaNome?.startsWith("ChIJ"))
    ) {
      updates.paradaNome = nomeParada;
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, "historico_ocorrencias", (docSnap as any).id), updates);
      corrigidos++;
      console.log(`✏️  Corrigido: ${(docSnap as any).id} → ${JSON.stringify(updates)}`);
    }
  }

  console.log(`\n✅ ${corrigidos} registros corrigidos de ${historico.size} totais.`);
}

corrigir()
  .catch((err: any) => {
    console.error("❌ Erro:", err);
  })
  .finally(() => {
    setTimeout(() => {
      // @ts-ignore
      process.exit(0);
    }, 1500);
  });
