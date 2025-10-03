import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the tabs layout which now has our Home screen
  return <Redirect href="/(tabs)" />;
}
