import { Stack } from 'expo-router';

export default function SellerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="products" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="add-product" />
      <Stack.Screen name="orders" />
    </Stack>
  );
}
