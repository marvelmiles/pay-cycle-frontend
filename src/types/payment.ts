export type DebitCard = {
  cvv: string;
  exp_date: string;
  pan: string;
  pin: string;
};

export type InitiateCardPaymentResponse = {
  transactionRef: string;
  paymentId: string;
  message: string;
  amount: string;
  responseCode: string;
  supportMessage: string;
  withOtp: boolean;
};

export type ConfirmPaymentProps = { trxRef: string; amount: string | number };
