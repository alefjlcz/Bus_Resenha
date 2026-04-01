import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';

// 1. ATUALIZANDO A INTERFACE PARA RECEBER A NOVA PROP DO GEOFENCING
interface CardParadaProps {
  parada: any;
  usuarioEstaNaParada?: boolean; 
}

export default function CardParada({ parada, usuarioEstaNaParada }: CardParadaProps) { // 2. RECEBENDO A PROP
  const [modalVisivel, setModalVisivel] = useState(false);
  
  // 3. NOVO ESTADO: Contador simulado de pessoas na parada
  const [pessoasNaParada, setPessoasNaParada] = useState(12); // Começa com um valor fictício (ex: 12 pessoas)

  // 4. EFEITO MÁGICO DO GEOFENCING: 
  // Toda vez que a prop 'usuarioEstaNaParada' mudar, esse código roda.
  useEffect(() => {
    if (usuarioEstaNaParada) {
      // Se o usuário entrou no raio de 30m, soma +1 pessoa no contador
      setPessoasNaParada(prev => prev + 1);
    } else {
      // Opcional: Se ele sair, você pode subtrair (ou manter se quiser que o contador não baixe)
      // setPessoasNaParada(prev => prev > 0 ? prev - 1 : 0);
    }
  }, [usuarioEstaNaParada]); // Array de dependência: só executa quando essa prop muda

  if (!parada) return null; 

  const enviarReporte = (problema: string) => {
    Alert.alert("Sucesso!", `Você reportou: ${problema}. A comunidade agradece!`);
    setModalVisivel(false); 
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.cardTitle}>{parada.nome}</Text>
      
      <View style={styles.badgesRow}>
        <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.badgeText, { color: '#2E7D32' }]}>🟢 Lotação: Suave</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.badgeText, { color: '#EF6C00' }]}>⛅ Clima: Limpo</Text>
        </View>
        
        {/* 5. NOVO BADGE: Mostrando o contador de pessoas e se VOCÊ está lá */}
        <View style={[styles.badge, { backgroundColor: usuarioEstaNaParada ? '#E3F2FD' : '#F5F5F5' }]}>
          <Text style={[styles.badgeText, { color: usuarioEstaNaParada ? '#1565C0' : '#757575' }]}>
            👥 {pessoasNaParada} pessoas {usuarioEstaNaParada ? '(Você está aqui!)' : ''}
          </Text>
        </View>
      </View>

      <Text style={styles.cardDescription}>
        A resenha desta parada está tranquila. Local com boa iluminação e fluxo normal.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => setModalVisivel(true)}>
        <Text style={styles.buttonText}>Reportar Problema</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide" 
        transparent={true}    
        visible={modalVisivel} 
        onRequestClose={() => setModalVisivel(false)} 
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <Text style={styles.modalTitle}>O que está acontecendo?</Text>
            <Text style={styles.modalSubtitle}>Parada: {parada.nome}</Text>

            <TouchableOpacity style={styles.reportOption} onPress={() => enviarReporte("Parada Lotada")}>
              <Text style={styles.reportOptionText}>🥵 Muito Lotado</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportOption} onPress={() => enviarReporte("Local Escuro/Perigoso")}>
              <Text style={styles.reportOptionText}>⚠️ Local Escuro / Perigoso</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportOption} onPress={() => enviarReporte("Ônibus Demorando")}>
              <Text style={styles.reportOptionText}>🚌 Ônibus Demorando</Text>
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
  cardContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }, // Adicionei flexWrap para os badges não quebrarem o layout se ficarem grandes
  badge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, marginRight: 10, marginBottom: 5 }, // Adicionei marginBottom pro flexWrap funcionar bem
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
  button: { backgroundColor: '#00A86B', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // --- ESTILOS NOVOS DO MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  reportOption: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  reportOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#FF3B30', 
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  }
});