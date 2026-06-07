import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { mapaFotos } from '../assets/dados/mapa_fotos';
import { auth, db, favoritarParada, incrementarReportePerigo, registrarReporteComProtecao, registrarResenhaNoBanco } from '../chat/firebase';

interface CardParadaProps {
  parada: any;
  usuarioEstaNaParada?: boolean;
  fecharCard: () => void;
  statusGlobal: Record<string, string>;
  clima: string;
  favoritas: string[];
}

export default function CardParada({
  parada,
  usuarioEstaNaParada,
  fecharCard,
  statusGlobal,
  clima,
  favoritas = []
}: CardParadaProps) {

  const [modalVisivel, setModalVisivel] = useState(false);
  const [pessoasNaParada, setPessoasNaParada] = useState(12);
  const [reportesPerigo, setReportesPerigo] = useState(0);
  const [policiaChamada, setPoliciaChamada] = useState(false);

  useEffect(() => {
    if (usuarioEstaNaParada) setPessoasNaParada(prev => prev + 1);
  }, [usuarioEstaNaParada]);

  // ==========================================
  // ✅ CORREÇÃO BUG 2: statusGlobal nas dependências
  // Quando o status muda para "ok", os alertas somem imediatamente
  // ==========================================
  useEffect(() => {
    if (!parada) return;

    setReportesPerigo(0);
    setPoliciaChamada(false);

    const paradaRef = doc(db, "paradas", parada.id.toString());
    const unsubscribe = onSnapshot(paradaRef, (docSnap) => {

      // ✅ Se o status atual for "ok", não mostra alertas independente do banco
      const statusAtual = statusGlobal[parada.id.toString()] || "ok";
      if (statusAtual === "ok") {
        setReportesPerigo(0);
        setPoliciaChamada(false);
        return;
      }

      if (docSnap.exists()) {
        const data = docSnap.data();
        setReportesPerigo((data.reportesVermelho || 0) + (data.reportes190 || 0));
        setPoliciaChamada(data.policiaChamada === true);
      } else {
        setReportesPerigo(0);
        setPoliciaChamada(false);
      }
    });

    return () => unsubscribe();
  }, [parada, statusGlobal]); // ✅ statusGlobal adicionado aqui

  if (!parada) return null;

  const isFavorita = favoritas.includes(parada.id.toString());

  const handleFavoritar = async () => {
    if (auth.currentUser) {
      await favoritarParada(auth.currentUser.uid, parada.id.toString(), !isFavorita);
    } else {
      Alert.alert("Erro", "Você precisa estar logado para favoritar.");
    }
  };

  // =============================
  // 📢 SALVAR RESENHA NO BANCO
  // =============================
  const enviarReporte = async (statusId: string, mensagem: string) => {
    const usuarioAtual = auth.currentUser;
    if (!usuarioAtual) {
      Alert.alert("Erro", "Você precisa estar logado para reportar.");
      return;
    }

    const resultado = await registrarReporteComProtecao(
      parada.id.toString(),
      parada.nome,
      usuarioAtual.uid,
      statusId
    );

    if (!resultado.permitido) {
      Alert.alert("⏳ Aguarde", resultado.mensagem);
      return;
    }

    if (statusId === "perigoso") {
      await incrementarReportePerigo(parada.id.toString(), "vermelho", parada.nome);
    }

    Alert.alert("Resenha Registrada!", mensagem);
    setModalVisivel(false);
  };

  // =============================
  // 🚨 LÓGICA DE EMERGÊNCIA (190)
  // =============================
  const simularChamada190 = () => {
    Alert.alert(
      "🚨 EMERGÊNCIA 190",
      `Tem certeza que deseja acionar a viatura para a parada:\n${parada.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "CHAMAR AGORA",
          style: "destructive",
          onPress: async () => {
            Alert.alert(
              "🚓 Polícia Acionada!",
              "A viatura mais próxima recebeu as coordenadas deste ponto e está a caminho. Procure um local seguro."
            );

            // ✅ INSERE O NÚMERO 12 COMO TERCEIRO PARÂMETRO (TRAVA DE 12 HORAS)
            await registrarResenhaNoBanco(parada.id.toString(), "perigoso", 12);
            await incrementarReportePerigo(parada.id.toString(), "190", parada.nome);
          }
        }
      ]
    );
  };

  const fotoDaRua = mapaFotos ? mapaFotos[parada.id.toString()] : null;
  const statusAtual = statusGlobal[parada.id.toString()] || "ok";

  let iconeStatus = "✅ Tudo Ok";
  let corStatusFundo = "#E8F5E9";
  let corStatusTexto = "#2E7D32";

  if (statusAtual === "cuidado") {
    iconeStatus = "⚠️ Cuidado/Alagada";
    corStatusFundo = "#FFF9C4";
    corStatusTexto = "#F57F17";
  } else if (statusAtual === "perigoso") {
    iconeStatus = "🚨 Perigoso";
    corStatusFundo = "#FFEBEE";
    corStatusTexto = "#C62828";
  }

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity style={styles.closeButton} onPress={fecharCard}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {fotoDaRua ? (
        <Image source={fotoDaRua} style={styles.imagemParada} resizeMode="cover" />
      ) : (
        <View style={styles.imagemPlaceholder}>
          <Text style={styles.textoPlaceholder}>Foto indisponível</Text>
        </View>
      )}

      <Text style={styles.cardTitle}>{parada.nome}</Text>

      {/* ALERTAS — só aparecem se o status NÃO for ok */}
      <View style={styles.alertasContainer}>
        {reportesPerigo > 0 && (
          <View style={styles.reporteContainer}>
            <Ionicons name="warning" size={16} color="#FF3B30" />
            <Text style={styles.textoReporte}>
              {reportesPerigo} {reportesPerigo === 1 ? 'reporte de perigo' : 'reportes de perigo'}
            </Text>
          </View>
        )}

        {policiaChamada && (
          <View style={styles.bannerPolicia}>
            <Ionicons name="shield" size={14} color="#FFFFFF" />
            <Text style={styles.textoBannerPolicia}>
              🚨 190 foi acionada nessa parada, tome cuidado!
            </Text>
          </View>
        )}
      </View>

      <View style={styles.badgesRow}>
        <View style={[styles.badge, { backgroundColor: corStatusFundo }]}>
          <Text style={[styles.badgeText, { color: corStatusTexto }]}>{iconeStatus}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.badgeText, { color: '#1565C0' }]}>{clima}</Text>
        </View>

        {usuarioEstaNaParada && (
          <View style={[styles.badge, { backgroundColor: '#00A86B' }]}>
            <Text style={[styles.badgeText, { color: '#FFF' }]}>📍 Você está aqui</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardDescription}>
        {statusAtual === "cuidado"
          ? "Atenção: Relatos de alagamento ou situação que exige cuidado nesta parada."
          : statusAtual === "perigoso"
          ? "Atenção máxima: Evite este local. Relatos de perigo/assalto recentemente."
          : "Esta parada está tranquila. Local com fluxo normal e seguro."}
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => setModalVisivel(true)}>
        <Text style={styles.buttonText}>Lançar o Feedback (Reportar)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.botaoEmergencia]} onPress={simularChamada190}>
        <Text style={styles.buttonText}>🚨 Acionar 190 (Polícia)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isFavorita ? '#FFF' : '#F0F0F0', borderColor: '#FF4B4B', borderWidth: 2 }]}
        onPress={handleFavoritar}
      >
        <Text style={[styles.buttonText, { color: '#FF4B4B' }]}>
          {isFavorita ? '❤️ Remover dos Favoritos' : '🤍 Salvar como Favorita'}
        </Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisivel} onRequestClose={() => setModalVisivel(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Qual o feedback da parada?</Text>

            <TouchableOpacity style={styles.reportOption} onPress={() => enviarReporte("ok", "Que bom que está tudo seguro!")}>
              <Text style={styles.reportOptionText}>✅ Verde: Tudo Normal/Seguro</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportOption} onPress={() => enviarReporte("cuidado", "Cuidado registrado!")}>
              <Text style={styles.reportOptionText}>⚠️ Amarelo: Cuidado / Alagado</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportOption} onPress={() => enviarReporte("perigoso", "Reporte de perigo máximo registrado.")}>
              <Text style={styles.reportOptionText}>🚨 Vermelho: Local Perigoso</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.reportOption, styles.cancelButton]} onPress={() => setModalVisivel(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 15, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  closeButton: { position: 'absolute', top: 10, right: 15, zIndex: 10, padding: 5, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 15 },
  closeButtonText: { fontSize: 18, color: '#333', fontWeight: 'bold' },
  imagemParada: { width: '100%', height: 120, borderRadius: 10, marginBottom: 10 },
  imagemPlaceholder: { width: '100%', height: 120, borderRadius: 10, marginBottom: 10, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  textoPlaceholder: { color: '#888', fontStyle: 'italic' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  alertasContainer: { marginBottom: 10 },
  reporteContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  textoReporte: { fontSize: 14, fontWeight: 'bold', color: '#FF3B30', marginLeft: 6 },
  bannerPolicia: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B30', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 5 },
  textoBannerPolicia: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginLeft: 6, flexShrink: 1 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  badge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, marginRight: 10, marginBottom: 5 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
  button: { backgroundColor: '#00A86B', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  botaoEmergencia: { backgroundColor: '#D9534F', marginTop: 5, borderWidth: 2, borderColor: '#C9302C' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  reportOption: { width: '100%', backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  reportOptionText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cancelButton: { backgroundColor: '#333', marginTop: 10 },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' }
});