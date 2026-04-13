import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { auth, atualizarPosicao, db, enviarLocalizacao, enviarMensagem, ouvirMensagens } from '../chat/firebase';

export default function ChatTeste() {
  const router = useRouter();
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [texto, setTexto] = useState('');
  const [usuarioAtual, setUsuarioAtual] = useState('Carregando...');
  const [isUniversitario, setIsUniversitario] = useState(false);

  // Guarda o "rastreador" do GPS para podermos desligar depois
  const rastreadorGps = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    const buscarUsuario = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUsuarioAtual(docSnap.data().nome);
          setIsUniversitario(docSnap.data().isUniversitario);
        } else {
          setUsuarioAtual(user.email?.split('@')[0] || 'Usuário'); 
        }
      }
    };
    buscarUsuario();
  }, []);

  const { idLinha, nomeLinha } = useLocalSearchParams();
  const salaDoChat = idLinha ? `chat_linha_${idLinha}` : 'chat_geral_teste';
  const tituloDaTela = nomeLinha ? nomeLinha : 'Resenha do Busão';

  useEffect(() => {
    const unsubscribe = ouvirMensagens(salaDoChat, (msgs: any[]) => {
      setMensagens(msgs);
    });
    return () => unsubscribe();
  }, [salaDoChat]);

  // =============================
  // LÓGICA DO GPS
  // =============================
  const iniciarGpsRealTime = async (minutos: number) => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert("Aviso", "Precisamos do GPS para compartilhar a viagem!");
      return;
    }

    try {
      Alert.alert("Iniciando", "Conectando ao satélite...");
      
      // Pega a posição logo de cara
      let localizacaoInicial = await Location.getCurrentPositionAsync({});
      
      const nomeCompleto = usuarioAtual + (isUniversitario ? ' 🎓' : '');
      
      // 1. Cria a mensagem especial de localização no banco
      const msgId = await enviarLocalizacao(salaDoChat, nomeCompleto, minutos);
      
      // 2. Atualiza com a primeira coordenada
      await atualizarPosicao(
        salaDoChat, msgId, 
        localizacaoInicial.coords.latitude, 
        localizacaoInicial.coords.longitude
      );

      // 3. Fica vigiando o movimento do ônibus
      rastreadorGps.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, 
          distanceInterval: 10,
        },
        (novaPosicao) => {
          atualizarPosicao(
            salaDoChat, msgId, 
            novaPosicao.coords.latitude, 
            novaPosicao.coords.longitude
          );
        }
      );

      Alert.alert("Sucesso!", `Sua viagem está sendo compartilhada por ${minutos} min.`);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível ligar o GPS.");
    }
  };

  const abrirMenuGPS = () => {
    Alert.alert(
      "📍 Compartilhar Viagem",
      "Por quanto tempo você quer enviar a localização do busão?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "15 Minutos", onPress: () => iniciarGpsRealTime(15) },
        { text: "30 Minutos", onPress: () => iniciarGpsRealTime(30) },
        { text: "1 Hora", onPress: () => iniciarGpsRealTime(60) }
      ]
    );
  };

  const handleEnviar = async () => {
    if (texto.trim() === '') return; 
    const mensagemGuardada = texto;
    setTexto(''); 

    try {
      await enviarMensagem(salaDoChat, mensagemGuardada, usuarioAtual + (isUniversitario ? ' 🎓' : ''));
    } catch (error: any) {
      setTexto(mensagemGuardada); 
      Alert.alert("Erro", "Falha ao enviar mensagem.");
    }
  };

  // =============================
  // DESENHO DAS MENSAGENS
  // =============================
  const renderMensagem = ({ item }: { item: any }) => {
    const isMinhaMensagem = item.usuario.includes(usuarioAtual);

    // SE A MENSAGEM FOR UM GPS, DESENHA O CARD DE LOCALIZAÇÃO
    if (item.tipo === 'localizacao') {
      return (
        <View style={[styles.balaoContainer, isMinhaMensagem ? styles.minhaMensagem : styles.outraMensagem]}>
          {!isMinhaMensagem && <Text style={styles.nome}>{item.usuario}</Text>}
          
          <Text style={[styles.texto, isMinhaMensagem ? styles.textoBranco : null, { fontWeight: 'bold', marginBottom: 5 }]}>
            📍 Viagem ao Vivo
          </Text>
          <Text style={[styles.texto, isMinhaMensagem ? styles.textoBranco : null, { fontSize: 12, marginBottom: 10 }]}>
            {item.texto}
          </Text>
          
          <TouchableOpacity 
            style={styles.botaoAcompanhar}
            onPress={() => router.push({ 
              pathname: '/mapa_viagem', 
              params: { chatId: salaDoChat, msgId: item.id } 
            })}
          >
            <Text style={styles.textoBotaoAcompanhar}>🗺️ Ver no Mapa</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // SE FOR MENSAGEM DE TEXTO COMUM, SEGUE NORMAL
    return (
      <View style={[styles.balaoContainer, isMinhaMensagem ? styles.minhaMensagem : styles.outraMensagem]}>
        {!isMinhaMensagem && <Text style={styles.nome}>{item.usuario}</Text>}
        <Text style={[styles.texto, isMinhaMensagem ? styles.textoBranco : null]}>
          {item.texto}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{tituloDaTela}</Text>
      </View>

      <FlatList
        data={mensagens}
        keyExtractor={(item) => item.id}
        renderItem={renderMensagem}
        contentContainerStyle={styles.listaMensagens}
        removeClippedSubviews={false}
      />

      <View style={styles.inputContainer}>
        {/* BOTÃO DOS 3 PONTINHOS / ANEXO */}
        <TouchableOpacity style={styles.botaoAnexo} onPress={abrirMenuGPS}>
          <Ionicons name="add-circle" size={32} color="#00A86B" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder={`Onde está o busão?`}
          value={texto}
          onChangeText={setTexto}
        />
        <TouchableOpacity style={styles.botaoEnviar} onPress={handleEnviar}>
          <Text style={styles.textoBotao}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DDD5' },
  header: { backgroundColor: '#00A86B', padding: 15, paddingTop: 40, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  listaMensagens: { padding: 10 },
  balaoContainer: { maxWidth: '80%', padding: 10, borderRadius: 8, marginBottom: 10 },
  minhaMensagem: { alignSelf: 'flex-end', backgroundColor: '#00A86B', borderBottomRightRadius: 0 },
  outraMensagem: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 0 },
  nome: { fontSize: 12, color: '#666', marginBottom: 4, fontWeight: 'bold' },
  texto: { fontSize: 16, color: '#333' },
  textoBranco: { color: '#FFF' },
  
  // Estilos da Base do Chat
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#CCC', alignItems: 'center' },
  botaoAnexo: { marginRight: 10 }, // Espaçamento dos 3 pontinhos
  input: { flex: 1, height: 40, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 15, marginRight: 10 },
  botaoEnviar: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#00A86B', borderRadius: 20, paddingHorizontal: 15, height: 40 },
  textoBotao: { color: '#FFF', fontWeight: 'bold' },

  // Estilos do Card de GPS
  botaoAcompanhar: { backgroundColor: '#FFF', padding: 8, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  textoBotaoAcompanhar: { color: '#00A86B', fontWeight: 'bold' }
});