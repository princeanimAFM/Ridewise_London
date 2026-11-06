import { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { BackendComingSoon } from './ComingSoon';
import { Notice } from './form';
import { Screen, Title } from './ui';
import { space, useTheme } from '@/theme';

/** Shows its children only to the signed-in owner/admin. */
export function RequireOwner({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  const { session, profile, loading } = useAuth();
  if (!supabase) return <BackendComingSoon feature={title} />;
  if (loading) return <Screen><ActivityIndicator color={t.accent} style={{ marginTop: space.xl }} /></Screen>;
  if (!session || !profile?.is_admin) {
    return (
      <Screen>
        <Title>{title}</Title>
        <Notice kind="info">This area is for the ministry's owner account. Sign in with that account to make changes.</Notice>
      </Screen>
    );
  }
  return <>{children}</>;
}
