export type TestSummary = {
  id: string;
  testId?: string;
  title: string;
  description?: string;
  category?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  price?: number;
  isPurchased?: boolean;
  isDemo?: boolean;
};

export type Category = {
  id: string;
  name: string;
  tests: TestSummary[];
};

export type Package = {
  id: string;
  name: string;
  description?: string;
  series?: string;
  isActive: boolean;
  isFeatured?: boolean;
  totalTests: number;
  price: number;
  purchasedTests: number;
  isPurchased: boolean;
  categories: Category[];
  tests: TestSummary[];
};

export type PackageCategorySummary = {
  id: string;
  name: string;
  description?: string;
  price: number;
  isFeatured?: boolean;
  totalTests: number;
  isPurchased: boolean;
  categories: Category[];
};
