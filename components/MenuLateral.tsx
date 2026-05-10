import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Importando a nossa função de Sair!
import { sairDaConta } from '../chat/firebase';

const LARGURA_TELA = Dimensions.get('window').width;
const LARGURA_GAVETA = LARGURA_TELA * 0.7;

interface MenuLateralProps {
  visivel: boolean;
  fecharMenu: () => void;
}

export default function MenuLateral({ visivel, fecharMenu }: MenuLateralProps) {
  const router = useRouter();
  const animacaoGaveta = useRef(new Animated.Value(-LARGURA_GAVETA)).current;

  // Escuta a prop "visivel" para saber se a gaveta deve entrar ou sair
  useEffect(() => {
    if (visivel) {
      Animated.timing(animacaoGaveta, {
        toValue: 0, 
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animacaoGaveta, {
        toValue: -LARGURA_GAVETA, 
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visivel]);

  const irParaChat = () => {
    fecharMenu();
    setTimeout(() => {
      router.push('/lista_chats'); 
    }, 300);
  };

  const irParaPerfil = () => {
    fecharMenu();
    setTimeout(() => {
      router.push('/perfil'); 
    }, 300);
  };

  // NOVA FUNÇÃO: Ir para a tela de configurações recém criada
  const irParaConfiguracoes = () => {
    fecharMenu();
    setTimeout(() => {
      router.push('/configuracoes'); 
    }, 300);
  };

  // === 🚪 NOVA FUNÇÃO DE LOGOUT ===
  const fazerLogout = async () => {
    try {
      await sairDaConta(); // Limpa a memória do celular lá no Firebase
      fecharMenu(); // Fecha a gavetinha
      router.replace('/'); // Manda o usuário de volta para a tela de Login!
    } catch (error) {
      Alert.alert("Erro", "Não foi possível sair da conta.");
    }
  };

  return (
    <Modal
      visible={visivel}
      transparent={true}
      animationType="none" 
      onRequestClose={fecharMenu}
    >
      <View style={styles.fundoModal}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fecharMenu}>
          <View style={styles.fundoEscuro} />
        </Pressable>

        <Animated.View style={[
          styles.gavetaMenu, 
          { transform: [{ translateX: animacaoGaveta }] }
        ]}>
          
          <View style={styles.headerGaveta}>
            <Text style={styles.tituloGaveta}>Opções</Text>
          </View>

          <View style={styles.containerItens}>
            
            <TouchableOpacity style={styles.itemMenu} onPress={irParaChat}>
              <Ionicons name="chatbubbles" size={24} color="#00A86B" />
              <Text style={styles.textoItemMenu}>Chat da Resenha</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.itemMenu} onPress={irParaPerfil}>
              <Ionicons name="person-circle" size={24} color="#00A86B" />
              <Text style={styles.textoItemMenu}>O Meu Perfil</Text>
            </TouchableOpacity>

            {/* AQUI ESTÁ: O botão que conecta com a sua tela nova! */}
            <TouchableOpacity style={styles.itemMenu} onPress={irParaConfiguracoes}>
              <Ionicons name="settings" size={24} color="#666" />
              <Text style={styles.textoItemMenu}>Configurações</Text>
            </TouchableOpacity>

          </View>

          {/* === BOTÃO DE SAIR LÁ EMBAIXO === */}
          <TouchableOpacity style={styles.itemMenuSair} onPress={fazerLogout}>
            <Ionicons name="log-out-outline" size={26} color="#D9534F" />
            <Text style={styles.textoItemMenuSair}>Sair da Conta</Text>
          </TouchableOpacity>
          
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundoModal: { flex: 1, flexDirection: 'row' },
  fundoEscuro: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  gavetaMenu: {
    width: LARGURA_GAVETA,
    height: '100%',
    backgroundColor: '#FFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    justifyContent: 'space-between', 
  },
  headerGaveta: { backgroundColor: '#00A86B', padding: 20, paddingTop: 40, marginBottom: 10 },
  tituloGaveta: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  containerItens: {
    flex: 1, 
  },
  itemMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  textoItemMenu: { fontSize: 18, marginLeft: 15, color: '#333', fontWeight: '500' },
  
  itemMenuSair: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF5F5', 
  },
  textoItemMenuSair: { 
    fontSize: 18, 
    marginLeft: 15, 
    color: '#D9534F', 
    fontWeight: 'bold' 
  }
});