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

// Importando as funções do Firebase que o seu amigo fez
import { enviarMensagem, ouvirMensagens } from '../chat/firebase';

export default function ChatTeste() {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [texto, setTexto] = useState('');
  
  // Nome fixo para testarmos agora
  const usuarioAtual = 'Alessandro'; 
  
  // ID da sala de chat para o teste
  const chatIdTeste = 'chat_cidade_nova_teste';

  // 1. OUVINTE DO FIREBASE (Fica buscando mensagens novas em tempo real)
  useEffect(() => {
    const unsubscribe = ouvirMensagens(chatIdTeste, (msgs: any[]) => {
      setMensagens(msgs);
    });

    // Desliga o ouvinte quando sair da tela
    return () => unsubscribe();
  }, []);

  // 2. FUNÇÃO DE ENVIAR MENSAGEM
  const handleEnviar = async () => {
    if (texto.trim() === '') return; 

    try {
      await enviarMensagem(chatIdTeste, texto, usuarioAtual);
      setTexto(''); // Limpa a caixa de texto
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Deu erro ao enviar. O Firestore está em modo de teste?");
    }
  };

  // 3. DESENHO DOS BALÕES DE MENSAGEM (Estilo Zap)
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
        <Text style={styles.headerTitle}>Chat: Cidade Nova</Text>
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
          placeholder="Manda a resenha do busão..."
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