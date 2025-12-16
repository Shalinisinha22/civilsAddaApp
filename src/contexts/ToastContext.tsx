import React, { createContext, useContext, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '@theme/colors';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  addToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { backgroundColor: colors.success, color: colors.white };
      case 'error':
        return { backgroundColor: colors.danger, color: colors.white };
      case 'warning':
        return { backgroundColor: colors.warning, color: colors.white };
      case 'info':
        return { backgroundColor: colors.primary, color: colors.white };
      default:
        return { backgroundColor: colors.gray900, color: colors.white };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => {
          const style = getToastStyle(toast.type);
          return (
            <TouchableOpacity
              key={toast.id}
              style={[styles.toast, { backgroundColor: style.backgroundColor }]}
              onPress={() => removeToast(toast.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.text, { color: style.color }]}>{toast.message}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 16,
    left: 16,
    zIndex: 9999,
    alignItems: 'flex-end',
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 200,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

