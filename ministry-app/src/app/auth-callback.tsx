import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { completeGoogleSignIn } from '@/lib/auth';

/** Where Google sign-in returns to (afmhub://auth-callback). Finishes the sign-in, then goes home. */
export default function AuthCallback() {
  const { code, error_description } = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [error, setError] = useState(typeof error_description === 'string' ? error_description : '');

  useEffect(() => {
    if (error || typeof code !== 'string') {
      if (!error) router.replace('/');
      return;
    }
    completeGoogleSignIn(code)
      .then(() => router.replace('/'))
      .catch((e) => setError(e?.message ?? 'Google sign-in did not complete. Please try again.'));
  }, [code, error]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {error ? (
        <Text style={{ textAlign: 'center' }} onPress={() => router.replace('/')}>
          {error}
          {'\n\n'}Tap to go back.
        </Text>
      ) : (
        <ActivityIndicator />
      )}
    </View>
  );
}
