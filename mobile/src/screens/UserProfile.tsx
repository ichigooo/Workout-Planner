import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  useColorScheme,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useScrollToTopOnTabPress } from '../hooks/useScrollToTopOnTabPress';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { User, UpdateUserProfileRequest } from '../types';
import { apiService } from '../services/api';
import { getTheme } from '../theme';

interface UserProfileProps {
  userId: string;
  onProfileUpdated?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onProfileUpdated }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [birthday, setBirthday] = useState<Date | null>(null);

  const scrollRef = useScrollToTopOnTabPress();
  const navigation = useNavigation();

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  // Refresh profile whenever the Profile tab is pressed or screen gains focus
  useEffect(() => {
    const handler = () => { loadUserProfile(); };
    const navAny: any = navigation as any;
    const unsubPress = navAny?.addListener ? navAny.addListener('tabPress', handler) : null;
    const unsubFocus = navAny?.addListener ? navAny.addListener('focus', handler) : null;
    return () => {
      if (typeof unsubPress === 'function') unsubPress();
      if (typeof unsubFocus === 'function') unsubFocus();
    };
  }, [navigation, userId]);

  useEffect(() => {
    // handled by useScrollToTopOnTabPress
    return;
  }, [navigation]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await apiService.getUserProfile(userId);
      setUser(userData);
      setName(userData.name || '');
      setEmail(userData.email || '');
      setProfilePhoto(userData.profilePhoto || null);
      setBirthday(userData.birthday ? new Date(userData.birthday) : null);
      setIsAdmin(userData.isAdmin);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to select a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0] as any;
        // Resize/compress using expo-image-manipulator (installed)
        let dataUrl = '';
        try {
          const resized = await manipulateAsync(
            asset.uri,
            [{ resize: { width: 1024 } }],
            { compress: 0.8, format: SaveFormat.JPEG, base64: true }
          );
          setProfilePhoto(resized.uri || asset.uri);
          if (!resized.base64) throw new Error('no_base64');
          dataUrl = `data:image/jpeg;base64,${resized.base64}`;
        } catch (e) {
          if (asset.base64) {
            setProfilePhoto(asset.uri);
            dataUrl = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
          } else {
            Alert.alert('Unsupported', 'Could not process image. Please try another.');
            return;
          }
        }
        try {
          const updated = await apiService.updateUserProfile(userId, { profilePhoto: dataUrl });
          setUser(updated);
          setProfilePhoto(updated.profilePhoto || asset.uri);
          onProfileUpdated?.(updated as User);
        } catch (persistErr) {
          console.warn('Failed to persist profile photo', persistErr);
          Alert.alert('Upload failed', 'Could not save your profile photo. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData: UpdateUserProfileRequest = {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        profilePhoto: profilePhoto || undefined,
        birthday: birthday?.toISOString() || undefined,
      };

      const updatedUser = await apiService.updateUserProfile(userId, updateData);
      setUser(updatedUser);
      onProfileUpdated?.(updatedUser);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', `Failed to update profile: ${error.message || String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select birthday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.bg }]}> 
    {/* admin button removed */}
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      {/* Profile Photo Section */}
      <View style={[styles.photoSection, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity 
          style={styles.photoContainer}
          onPress={handleImagePicker}
        >
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: theme.colors.border }]}>
              <Text style={[styles.placeholderText, { color: theme.colors.subtext }]}>
                Add Photo
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.changePhotoButton, { backgroundColor: theme.colors.accent }]}
          onPress={handleImagePicker}
        >
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Form Section */}
      <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Profile Information
        </Text>

        {/* Name Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Name</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.border,
              color: theme.colors.text 
            }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={theme.colors.subtext}
          />
        </View>

        {/* Email Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Email</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.border,
              color: theme.colors.text 
            }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.subtext}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Birthday Field */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>Birthday</Text>
          <TouchableOpacity
            style={[styles.dateButton, { 
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.border 
            }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
              {formatDate(birthday)}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={birthday || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          { 
            backgroundColor: theme.colors.accent,
            opacity: saving ? 0.7 : 1,
            ...theme.shadows.button
          }
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  adminButton: {
    position: 'absolute',
    top: 44,
    right: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for keyboard
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  photoSection: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  changePhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changePhotoText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  formSection: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
});
