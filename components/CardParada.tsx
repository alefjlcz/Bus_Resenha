import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; 
import { mapaFotos } from '../assets/dados/mapa_fotos'; 

interface CardParadaProps {
  parada: any;
  usuarioEstaNaParada?: boolean; 
  fecharCard: () => void;
  statusGlobal: Record<string, string>; 
  registrarResenha: (id: string, status: string) => void; 
}

export default function CardParada({ 
  parada, 
  usuarioEstaNaParada, 
  fecharCard,
  statusGlobal,
  registrarResenha
}: CardParadaProps) {
  
  const [modalVisivel, setModalVisivel] = useState(false);
  const [pessoasNaParada, setPessoasNaParada] = useState(12); 

  useEffect(() => {
    if (usuarioEstaNaParada) setPessoasNaParada(prev => prev + 1);
  }, [usuarioEstaNaParada]); 

  if (!parada) return null; 

  const enviarReporte = (statusId: string, mensagem: string) => {
    registrarResenha(parada.id.toString(), statusId);
    Alert.alert("Resenha Registrada!", mensagem);
    setModalVisivel(false); 
  };

  const fotoDaRua = mapaFotos[parada.id.toString()];
  const statusAtual = statusGlobal[parada.id.toString()] || "ok";
  
  // Define o badge baseado nas 3 cores novas
  let iconeStatus = "✅ Tudo Ok";
  let corStatusFundo = "#E8F5E9"; // Verde claro
  let corStatusTexto = "#2E7D32"; // Verde escuro

  if (statusAtual === "cuidado") {
    iconeStatus = "⚠️ Cuidado/Alagada";
    corStatusFundo = "#FFF9C4"; // Amarelo claro
    corStatusTexto = "#F57F17"; // Amarelo escuro (quase laranja para dar leitura)
  } else if (statusAtual === "perigoso") {
    iconeStatus = "🚨 Perigoso";
    corStatusFundo = "#FFEBEE"; // Vermelho claro
    corStatusTexto = "#C62828"; // Vermelho escuro
  }

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity style={styles.closeButton} onPress={fecharCard}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {fotoDaRua ? (
        <Image source={fotoDaRua} style={styles.imagemParada} resizeMode="cover" />
      ) : (
        <View style={styles.imagemPlaceholder}><Text style={styles.textoPlaceholder}>Foto indisponível</Text></View>
      )}

      <Text style={styles.cardTitle}>{parada.nome}</Text>
      
      <View style={styles.badgesRow}>
        <View style={[styles.badge, { backgroundColor: corStatusFundo }]}>
          <Text style={[styles.badgeText, { color: corStatusTexto }]}>{iconeStatus}</Text>
        </View>
        
        <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.badgeText, { color: '#1565C0' }]}>
            {parada.status_clima !== "desconhecido" ? parada.status_clima : "⛅ Clima: Limpo"}
          </Text>
        </View>
      </View>

      <Text style={styles.cardDescription}>
        {statusAtual === "cuidado" 
          ? "Atenção: Relatos de alagamento ou situação que exige cuidado nesta parada." 
          : statusAtual === "perigoso"
          ? "Atenção máxima: Evite este local. Relatos de perigo/assalto recentemente."
          : "A resenha desta parada está tranquila. Local com fluxo normal e seguro."}
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => setModalVisivel(true)}>
        <Text style={styles.buttonText}>Lançar a Resenha (Reportar)</Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisivel} onRequestClose={() => setModalVisivel(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Qual a resenha da parada?</Text>
          
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

// OS ESTILOS DO CARD PERMANECEM OS MESMOS DO ÚLTIMO
const styles = StyleSheet.create({
  cardContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 15, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  closeButton: { position: 'absolute', top: 10, right: 15, zIndex: 10, padding: 5, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 15 },
  closeButtonText: { fontSize: 18, color: '#333', fontWeight: 'bold' },
  imagemParada: { width: '100%', height: 120, borderRadius: 10, marginBottom: 10 },
  imagemPlaceholder: { width: '100%', height: 120, borderRadius: 10, marginBottom: 10, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  textoPlaceholder: { color: '#888', fontStyle: 'italic' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }, 
  badge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, marginRight: 10, marginBottom: 5 }, 
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
  button: { backgroundColor: '#00A86B', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  reportOption: { width: '100%', backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  reportOptionText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cancelButton: { backgroundColor: '#333', marginTop: 10 },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' }
});