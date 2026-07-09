import React, { createContext, useContext } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '@theme/colors';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  animated: Animated.Value;
};

type ToastContextType = {
  addToast: (message: string, type?: ToastType, title?: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = 'success', title?: string) => {
    const id = Date.now().toString();
    const animated = new Animated.Value(0);
    const toast: Toast = { id, title, message, type, animated };

    setToasts((prev) => [toast, ...prev]);

    Animated.spring(animated, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();

    const dismiss = () => {
      Animated.timing(animated, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      });
    };

    setTimeout(dismiss, type === 'error' ? 3800 : 3200);
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
          const translateY = toast.animated.interpolate({
            inputRange: [0, 1],
            outputRange: [-14, 0],
          });
          return (
            <Animated.View
              key={toast.id}
              style={[
                styles.toastWrap,
                {
                  opacity: toast.animated,
                  transform: [{ translateY }],
                },
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                style={[styles.toast, { backgroundColor: style.backgroundColor }]}
                onPress={() => removeToast(toast.id)}
                activeOpacity={0.9}
              >
                <View style={styles.toastDot} />
                <View style={styles.toastTextWrap}>
                  {toast.title ? <Text style={[styles.title, { color: style.color }]}>{toast.title}</Text> : null}
                  <Text style={[styles.text, { color: style.color }]}>{toast.message}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    right: 12,
    left: 12,
    zIndex: 9999,
    alignItems: 'stretch',
  },
  toastWrap: {
    width: '100%',
    alignSelf: 'stretch',
  },
  toast: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 10,
    minWidth: 0,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 7,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
  },
  toastTextWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  toastDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

