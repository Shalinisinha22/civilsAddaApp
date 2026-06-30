declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    description?: string;
    image?: string;
    currency: string;
    key: string;
    amount: number;
    name: string;
    order_id: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    modal?: {
      ondismiss?: () => void;
      escape?: boolean;
      backdropclose?: boolean;
    };
    retry?: {
      enabled?: boolean;
      max_count?: number;
    };
    timeout?: number;
    notes?: Record<string, string>;
  }

  interface RazorpayPaymentResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface RazorpayError {
    code: string;
    description: string;
  }

  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<RazorpayPaymentResponse>;
  };

  export default RazorpayCheckout;
}
