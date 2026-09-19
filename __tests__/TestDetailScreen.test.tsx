/**
 * @format
 */

import 'react-native';
import React from 'react';
import { it, expect, jest } from '@jest/globals';
import renderer, { act } from 'react-test-renderer';
import TestDetailScreen from '../src/screens/tests/TestDetailScreen';
import { api } from '@api/api';

const mockNavigate = jest.fn();
const mockAddToCart = jest.fn();
const mockAddToast = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { testId: 'test-1' } }),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@api/api', () => ({
  api: {
    tests: { getById: jest.fn() },
    attempts: { create: jest.fn() },
  },
}));

jest.mock('@contexts/CartContext', () => ({
  useCart: () => ({ addToCart: mockAddToCart }),
}));

jest.mock('@contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, isAuthenticated: true }),
}));

jest.mock('@contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

jest.mock('@config/env', () => ({
  resolveImageUrl: (url: string) => url,
}));

jest.mock('@components/HTMLDescription', () => ({
  __esModule: true,
  default: ({ html }: { html?: string }) => html || null,
}));

jest.mock('@components/Icons', () => ({
  __esModule: true,
  CategoryIcon: () => null,
  Icons: { Star: () => null },
}));

const makeTestResponse = () => ({
  success: true,
  data: {
    test: {
      id: 'test-1',
      title: 'BPSC Practice Test',
      description: '',
      category: 'bpsc-72nd-pre-test-series',
      durationMinutes: 60,
      totalQuestions: 3,
      positiveMarks: 1,
      negativeMarks: 0,
      unattemptedMarks: 0,
      price: 0,
      isPurchased: true,
      isDemo: true,
      isSubmitted: false,
      startDate: null as string | null,
      endDate: null as string | null,
      highlights: [],
      instructions: [],
      packages: [],
      subjects: [
        { name: 'General', questionCount: 1 },
        { name: 'Polity', questionCount: 2 },
      ],
    },
    questions: [
      { id: 'q1', subject: 'General', text: 'General question one' },
      { id: 'q2', subject: 'Polity', text: 'Polity question two' },
      { id: 'q3', subject: 'Polity', text: 'Polity question three' },
    ],
  },
});

const flatten = (children: any): string => {
  if (children === null || children === undefined) return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(flatten).join('');
  if (typeof children.props === 'object') return flatten(children.props.children);
  return '';
};

const renderScreen = async () => {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<TestDetailScreen />);
  });
  return tree;
};

const unmountScreen = async (tree: renderer.ReactTestRenderer) => {
  await act(async () => {
    tree.unmount();
  });
};

afterEach(() => {
  jest.useRealTimers();
});

it('does not show test questions on the details screen', async () => {
  jest.useFakeTimers();
  (api.tests.getById as any).mockResolvedValue(makeTestResponse());
  const tree = await renderScreen();
  const texts = flatten(tree.root.children);

  expect(texts).not.toContain('Test Questions');
  expect(texts).not.toContain('General question one');
  expect(texts).not.toContain('Polity question two');
  expect(texts).not.toContain('Polity question three');
  await unmountScreen(tree);
});

it('shows the subject breakdown without revealing questions', async () => {
  jest.useFakeTimers();
  (api.tests.getById as any).mockResolvedValue(makeTestResponse());
  const tree = await renderScreen();
  const texts = flatten(tree.root.children);

  expect(texts).toContain('Subjects in this Test');
  expect(texts).toContain('General');
  expect(texts).toContain('Polity');
  expect(texts).toContain('1 Q');
  expect(texts).toContain('2 Q');
  await unmountScreen(tree);
});

it('shows a live countdown to the exam start time', async () => {
  jest.useFakeTimers();
  const response = makeTestResponse();
  response.data.test.startDate = '2026-12-01T11:30:00.000Z';
  (api.tests.getById as any).mockResolvedValue(response);
  const tree = await renderScreen();

  await act(async () => {
    jest.advanceTimersByTime(1000);
  });

  const texts = flatten(tree.root.children);
  expect(texts).toContain('Test Starts In');
  expect(texts).toContain('Days');
  expect(texts).toContain('Hours');
  expect(texts).toContain('Mins');
  expect(texts).toContain('Secs');
  expect(texts).toContain('1 Dec 2026 at');
  await unmountScreen(tree);
});
