import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// 🎒 ESSA É A FERRAMENTA QUE PEGA O ID DA LINHA DA TELA ANTERIOR
import { useLocalSearchParams } from 'expo-router';

import { enviarMensagem, ouvirMensagens } from '../chat/firebase';

export default function ChatTeste() {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [texto, setTexto] = useState('');
  
  const usuarioAtual = 'Alessandro'; 

  // 1. ABRINDO A MALA: Pegamos o ID e o Nome que vieram da Lista de Chats
  const { idLinha, nomeLinha } = useLocalSearchParams();

  // 2. SALA DINÂMICA: Criamos o nome do chat baseado na linha!
  // Se for a linha 932, a sala vai se chamar "chat_linha_932"
  const salaDoChat = idLinha ? `chat_linha_${idLinha}` : 'chat_geral_teste';
  
  // O Título lá no topo também muda de acordo com o ônibus escolhido
  const tituloDaTela = nomeLinha ? nomeLinha : 'Resenha do Busão';

  // 3. OUVINTE DO FIREBASE (Agora escuta só a sala específica)
  useEffect(() => {
    const unsubscribe = ouvirMensagens(salaDoChat, (msgs: any[]) => {
      setMensagens(msgs);
    });

    return () => unsubscribe();
  }, [salaDoChat]); // 👈 Isso garante que se a sala mudar, ele limpa a tela e carrega a nova

  // 4. FUNÇÃO DE ENVIAR MENSAGEM (Envia para a sala específica)
  const handleEnviar = async () => {
    if (texto.trim() === '') return; 

    try {
      await enviarMensagem(salaDoChat, texto, usuarioAtual);
      setTexto(''); 
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Deu erro ao enviar. O Firestore está em modo de teste?");
    }
  };

  const renderMensagem = ({ item }: { item: any }) => {
    const isMinhaMensagem = item.usuario === usuarioAtual;

    return (
      <View style={[
        styles.balaoContainer, 
        isMinhaMensagem ? styles.minhaMensagem : styles.outraMensagem
      ]}>
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        {/* O título dinâmico entra aqui */}
        <Text style={styles.headerTitle}>{tituloDaTela}</Text>
      </View>

      <FlatList
        data={mensagens}
        keyExtractor={(item) => item.id}
        renderItem={renderMensagem}
        contentContainerStyle={styles.listaMensagens}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Manda a resenha do ${idLinha ? idLinha : 'busão'}...`}
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
  header: {
    backgroundColor: '#00A86B',
    padding: 15,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  listaMensagens: { padding: 10 },
  balaoContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  minhaMensagem: {
    alignSelf: 'flex-end',
    backgroundColor: '#00A86B',
    borderBottomRightRadius: 0,
  },
  outraMensagem: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 0,
  },
  nome: { fontSize: 12, color: '#666', marginBottom: 4, fontWeight: 'bold' },
  texto: { fontSize: 16, color: '#333' },
  textoBranco: { color: '#FFF' },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#CCC',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  botaoEnviar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00A86B',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  textoBotao: { color: '#FFF', fontWeight: 'bold' }
});