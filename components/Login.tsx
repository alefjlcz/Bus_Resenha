import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Puxando as funções do nosso banco
import { auth, criarConta, db, entrarNaConta } from '../chat/firebase';

// Isso é obrigatório para a janelinha do Google conseguir fechar e voltar pro app
WebBrowser.maybeCompleteAuthSession();

export default function TelaLogin() {
  // === CONFIGURAÇÃO DO GOOGLE (PUXANDO DO .ENV) ===
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: clientId, 
    androidClientId: clientId, // O TRUQUE: Enganando o Android no Expo Go
    iosClientId: clientId,     // O TRUQUE: Enganando o iOS no Expo Go
  });
  // ===============================

  const [modoCadastro, setModoCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  // === OUVINTE DO GOOGLE ===
  // Fica esperando a janelinha do Google fechar para pegar os dados
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credencial = GoogleAuthProvider.credential(id_token);
      
      signInWithCredential(auth, credencial)
        .then(async (resultado) => {
          const usuario = resultado.user;
          
          // Verifica se é a primeira vez que essa pessoa entra com o Google
          const docRef = doc(db, "usuarios", usuario.uid);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
             // Se for a primeira vez, cria o perfil dele no banco!
             const isUniversitario = usuario.email?.endsWith('.edu.br') || 
                                     usuario.email?.includes('@alunos.estacio.br') || 
                                     usuario.email?.includes('@ufpa.br') ||
                                     usuario.email?.includes('@uepa.br');

             await setDoc(doc(db, "usuarios", usuario.uid), {
                id: usuario.uid,
                nome: usuario.displayName || 'Sem Nome',
                email: usuario.email,
                isUniversitario: isUniversitario,
                contaCriadaEm: serverTimestamp(),
                verificado: usuario.emailVerified
             });
          }
          
          Alert.alert('Sucesso!', 'Logado com o Google!');
          router.replace('/home'); 
        })
        .catch((error) => {
          Alert.alert('Erro no Google', error.message);
        });
    }
  }, [response]);

  const handleAutenticacao = async () => {
    if (!email || !senha || (modoCadastro && !nome)) {
      Alert.alert('Ops!', 'Preencha todos os campos.');
      return;
    }

    setCarregando(true);
    
    try {
      if (modoCadastro) {
        await criarConta(nome, email.trim(), senha);
        Alert.alert('Sucesso!', 'Conta criada com sucesso!');
      } else {
        await entrarNaConta(email.trim(), senha);
      }
      router.replace('/home'); 
    } catch (error: any) {
      Alert.alert('Erro', error.message); 
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.box}>
        <Text style={styles.titulo}>Bus Resenha</Text>
        <Text style={styles.subtitulo}>{modoCadastro ? 'Crie sua conta' : 'Bem-vindo de volta!'}</Text>

        {modoCadastro && (
          <TextInput
            style={styles.input}
            placeholder="Seu Nome (Ex: Alessandro)"
            value={nome}
            onChangeText={setNome}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="E-mail (use o da faculdade se tiver!)"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha (mínimo 6 caracteres)"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity style={styles.botaoPrincipal} onPress={handleAutenticacao} disabled={carregando}>
          <Text style={styles.textoBotao}>{carregando ? 'Aguarde...' : (modoCadastro ? 'Cadastrar' : 'Entrar')}</Text>
        </TouchableOpacity>

        {/* O BOTÃO DO GOOGLE AGORA ESTÁ VIVO! */}
        <TouchableOpacity 
          style={styles.botaoGoogle} 
          onPress={() => promptAsync()} 
          disabled={!request}
        >
          <Text style={styles.textoGoogle}>G Continuar com o Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setModoCadastro(!modoCadastro)}>
          <Text style={styles.textoTrocar}>
            {modoCadastro ? 'Já tem uma conta? Faça Login' : 'Não tem conta? Cadastre-se'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00A86B', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#00A86B', textAlign: 'center', marginBottom: 5 },
  subtitulo: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#F0F0F0', borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 16 },
  botaoPrincipal: { backgroundColor: '#00A86B', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  textoBotao: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  botaoGoogle: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  textoGoogle: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  textoTrocar: { textAlign: 'center', color: '#00A86B', fontWeight: 'bold', marginTop: 10 }
});