import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Each member's own look for the app, saved on their phone: light or dark (or follow the
 * phone), and AFM green (the default) or church blue and white.
 */
export type Mode = 'auto' | 'light' | 'dark';
export const COLOURS = ['green', 'blue', 'forest', 'brown', 'purple', 'wine', 'greenSeafoam', 'blueAqua'] as const;
export type Colour = (typeof COLOURS)[number];
export type Appearance = { mode: Mode; colour: Colour };

const KEY = 'afm-appearance';
let current: Appearance = { mode: 'auto', colour: 'green' };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

AsyncStorage.getItem(KEY)
  .then((saved) => {
    if (!saved) return;
    const v = JSON.parse(saved) as Partial<Appearance>;
    current = {
      mode: v.mode === 'light' || v.mode === 'dark' ? v.mode : 'auto',
      colour: COLOURS.includes(v.colour as Colour) ? (v.colour as Colour) : 'green',
    };
    emit();
  })
  .catch(() => {});

export function setAppearance(change: Partial<Appearance>) {
  current = { ...current, ...change };
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => {});
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useAppearance(): Appearance {
  return useSyncExternalStore(subscribe, () => current, () => current);
}
