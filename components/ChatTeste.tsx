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
  }, [salaDoChat]); // Isso garante que se a sala mudar, ele limpa a tela e carrega a nova

  // FUNÇÃO DE ENVIAR MENSAGEM 
  const handleEnviar = async () => {
    if (texto.trim() === '') return; 

    const mensagemGuardada = texto; // Guarda o texto rápido
    setTexto(''); // Limpa a caixa na mesma hora 

    try {
      // Tenta enviar para a nuvem depois que a tela já limpou
      await enviarMensagem(salaDoChat, mensagemGuardada, usuarioAtual);
    } catch (error) {
      console.error("Erro ao enviar:", error);
      // Se der erro, devolve o texto pra caixa pra pessoa não perder o que digitou
      setTexto(mensagemGuardada); 
      alert("Deu erro ao enviar para o servidor.");
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
      // Muda o comportamento dependendo se é iPhone ou Android
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // Compensa o tamanho do cabeçalho verde (tente 90 ou 100 se precisar)
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
        removeClippedSubviews={false}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Onde está o ${idLinha ? idLinha : 'busão'}?`}
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