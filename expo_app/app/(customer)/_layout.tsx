import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="chat/index" />
      <Stack.Screen name="chat/[otherUserId]" />
      <Stack.Screen name="product/[id]" />
    </Stack>
  );
}
