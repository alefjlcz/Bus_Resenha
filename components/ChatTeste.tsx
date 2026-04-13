import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { auth, db } from '../chat/firebase';

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

// ESSA É A FERRAMENTA QUE PEGA O ID DA LINHA DA TELA ANTERIOR
import { useLocalSearchParams } from 'expo-router';

import { enviarMensagem, ouvirMensagens } from '../chat/firebase';
export default function ChatTeste() {
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [texto, setTexto] = useState('');

  // Estados para guardar quem é o usuário logado
  const [usuarioAtual, setUsuarioAtual] = useState('Carregando...');
  const [isUniversitario, setIsUniversitario] = useState(false);

  // Busca o usuário logado assim que a tela de chat abre
  useEffect(() => {
    const buscarUsuario = async () => {
      const user = auth.currentUser;
      if (user) {
        // Vai lá na pasta "usuarios" procurar o selo dele
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
      console.log("Mensagens que chegaram da nuvem: ", msgs.length);
      setMensagens(msgs);
    });

    return () => unsubscribe();
  }, [salaDoChat]); // Isso garante que se a sala mudar, ele limpa a tela e carrega a nova

  // FUNÇÃO DE ENVIAR MENSAGEM 
  const handleEnviar = async () => {
    if (texto.trim() === '') return; 

    const mensagemGuardada = texto;
    setTexto(''); 

    try {
      console.log(`Tentando enviar "${mensagemGuardada}" para a sala: ${salaDoChat}`);
      
      // Tenta mandar pra nuvem
      await enviarMensagem(salaDoChat, mensagemGuardada, usuarioAtual + (isUniversitario ? ' 🎓' : ''));
      
      // SE CHEGAR NESSA LINHA, É 100% DE CERTEZA QUE ESTÁ LÁ!
      console.log("🚀 SUCESSO TOTAL! O Firebase confirmou o recebimento!");
      alert("✅ Mensagem enviada com sucesso pro Firebase!");
      
    } catch (error: any) {
      console.error("❌ Ocorreu um erro oculto:", error);
      setTexto(mensagemGuardada); 
      alert(`Erro: ${error.message}`);
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