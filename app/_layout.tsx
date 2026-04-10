import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#00A86B" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}