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
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializa o Banco
export const db = getFirestore(app);

// 3. AUTH
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
//   AUTENTICAÇÃO E PERFIL
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
//  REGISTRAR RESENHA DA PARADA
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
//  GRAVAR NO HISTÓRICO PERMANENTE
//  (nunca é apagado pelo reset)
// =============================
async function gravarHistorico(
  paradaId: string,
  tipo: "vermelho" | "190" | "cuidado" | "ok",
  userId: string
) {
  try {
    const agora = new Date();
    const mes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;

    // Busca o nome da parada no documento de status (se existir)
    let paradaNome = paradaId;
    try {
      const paradaRef = doc(db, "status_paradas", paradaId);
      const paradaSnap = await getDoc(paradaRef);
      if (paradaSnap.exists() && paradaSnap.data().nome) {
        paradaNome = paradaSnap.data().nome;
      }
    } catch (_) {}

    await addDoc(collection(db, "historico_ocorrencias"), {
      paradaId,
      paradaNome,
      tipo,
      userId,
      mes,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao gravar histórico:", error);
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
//   INCREMENTAR REPORTE DE PERIGO
//       (Vermelho ou 190)
// =============================
export async function incrementarReportePerigo(paradaId: string, tipo: "vermelho" | "190") {
  const paradaRef = doc(db, "paradas", paradaId);
  const paradaSnap = await getDoc(paradaRef);

  // Dentro de incrementarReportePerigo, após o updateDoc/setDoc:
  if (tipo === "190") {
  const user = auth.currentUser;
  await gravarHistorico(paradaId, "190", user?.uid || "anonimo");
  }

  if (paradaSnap.exists()) {
    const data = paradaSnap.data();
    if (tipo === "vermelho") {
      await updateDoc(paradaRef, {
        reportesVermelho: (data.reportesVermelho || 0) + 1,
      });
    } else {
      await updateDoc(paradaRef, {
        reportes190: (data.reportes190 || 0) + 1,
        policiaChamada: true,
      });
    }
  } else {
    //  Cria documento do zero
    await setDoc(paradaRef, {
      reportesVermelho: tipo === "vermelho" ? 1 : 0,
      reportes190: tipo === "190" ? 1 : 0,
      policiaChamada: tipo === "190",
    });
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
// ==========================================
// 🧹 RESET GLOBAL DE 48 HORAS + DECAY DE STATUS
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
        console.log(`⏳ Próximo reset global em: ${Math.round(48 - diferencaHoras)}h`);
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

    // ==========================================
    // ⏱️ DECAY AUTOMÁTICO DE STATUS DAS PARADAS
    // Roda toda vez que o app abre (independente do reset de 48h)
    // ==========================================
    await aplicarDecayDeStatus();

  } catch (error) {
    console.error("Erro no reset global:", error);
  }
}

// ==========================================
// 🟡🟢 DECAY: paradas voltam ao verde com o tempo
//
// Regras:
//   - Vermelho sem 190: → Amarelo após 1h → Verde após 2h
//   - Vermelho com 190: → fica Perigoso por 24h, depois → Amarelo → Verde (1h depois)
//   - Amarelo:          → Verde após 1h
// ==========================================
async function aplicarDecayDeStatus() {
  try {
    const agora = Date.now();
    const UMA_HORA  = 1 * 60 * 60 * 1000;
    const DUAS_HORAS = 2 * 60 * 60 * 1000;
    const VINTE_QUATRO_HORAS = 24 * 60 * 60 * 1000;

    const statusSnap = await getDocs(collection(db, "status_paradas"));
    const batch = writeBatch(db);
    let alteracoes = 0;

    for (const docSnap of statusSnap.docs) {
      const data = docSnap.data();
      const statusAtual: string = data.status || "ok";

      // Pula paradas que já estão OK
      if (statusAtual === "ok") continue;

      // Pega o timestamp da última atualização
      const atualizadoEm: number = data.atualizadoEm?.toMillis?.() || 0;
      const tempoPassado = agora - atualizadoEm;

      // Busca se essa parada teve 190 acionado
      let policiaChamada = false;
      try {
        const paradaRef = doc(db, "paradas", docSnap.id);
        const paradaSnap = await getDoc(paradaRef);
        if (paradaSnap.exists()) {
          policiaChamada = paradaSnap.data().policiaChamada === true;
        }
      } catch (_) {}

      let novoStatus: string | null = null;

      if (statusAtual === "perigoso") {
        if (policiaChamada) {
          // 190 acionado: só começa o decay depois de 24h
          if (tempoPassado >= VINTE_QUATRO_HORAS + UMA_HORA) {
            novoStatus = "ok";       // 25h+ → verde direto
          } else if (tempoPassado >= VINTE_QUATRO_HORAS) {
            novoStatus = "cuidado";  // 24h  → amarelo
          }
        } else {
          // Vermelho normal
          if (tempoPassado >= DUAS_HORAS) {
            novoStatus = "ok";       // 2h+ → verde
          } else if (tempoPassado >= UMA_HORA) {
            novoStatus = "cuidado";  // 1h  → amarelo
          }
        }
      } else if (statusAtual === "cuidado") {
        if (tempoPassado >= UMA_HORA) {
          novoStatus = "ok";         // 1h  → verde
        }
      }

      if (novoStatus) {
        console.log(`🔄 Decay: parada ${docSnap.id} → ${statusAtual} para ${novoStatus}`);
        batch.update(docSnap.ref, {
          status: novoStatus,
          atualizadoEm: serverTimestamp(),
          // Se voltou ao verde, zera o contador de spam também
          ...(novoStatus === "ok" ? { reportesVerdeSequencial: 0 } : {}),
        });

        // Se voltou ao verde completamente, limpa o policiaChamada também
        if (novoStatus === "ok" && policiaChamada) {
          const paradaRef = doc(db, "paradas", docSnap.id);
          batch.update(paradaRef, {
            policiaChamada: false,
            reportesVermelho: 0,
            reportes190: 0,
          });
        }

        alteracoes++;
      }
    }

    if (alteracoes > 0) {
      await batch.commit();
      console.log(`✅ Decay aplicado em ${alteracoes} parada(s).`);
    } else {
      console.log("✅ Decay: nenhuma parada precisava de atualização.");
    }

  } catch (error) {
    console.error("Erro no decay de status:", error);
  }
}

// =============================
//  RESET MANUAL DE TODAS AS PARADAS
//  (use no VSCode para testes)
// =============================
export async function resetarTodasAsParadas() {
  try {
    console.log("🔄 Iniciando reset de todas as paradas...");
    const batch = writeBatch(db);

    // 1. Zera todos os status_paradas
    const statusSnap = await getDocs(collection(db, "status_paradas"));
    statusSnap.forEach((docSnap) => {
      batch.set(docSnap.ref, { status: "ok", atualizadoEm: serverTimestamp() });
    });

    // 2. Zera todos os contadores de perigo em paradas
    const paradasSnap = await getDocs(collection(db, "paradas"));
    paradasSnap.forEach((docSnap) => {
      batch.set(docSnap.ref, {
        reportesVermelho: 0,
        reportes190: 0,
        policiaChamada: false,
      });
    });

    await batch.commit();
    console.log("✅ Todas as paradas foram resetadas para OK!");
  } catch (error) {
    console.error("❌ Erro ao resetar paradas:", error);
  }
}

// =============================
//  REGISTRAR REPORTE COM PROTEÇÃO
// =============================
export async function registrarReporteComProtecao(
  paradaId: string,
  userId: string,
  novoStatus: string
): Promise<{ permitido: boolean; mensagem: string }> {
  try {
    const COOLDOWN_MS = 2 * 60 * 1000;
    const LIMITE_SPAM = 5;

    const controleRef = doc(db, "controle_reportes", `${userId}_${paradaId}`);
    const controleSnap = await getDoc(controleRef);
    const agora = Date.now();

    if (controleSnap.exists()) {
      const ultimoReporte = controleSnap.data().ultimoReporte?.toMillis?.() || 0;
      const diff = agora - ultimoReporte;

      if (diff < COOLDOWN_MS) {
        const segundosRestantes = Math.ceil((COOLDOWN_MS - diff) / 1000);
        return {
          permitido: false,
          mensagem: `Aguarde ${segundosRestantes}s para reportar novamente.`,
        };
      }
    }

    if (novoStatus === "ok") {
      const paradaStatusRef = doc(db, "status_paradas", paradaId);
      const paradaStatusSnap = await getDoc(paradaStatusRef);

      if (paradaStatusSnap.exists()) {
        const statusAtual = paradaStatusSnap.data().status;
        const reportesVerdeSpam = paradaStatusSnap.data().reportesVerdeSequencial || 0;

        if (statusAtual === "perigoso" && reportesVerdeSpam >= LIMITE_SPAM) {
          return {
            permitido: false,
            mensagem: "Muitos reportes de 'tudo ok' seguidos foram detectados. Esta parada permanece em alerta por segurança.",
          };
        }

        if (novoStatus === "ok") {
          await updateDoc(paradaStatusRef, {
            reportesVerdeSequencial: reportesVerdeSpam + 1,
          });
        }
      }
    } else {
      const paradaStatusRef = doc(db, "status_paradas", paradaId);
      const paradaStatusSnap = await getDoc(paradaStatusRef);
      if (paradaStatusSnap.exists()) {
        await updateDoc(paradaStatusRef, { reportesVerdeSequencial: 0 });
      }
    }

    await setDoc(controleRef, {
      ultimoReporte: Timestamp.fromMillis(agora),
      paradaId,
      userId,
    });

    await registrarResenhaNoBanco(paradaId, novoStatus);

    // ✅ Grava no histórico permanente
    const tipoHistorico = novoStatus === "perigoso" ? "vermelho"
      : novoStatus === "cuidado" ? "cuidado"
      : "ok";

    await gravarHistorico(paradaId, tipoHistorico as any, userId);

    return { permitido: true, mensagem: "Reporte registrado com sucesso!" };
  } catch (error) {
    console.error("Erro ao registrar reporte com proteção:", error);
    return { permitido: false, mensagem: "Erro ao registrar reporte." };
  }
}

