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
  Checkout: undefined;
  PaymentSuccess: { order_id: string };
  PaymentFailure: undefined;
};

// Drawer routes (must match DrawerParamList in AppDrawer)
export type DrawerParamList = {
  HomeTabs: undefined;
  MyTests: undefined;
  Performance: undefined;
  Settings: undefined;
};

// Combined navigation types
export type AppNavigationParamList = RootStackParamList & TabParamList & StackParamList & DrawerParamList;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppNavigationParamList {}
  }
}

