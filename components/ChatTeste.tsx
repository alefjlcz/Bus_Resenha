import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { atualizarPosicao, auth, db, enviarLocalizacao, enviarMensagem, ouvirMensagens } from '../chat/firebase';

const LISTA_AVATARES = [
  { id: 'Homem Meditando', img: require('../assets/avatares/meditacao_homem.png') },
  { id: 'Mulher Meditando', img: require('../assets/avatares/meditacao_mulher.png') }
];

export default function ChatTeste() {
  const router = useRouter();
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [texto, setTexto] = useState('');
  
  const [usuarioAtual, setUsuarioAtual] = useState('Carregando...');
  const [isUniversitario, setIsUniversitario] = useState(false);
  const [minhaTag, setMinhaTag] = useState('');
  
  const [meuAvatar, setMeuAvatar] = useState('Homem Meditando'); 
  const [minhaFotoGaleria, setMinhaFotoGaleria] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const rastreadorGps = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsubscribeUsuario = onSnapshot(doc(db, "usuarios", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const dados = docSnap.data();
          setUsuarioAtual(dados.nome);
          setIsUniversitario(dados.isUniversitario);
          setMinhaTag(dados.tagLinha || '');
          setMeuAvatar(dados.avatarId || 'Homem Meditando'); 
          setMinhaFotoGaleria(dados.fotoPerfil || null); 
        } else {
          setUsuarioAtual(user.email?.split('@')[0] || 'Usuário'); 
        }
      });
      return () => unsubscribeUsuario();
    }
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

  const iniciarGpsRealTime = async (minutos: number) => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert("Aviso", "Precisamos do GPS para compartilhar a viagem!");
      return;
    }

    try {
      Alert.alert("Iniciando", "Compartilhando a sua localização.");
      
      let localizacaoInicial = await Location.getCurrentPositionAsync({});
      const nomeCompleto = usuarioAtual + (isUniversitario ? ' 🎓' : '');
      const avatarParaSalvar = minhaFotoGaleria ? minhaFotoGaleria : meuAvatar;
      
      const msgId = await enviarLocalizacao(salaDoChat, nomeCompleto, minutos, minhaTag, avatarParaSalvar);
      
      await atualizarPosicao(salaDoChat, msgId, localizacaoInicial.coords.latitude, localizacaoInicial.coords.longitude);

      rastreadorGps.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (novaPosicao) => {
          atualizarPosicao(salaDoChat, msgId, novaPosicao.coords.latitude, novaPosicao.coords.longitude);
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
      const avatarParaSalvar = minhaFotoGaleria ? minhaFotoGaleria : meuAvatar;
      await enviarMensagem(salaDoChat, mensagemGuardada, usuarioAtual + (isUniversitario ? ' 🎓' : ''), minhaTag, avatarParaSalvar);
    } catch (error: any) {
      setTexto(mensagemGuardada); 
      Alert.alert("Erro", "Falha ao enviar mensagem.");
    }
  };

  // ==================================================
  // 🕒 NOVA FUNÇÃO: Traduz o horário do Firebase
  // ==================================================
  const formatarHorario = (firebaseTimestamp: any) => {
    // Se o timestamp for nulo, a mensagem ainda está viajando pro servidor
    if (!firebaseTimestamp) return "enviando..."; 
    
    try {
      const data = firebaseTimestamp.toDate();
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "";
    }
  };

  const renderMensagem = ({ item }: { item: any }) => {
    const isMinhaMensagem = item.usuario.includes(usuarioAtual);
    const identificadorFoto = isMinhaMensagem ? (minhaFotoGaleria || meuAvatar) : item.avatarId;
    
    let imagemDaMensagem;
    if (identificadorFoto && identificadorFoto.startsWith('data:image')) {
      imagemDaMensagem = { uri: identificadorFoto };
    } else {
      imagemDaMensagem = LISTA_AVATARES.find(a => a.id === identificadorFoto)?.img || LISTA_AVATARES[0].img;
    }

    return (
      <View style={[styles.mensagemWrapper, isMinhaMensagem ? styles.wrapperMinha : styles.wrapperOutra]}>
        
        <Image 
          source={imagemDaMensagem} 
          style={[styles.avatarImg, isMinhaMensagem ? styles.avatarMinhaImg : null]} 
        />

        <View style={[styles.balaoContainer, isMinhaMensagem ? styles.minhaMensagem : styles.outraMensagem]}>
          <View style={styles.headerMensagem}>
            <Text style={[styles.nome, isMinhaMensagem ? styles.nomeBranco : null]}>
              {item.usuario}
            </Text>
            
            {item.tagLinha ? (
              <View style={[styles.discordBadge, isMinhaMensagem ? styles.discordBadgeMinha : null]}>
                <Text style={[styles.discordBadgeText, isMinhaMensagem ? styles.discordBadgeTextMinha : null]}>
                  🚌 {item.tagLinha}
                </Text>
              </View>
            ) : null}
          </View>

          {item.tipo === 'localizacao' ? (
            <>
              <Text style={[styles.texto, isMinhaMensagem ? styles.textoBranco : null, { fontWeight: 'bold', marginBottom: 5 }]}>📍 Viagem ao Vivo</Text>
              <Text style={[styles.texto, isMinhaMensagem ? styles.textoBranco : null, { fontSize: 12, marginBottom: 5 }]}>{item.texto}</Text>
              <TouchableOpacity style={styles.botaoAcompanhar} onPress={() => router.push({ pathname: '/mapa_viagem', params: { chatId: salaDoChat, msgId: item.id } })}>
                <Text style={styles.textoBotaoAcompanhar}>🗺️ Ver no Mapa</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[styles.texto, isMinhaMensagem ? styles.textoBranco : null]}>
              {item.texto}
            </Text>
          )}

          {/* 🕒 AQUI ENTRA O HORÁRIO DA MENSAGEM */}
          <Text style={[styles.horarioTxt, isMinhaMensagem ? styles.horarioTxtMinha : null]}>
            {formatarHorario(item.timestamp)}
          </Text>

        </View>
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
        ref={flatListRef}
        data={mensagens}
        extraData={{ meuAvatar, minhaFotoGaleria }} 
        keyExtractor={(item) => item.id}
        renderItem={renderMensagem}
        contentContainerStyle={styles.listaMensagens}
        removeClippedSubviews={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
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
  listaMensagens: { padding: 10, paddingBottom: 20 }, 
  
  mensagemWrapper: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
  wrapperMinha: { flexDirection: 'row-reverse', alignSelf: 'flex-end' },
  wrapperOutra: { flexDirection: 'row', alignSelf: 'flex-start' },
  
  avatarImg: { width: 36, height: 36, borderRadius: 18, marginHorizontal: 8, backgroundColor: '#CCC' },
  avatarMinhaImg: { borderWidth: 2, borderColor: '#00A86B' },

  balaoContainer: { maxWidth: '75%', padding: 10, borderRadius: 12, elevation: 1 },
  minhaMensagem: { backgroundColor: '#00A86B', borderBottomRightRadius: 0 },
  outraMensagem: { backgroundColor: '#FFF', borderBottomLeftRadius: 0 },
  
  headerMensagem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' },
  nome: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  nomeBranco: { color: '#E0E0E0' }, 
  
  discordBadge: { backgroundColor: '#1E1F22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
  discordBadgeMinha: { backgroundColor: '#FFF' }, 
  discordBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  discordBadgeTextMinha: { color: '#00A86B' }, 
  
  texto: { fontSize: 16, color: '#333' },
  textoBranco: { color: '#FFF' },

  horarioTxt: { fontSize: 10, color: '#999', alignSelf: 'flex-end', marginTop: 4 },
  horarioTxtMinha: { color: '#D0F0C0' }, 
  
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#CCC', alignItems: 'center' },
  botaoAnexo: { marginRight: 10 }, 
  input: { flex: 1, height: 40, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 15, marginRight: 10 },
  botaoEnviar: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#00A86B', borderRadius: 20, paddingHorizontal: 15, height: 40 },
  textoBotao: { color: '#FFF', fontWeight: 'bold' },
  botaoAcompanhar: { backgroundColor: '#FFF', padding: 8, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  textoBotaoAcompanhar: { color: '#00A86B', fontWeight: 'bold' }
});