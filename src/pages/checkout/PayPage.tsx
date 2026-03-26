import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Zap,
  Shield,
  Lock,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  User,
  Mail,
  Phone,
  ChevronRight,
  ArrowLeft,
  Calendar,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { payService } from "../../services/api";
import { formatCurrency } from "../../lib/utils";
import { Button, OtpInput } from "../../components/ui";
import toast from "react-hot-toast";
import {
  ConfirmPaymentProps,
  InitiateCardPaymentResponse,
} from "@/types/payment";
import { normalizeError } from "@/utils/api";
import routes from "@/constants/routes";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface ProductData {
  name: string;
  description?: string;
  price: number;
  currency: string;
  type: "one_time";
  interval?: string;
  trialDays?: number;
  features?: string[];
  _id: string;
}
interface BusinessData {
  name: string;
  logo?: string;
  email?: string;
  _id: string;
}
interface PaymentLinkData {
  title: string;
  description?: string;
  product: ProductData;
  business: BusinessData;
  slug: string;
  isActive: boolean;
  expiresAt?: string;
  maxUses?: number;
  useCount: number;
}

// interface InterswitchConfig {
//   merchantCode: string;
//   payableCode: string;
//   transactionReference: string;
//   amount: number;
//   currencyCode: string;
//   customerEmail: string;
//   customerName: string;
//   redirectUrl: string;
//   siteName: string;
//   mode: string;
// }

// ─────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────

const detailsSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
});
type DetailsForm = z.infer<typeof detailsSchema>;

const cardSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Required")
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => /^\d{19}$/.test(v), "Invalid card number"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Use MM/YY format"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
  cardName: z.string().min(2, "Enter name as on card"),
  cardPin: z.string().min(4, "Minimum of 4 digit"),
});
type CardForm = z.infer<typeof cardSchema>;

// ─────────────────────────────────────────────
// CARD NETWORK DETECTOR
// ─────────────────────────────────────────────
type CardNetwork = "visa" | "mastercard" | "verve" | null;

function detectNetwork(num: string): CardNetwork {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(50|5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^(6[3-9]|650|5061)/.test(n)) return "verve";
  return null;
}

const NetworkLogo: React.FC<{ network: CardNetwork; className?: string }> = ({
  network,
  className = "",
}) => {
  if (!network) return null;
  const logos: Record<NonNullable<CardNetwork>, React.ReactNode> = {
    visa: (
      <svg viewBox="0 0 38 24" className={className} aria-label="Visa">
        <rect width="38" height="24" rx="4" fill="#1A1F71" />
        <text
          x="19"
          y="17"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
          fontFamily="Arial"
        >
          VISA
        </text>
      </svg>
    ),
    mastercard: (
      <svg viewBox="0 0 38 24" className={className} aria-label="Mastercard">
        <rect width="38" height="24" rx="4" fill="#fff" />
        <circle cx="14" cy="12" r="8" fill="#EB001B" />
        <circle cx="24" cy="12" r="8" fill="#F79E1B" />
        <path d="M19 6.8a8 8 0 010 10.4A8 8 0 0119 6.8z" fill="#FF5F00" />
      </svg>
    ),
    verve: (
      <svg viewBox="0 0 38 24" className={className} aria-label="Verve">
        <rect width="38" height="24" rx="4" fill="#007B5E" />
        <text
          x="19"
          y="16"
          textAnchor="middle"
          fill="white"
          fontSize="9"
          fontWeight="bold"
          fontFamily="Arial"
        >
          VERVE
        </text>
      </svg>
    ),
  };
  return <>{logos[network]}</>;
};

// ─────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────
function formatCardNumber(raw: string) {
  return raw
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}
function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

// ─────────────────────────────────────────────
// STEP INDICATOR (2 steps)
// ─────────────────────────────────────────────
const StepBubble: React.FC<{
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}> = ({ n, label, active, done }) => (
  <div className="flex items-center gap-2">
    <div
      className={[
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
        done
          ? "bg-blue-600 text-white scale-100"
          : active
            ? "bg-blue-600 text-white ring-4 ring-blue-100"
            : "bg-gray-100 text-gray-400",
      ].join(" ")}
    >
      {done ? <CheckCircle className="h-4 w-4" /> : n}
    </div>
    <span
      className={[
        "text-sm font-medium hidden sm:block transition-colors",
        active || done ? "text-gray-900" : "text-gray-400",
      ].join(" ")}
    >
      {label}
    </span>
  </div>
);
const Connector = () => (
  <div className="flex-1 h-px bg-gray-200 mx-3 hidden sm:block" />
);

// ─────────────────────────────────────────────
// FIELD COMPONENTS (inline, no external deps)
// ─────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  children: (cls: string) => React.ReactNode;
}> = ({ label, error, hint, icon, trailing, children }) => {
  const cls = [
    "w-full rounded-xl border bg-white py-3 text-sm text-gray-900 placeholder-gray-400",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition",
    error ? "border-red-400 focus:ring-red-400" : "border-gray-200",
    icon ? "pl-10" : "pl-3.5",
    trailing ? "pr-12" : "pr-3.5",
  ].join(" ");
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </span>
        )}
        {children(cls)}
        {trailing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {trailing}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
};

// ─────────────────────────────────────────────
// ACCEPTED CARD BADGES (always visible)
// ─────────────────────────────────────────────
const CardBadges = () => (
  <div className="flex items-center gap-2">
    <NetworkLogo network="visa" className="w-10 h-6" />
    <NetworkLogo network="mastercard" className="w-10 h-6" />
    <NetworkLogo network="verve" className="w-10 h-6" />
  </div>
);

// ─────────────────────────────────────────────
// MAIN PAY PAGE
// ─────────────────────────────────────────────

// test card

// const options = {
//   pan: "5060990580000217499",
//   expDate: "5003",
//   cvv: "111",
//   pin: "1111",
// };

const RedirectButton: React.FC<{
  onClick: () => void;
  text?: string;
  arrowPosition?: "left" | "right";
}> = ({ onClick, text = "Go Back", arrowPosition = "left" }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
  >
    {arrowPosition === "left" && <ArrowLeft className="h-3.5 w-3.5" />}
    {text}

    {arrowPosition === "right" && <ArrowRight className="h-3.5 w-3.5" />}
  </button>
);

export const PayPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [linkData, setLinkData] = useState<PaymentLinkData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [customer, setCustomer] = useState<DetailsForm | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [openOtp, setOpenOtp] = useState(false);

  const [otp, setOtp] = useState("");

  const [openConfirmPayment, setOpenConfirmPayment] = useState(false);

  const [paymentData, setPaymentData] =
    useState<InitiateCardPaymentResponse | null>(null);

  const cardNumRef = useRef<HTMLInputElement | null>(null);

  // — load link
  useEffect(() => {
    if (!slug) return;
    payService
      .getLink(slug)
      .then((r) => setLinkData(r.data.data))
      .catch((e) =>
        setPageError(e.response?.data?.message || "Payment link not found"),
      )
      .finally(() => setPageLoading(false));
  }, [slug]);

  console.log(linkData);
  console.log(pageError);

  // — forms
  const details = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });
  const card = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cvv: "",
      expiry: "",
      cardNumber: "",
      cardPin: "",
    },
  });

  // {
  //     cvv: "111",
  //     expiry: "03/50",
  //     cardNumber: "5060990580000217499",
  //     cardPin: "1111",
  //   },

  // ── LOADING / ERROR states ──────────────────
  if (pageLoading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );

  if (pageError || !linkData)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Link Unavailable
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {pageError || "This payment link is no longer active."}
          </p>
        </div>
      </div>
    );

  const { product, business } = linkData;

  const values = details.getValues();

  const fullname = `${values.firstName} ${values.lastName}`;

  // — step 1 submit: hit backend to initiate, get Interswitch config
  const onDetailsSubmit = async (data: DetailsForm) => {
    if (!slug) return;

    setCustomer(data);
    setStep(2);
  };

  // — step 2 submit: send card + Interswitch config to process
  const onCardSubmit = async (data: CardForm) => {
    setPaying(true);
    setPayError("");
    try {
      const res = await payService.initiateCardPayment({
        paymentType: "one_time",
        productId: product._id,
        businessId: business._id,
        cardDetails: {
          cvv: data.cvv.toString(),
          exp_date: data.expiry,
          pan: data.cardNumber,
          pin: data.cardPin,
        },
        amount: product.price,
        customerDetails: customer!,
      });

      toast.success(res.data.data.message);

      const withOtp = res.data.data.withOtp;

      setPaymentData(res.data.data);

      if (withOtp) setOpenOtp(withOtp);
      else setOpenConfirmPayment(true);

      setPaying(false);
    } catch {
      setPayError(
        "Payment failed. Please check your card details and try again.",
      );
      setPaying(false);
    }
  };

  const handleVerifyOtp = async () => {
    const handleSuccess = () => {
      toast.success("Payment verification successful");

      setOpenConfirmPayment(true);
    };
    try {
      if (!paymentData?.paymentId) {
        alert("Application Error: Missing payment id");
        return;
      }

      if (otp.length < 4) {
        setPayError("Invalid otp");
        return;
      }

      setVerifyingOtp(true);

      await payService.verifyOtp({
        paymentId: paymentData.paymentId,
        otp,
      });

      handleSuccess();
    } catch (err) {
      const error = normalizeError(err);

      console.log(error);

      if (error.status === 409) {
        const bool =
          (error.errors?.[0]?.message || "")
            .toLowerCase()
            .indexOf("payment_already_processed") > -1;

        if (bool) {
          handleSuccess();
          return;
        }
      }

      setPayError("Failed to verify");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const resetBtn = (
    <RedirectButton
      text="Back to your details"
      onClick={() => {
        setStep(1);
        setPayError("");
        setPaying(false);
      }}
    />
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* ── Top bar ── */}
        <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-semibold text-sm">PayCycle</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-200">
              <Lock className="h-3.5 w-3.5" />
              <span>Secured by Interswitch</span>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-start">
            {/* ── LEFT: product info ── */}
            <div className="lg:col-span-2 text-white">
              {/* Business */}
              <div className="flex items-center gap-3 mb-6">
                {business.logo ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-sm">
                    {business.name[0]}
                  </div>
                )}
                <div>
                  <p className="text-xs text-blue-300 uppercase tracking-widest font-medium">
                    Paying to
                  </p>
                  <p className="font-semibold">{business.name}</p>
                </div>
              </div>

              {/* Product card */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">


                <h2 className="text-xl font-bold text-white">{product.name}</h2>
                {(linkData.description || product.description) && (
                  <p className="mt-1 text-sm text-blue-200 leading-relaxed">
                    {linkData.description || product.description}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-white/10 flex items-end gap-2">
                  <span className="text-3xl font-bold">
                    {formatCurrency(product.price, product.currency)}
                  </span>

                </div>
                {product.trialDays ? (
                  <p className="text-xs text-green-300 mt-1">
                    ✓ {product.trialDays}-day free trial
                  </p>
                ) : null}

                {product.features && product.features.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {product.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-blue-100"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-blue-400">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> 256-bit SSL
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> PCI Compliant
                </div>
              </div>
            </div>

            {/* ── RIGHT: form panel ── */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Steps header */}
                <div className="px-6 pt-6 pb-5 border-b border-gray-100">
                  <div className="flex items-center">
                    <StepBubble
                      n={1}
                      label="Your details"
                      active={step === 1}
                      done={step > 1}
                    />
                    <Connector />
                    <StepBubble
                      n={2}
                      label="Payment details"
                      active={step === 2}
                      done={false}
                    />
                  </div>
                </div>

                <div className="p-6">
                  {/* ── STEP 1: customer info ── */}
                  {step === 1 && (
                    <form
                      onSubmit={details.handleSubmit(onDetailsSubmit)}
                      className="space-y-4"
                      noValidate
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Your details
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          We'll send a receipt to your email
                        </p>
                      </div>

                      {payError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                          {payError}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          label="First name"
                          error={details.formState.errors.firstName?.message}
                          icon={<User className="h-4 w-4" />}
                        >
                          {(cls) => (
                            <input
                              {...details.register("firstName")}
                              className={cls}
                              placeholder="Ada"
                            />
                          )}
                        </Field>
                        <Field
                          label="Last name"
                          error={details.formState.errors.lastName?.message}
                        >
                          {(cls) => (
                            <input
                              {...details.register("lastName")}
                              className={cls}
                              placeholder="Okonkwo"
                            />
                          )}
                        </Field>
                      </div>

                      <Field
                        label="Email address"
                        error={details.formState.errors.email?.message}
                        icon={<Mail className="h-4 w-4" />}
                      >
                        {(cls) => (
                          <input
                            {...details.register("email")}
                            type="email"
                            className={cls}
                            placeholder="you@example.com"
                          />
                        )}
                      </Field>

                      <Field
                        label="Phone (optional)"
                        icon={<Phone className="h-4 w-4" />}
                      >
                        {(cls) => (
                          <input
                            {...details.register("phone")}
                            type="tel"
                            className={cls}
                            placeholder="+234 800 000 0000"
                          />
                        )}
                      </Field>

                      {/* Order summary */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{product.name}</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(product.price, product.currency)}

                          </span>
                        </div>

                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        loading={details.formState.isSubmitting}
                        loadingText="Setting up payment..."
                        rightIcon={<ChevronRight className="h-4 w-4" />}
                        disabled={!details.formState.isValid}
                      >
                        Continue to payment
                      </Button>
                    </form>
                  )}

                  {/* ── STEP 2: card details ── */}
                  {step === 2 ? (
                    paying ? (
                      <div className="py-10 text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                          Processing your payment
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          Please wait and do not close this page...
                        </p>
                      </div>
                    ) : openConfirmPayment ? (
                      <ConfirmPayment
                        transactionId={paymentData?.transactionId!}
                        currency={product.currency}
                        amount={Number(paymentData?.amount)!}
                        trxRef={paymentData?.transactionRef!}
                        resetBtn={resetBtn}
                        businessId={business._id}
                      />
                    ) : openOtp ? (
                      <div className="space-y-8">
                        {payError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                            {payError}
                          </div>
                        )}
                        <OtpInput value={otp} onChange={setOtp} />
                        <Button
                          type="button"
                          size="xl"
                          fullWidth
                          onClick={handleVerifyOtp}
                          loading={verifyingOtp}
                          loadingText="Verifying OTP"
                          className="shadow-lg shadow-blue-600/25"
                        >
                          Verify OTP
                        </Button>
                      </div>
                    ) : (
                      <form
                        onSubmit={card.handleSubmit(onCardSubmit)}
                        className="space-y-4"
                        noValidate
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Payment details
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              Enter your card information
                            </p>
                          </div>
                          <CardBadges />
                        </div>

                        {payError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                            {payError}
                          </div>
                        )}

                        {/* Card number */}
                        <Field
                          label="Card number"
                          error={card.formState.errors.cardNumber?.message}
                          icon={<CreditCard className="h-4 w-4" />}
                          trailing={
                            cardNetwork && (
                              <NetworkLogo
                                network={cardNetwork}
                                className="w-9 h-6"
                              />
                            )
                          }
                        >
                          {(cls) => {
                            const {
                              ref: rhfRef,
                              onChange,
                              ...rest
                            } = card.register("cardNumber");
                            return (
                              <input
                                {...rest}
                                ref={(el) => {
                                  rhfRef(el);
                                  cardNumRef.current = el;
                                }}
                                onChange={(e) => {
                                  const formatted = formatCardNumber(
                                    e.target.value,
                                  );
                                  e.target.value = formatted;
                                  setCardNetwork(detectNetwork(formatted));
                                  onChange(e);
                                }}
                                className={cls}
                                placeholder="0000 0000 0000 0000"
                                inputMode="numeric"
                                maxLength={19}
                                autoComplete="cc-number"
                              />
                            );
                          }}
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Name on card */}
                          <Field
                            label="Name on card"
                            error={card.formState.errors.cardName?.message}
                            icon={<User className="h-4 w-4" />}
                          >
                            {(cls) => (
                              <input
                                {...card.register("cardName", {
                                  value: fullname,
                                })}
                                className={cls}
                                placeholder="ADA OKONKWO"
                                autoComplete="cc-name"
                                style={{ textTransform: "uppercase" }}
                              />
                            )}
                          </Field>

                          <Field
                            label="Expiry date"
                            error={card.formState.errors.expiry?.message}
                            icon={<Calendar className="h-4 w-4" />}
                          >
                            {(cls) => {
                              const {
                                ref: rhfRef,
                                onChange,
                                ...rest
                              } = card.register("expiry");
                              return (
                                <input
                                  {...rest}
                                  ref={rhfRef}
                                  onChange={(e) => {
                                    e.target.value = formatExpiry(
                                      e.target.value,
                                    );
                                    onChange(e);
                                  }}
                                  className={cls}
                                  placeholder="MM/YY"
                                  inputMode="numeric"
                                  maxLength={5}
                                  autoComplete="cc-exp"
                                />
                              );
                            }}
                          </Field>
                        </div>

                        {/* Expiry + CVV side by side */}
                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="CVV"
                            error={card.formState.errors.cvv?.message}
                            icon={<KeyRound className="h-4 w-4" />}
                            hint="3 or 4 digits on back"
                          >
                            {(cls) => (
                              <input
                                {...card.register("cvv")}
                                className={cls}
                                placeholder="•••"
                                inputMode="numeric"
                                maxLength={4}
                                autoComplete="cc-csc"
                                type="password"
                              />
                            )}
                          </Field>

                          <Field
                            label="Card Pin"
                            error={card.formState.errors.cardPin?.message}
                            icon={<KeyRound className="h-4 w-4" />}
                          >
                            {(cls) => (
                              <input
                                {...card.register("cardPin")}
                                className={cls}
                                placeholder="•••"
                                inputMode="numeric"
                                maxLength={4}
                                type="password"
                              />
                            )}
                          </Field>
                        </div>

                        {/* Amount summary */}
                        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Total due</p>
                            <p className="text-xl font-bold text-gray-900">
                              {formatCurrency(product.price, product.currency)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Shield className="h-3.5 w-3.5" />
                            Encrypted
                          </div>
                        </div>

                        {/* Pay button */}
                        <Button
                          type="submit"
                          size="xl"
                          fullWidth
                          loading={paying}
                          loadingText="Processing payment..."
                          leftIcon={<Lock className="h-4 w-4" />}
                          className="shadow-lg shadow-blue-600/25"
                          disabled={!card.formState.isValid}
                        >
                          Pay {formatCurrency(product.price, product.currency)}{" "}
                          securely
                        </Button>

                        {resetBtn}
                        {/* Card brand row */}
                        <div className="flex items-center justify-center gap-3 pt-1">
                          <CardBadges />
                          <span className="text-xs text-gray-300">|</span>
                          <span className="text-xs text-gray-400">
                            Powered by Interswitch
                          </span>
                        </div>
                      </form>
                    )
                  ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <Shield className="h-3.5 w-3.5" />
                  Your card details are never stored on our servers
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ConfirmPayment: React.FC<
  Omit<ConfirmPaymentProps, "amount"> & {
    currency: string;
    amount: number;
    resetBtn?: React.ReactNode;
    businessId: string;
    transactionId: string;
  }
> = ({ amount, trxRef, currency, resetBtn, businessId, transactionId }) => {
  const [result, setResult] = useState<"loading" | "success" | "failed">(
    "loading",
  );

  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate(routes.transactionDetails(transactionId));
  };

  useEffect(() => {
    payService
      .confirmPayment({
        amount,
        trxRef,
        businessId,
      })
      .then((res) => {
        const isSuccess = res.data.data.responseCode === "SUCCESS";

        if (isSuccess) {
          toast.success("You will be redirected to dashboard soon");
          setTimeout(() => {
            handleRedirect();
          }, 6000);
        }

        setResult(isSuccess ? "success" : "failed");
      })
      .catch(() => setResult("failed"));
  }, [amount, trxRef, businessId]);

  return (
    <div className="text-center">
      {result === "loading" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Verifying payment…
          </h2>
          <p className="mt-2 text-sm text-gray-500">Just a moment</p>
        </>
      )}
      {result === "success" && (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-9 w-9 text-green-500" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Payment successful!
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {amount > 0 ? `${formatCurrency(amount, currency)} received. ` : ""}
            A confirmation will be sent to your email.
          </p>
          {trxRef && (
            <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500">
              Transaction Ref:{" "}
              <span className="font-mono font-semibold text-gray-700">
                {trxRef}
              </span>
            </div>
          )}
          <RedirectButton
            arrowPosition="right"
            text="View Transaction Details"
            onClick={handleRedirect}
          />
        </div>
      )}
      {result === "failed" && (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="h-9 w-9 text-red-500" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Payment failed
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Your payment could not be processed. No charges were made.
          </p>
          {resetBtn}
        </div>
      )}
    </div>
  );
};
