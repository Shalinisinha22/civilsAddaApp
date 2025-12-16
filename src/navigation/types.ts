// Navigation type definitions for the entire app

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
};

export type TabParamList = {
  Home: undefined;
  Tests: undefined;
  Cart: undefined;
  Attempts: undefined;
  Dashboard: undefined;
};

export type StackParamList = {
  TestDetail: { testId: string };
  TestAttempt: { testId: string; attemptId: string };
  Settings: undefined;
};

// Combined navigation types
export type AppNavigationParamList = RootStackParamList & TabParamList & StackParamList;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppNavigationParamList {}
  }
}

