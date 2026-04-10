import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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

          <TouchableOpacity style={styles.itemMenu} onPress={irParaChat}>
            <Ionicons name="chatbubbles" size={24} color="#00A86B" />
            <Text style={styles.textoItemMenu}>Chat da Resenha</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemMenu} onPress={() => alert('Em breve!')}>
            <Ionicons name="settings" size={24} color="#666" />
            <Text style={styles.textoItemMenu}>Configurações</Text>
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
  },
  headerGaveta: { backgroundColor: '#00A86B', padding: 20, paddingTop: 40, marginBottom: 10 },
  tituloGaveta: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  itemMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  textoItemMenu: { fontSize: 18, marginLeft: 15, color: '#333', fontWeight: '500' }
});