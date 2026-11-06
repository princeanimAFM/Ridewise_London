import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'afm:welcome-done';

/** Whether this phone has already seen the welcome (sign-in) screen. */
export async function welcomeDone() {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return true;
  }
}

export function markWelcomeDone() {
  AsyncStorage.setItem(KEY, '1').catch(() => {});
}
