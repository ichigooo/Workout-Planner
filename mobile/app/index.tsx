import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WorkoutLibrary } from '../src/screens/WorkoutLibrary';
import { WorkoutPlans } from '../src/screens/WorkoutPlans';
import { CalendarView } from '../src/screens/CalendarView';
import { UserProfile } from '../src/screens/UserProfile';
import { SplashScreen } from '../src/components/SplashScreen';
import { useColorScheme } from 'react-native';
import { getTheme } from '../src/theme';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

type TabType = 'library' | 'plans' | 'calendar' | 'profile';

export default function App() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });

  if (!fontsLoaded) {
    return null;
  }

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'library':
        return <WorkoutLibrary />;
      case 'plans':
        return <WorkoutPlans />;
      case 'calendar':
        return <CalendarView />;
      case 'profile':
        return <UserProfile userId="8af6f318-d1bd-4e6b-be98-f488374778b6" />;
      default:
        return <WorkoutLibrary />;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.bg }] }>

      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'library' && styles.activeTab]}
          onPress={() => setActiveTab('library')}
        >
          <Text style={[styles.tabText, { color: theme.colors.subtext, fontFamily: 'Inter_400Regular' }, activeTab === 'library' && { color: theme.colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
            Library
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plans' && styles.activeTab]}
          onPress={() => setActiveTab('plans')}
        >
          <Text style={[styles.tabText, { color: theme.colors.subtext, fontFamily: 'Inter_400Regular' }, activeTab === 'plans' && { color: theme.colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
            Plans
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, { color: theme.colors.subtext, fontFamily: 'Inter_400Regular' }, activeTab === 'calendar' && { color: theme.colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
            Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, { color: theme.colors.subtext, fontFamily: 'Inter_400Regular' }, activeTab === 'profile' && { color: theme.colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(92, 111, 79, 0.1)', // Subtle sage green background
    borderRadius: 8,
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  content: {
    flex: 1,
  },
});
