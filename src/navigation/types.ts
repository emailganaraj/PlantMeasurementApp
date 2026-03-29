/**
 * src/navigation/types.ts
 *
 * Centralised navigation type definitions.
 * Import these wherever you need typed navigation/route props.
 */
import { NavigatorScreenParams } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

// ── Tab navigator (bottom tabs) ───────────────────────────────────────────────
export type TabParamList = {
  Dashboard: undefined;
  'New Analysis': undefined;
  History: undefined;
};

// ── Root stack navigator ──────────────────────────────────────────────────────
export type RootStackParamList = {
  /** The bottom-tab shell; pass `screen` to land on a specific tab */
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  /** Full-screen development submission modal */
  SubmitForDevelopment: undefined;
  /** Development submission detail screen (nested in development stack) */
  DevelopmentDetail: { submission: any; apiUrl: string };
};

// ── Convenience prop types for DashboardScreen (now in MainTabs) ──────────────
export type DashboardNavigationProp = StackNavigationProp<TabParamList, 'Dashboard'>;
export type DashboardRouteProp      = RouteProp<TabParamList, 'Dashboard'>;
