import { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { BackendComingSoon } from './ComingSoon';
import { Notice } from './form';
import { SecondStep } from './TwoStep';
import { Screen, Title } from './ui';
import { space, useTheme } from '@/theme';

/**
 * Shows its children only to the signed-in owner/admin, after two-step sign-in; with `ownerOnly`, only to the owner
 * accounts. The database enforces all of this; the app only shows what would work.
 */
export function RequireOwner({ title, children, ownerOnly }: { title: string; children: ReactNode; ownerOnly?: boolean }) {
  const t = useTheme();
  const { session, profile, isOwner, loading } = useAuth();
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
  return (
    <SecondStep title={title}>
      {ownerOnly && !isOwner ? (
        <Screen>
          <Title>{title}</Title>
          <Notice kind="info">Only the owner accounts can change this. Ask the owner if something here needs to change.</Notice>
        </Screen>
      ) : (
        children
      )}
    </SecondStep>
  );
}
