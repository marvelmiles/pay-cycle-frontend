import React, { forwardRef, useRef } from "react";
import { cn, STATUS_COLORS } from "../lib/utils";
import { Loader2, X } from "lucide-react";

// ==================== BUTTON ====================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button */
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "destructive"
    | "outline"
    | "success"
    | "link";
  /** Size preset */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Shows a spinner and disables the button */
  loading?: boolean;
  /** Text shown next to spinner while loading (defaults to children) */
  loadingText?: string;
  /** Icon before the label */
  leftIcon?: React.ReactNode;
  /** Icon after the label */
  rightIcon?: React.ReactNode;
  /** Stretch to fill parent width */
  fullWidth?: boolean;
  /** Rounded pill shape */
  pill?: boolean;
}

const SPINNER_SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-4 w-4",
  xl: "h-5 w-5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      pill = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const base = [
      "inline-flex items-center justify-center gap-2 font-medium",
      "transition-all duration-150 ease-in-out",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "select-none",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "active:scale-[0.98]",
    ].join(" ");

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500",
      secondary:
        "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-400",
      ghost:
        "text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400",
      destructive:
        "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500",
      outline:
        "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400",
      success:
        "bg-green-600 text-white shadow-sm hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500",
      link: "text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-400 px-0 py-0",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      xs: "px-2.5 py-1 text-xs",
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
      xl: "px-7 py-3.5 text-base",
    };

    const radius = pill ? "rounded-full" : "rounded-lg";
    const width = fullWidth ? "w-full" : "";
    // link variant has no padding override — skip size padding
    const sizeClass = variant === "link" ? "" : sizes[size];
    const spinnerSize = SPINNER_SIZES[size];

    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizeClass,
          radius,
          width,
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2
              className={cn(spinnerSize, "animate-spin flex-shrink-0")}
              aria-hidden="true"
            />
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children && <span>{children}</span>}
            {rightIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

// ==================== INPUT ====================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftElement, rightElement, className, id, ...props },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:bg-gray-50 disabled:cursor-not-allowed",
              error && "border-red-400 focus:ring-red-400",
              leftElement && "pl-10",
              rightElement && "pr-10",
              className,
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightElement}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

// ==================== SELECT ====================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            error && "border-red-400",
            className,
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";

// ==================== TEXTAREA ====================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            error && "border-red-400",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

// ==================== BADGE ====================
interface BadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
      STATUS_COLORS[status] || "bg-gray-100 text-gray-700",
      className,
    )}
  >
    {status.replace(/_/g, " ")}
  </span>
);

// ==================== CARD ====================
interface CardProps {
  className?: string;
  children: React.ReactNode;
}
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  ),
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4 border-b border-gray-100", className)}
    >
      {children}
    </div>
  ),
);
CardHeader.displayName = "CardHeader";

export const CardBody = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children }, ref) => (
    <div ref={ref} className={cn("px-6 py-4", className)}>
      {children}
    </div>
  ),
);
CardBody.displayName = "CardBody";

// ==================== STAT CARD ====================
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  iconBg = "bg-blue-50",
}) => (
  <Card>
    <CardBody className="flex items-center gap-4">
      <div className={cn("p-3 rounded-xl", iconBg)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {change !== undefined && (
          <p
            className={cn(
              "text-xs mt-1 font-medium",
              change >= 0 ? "text-green-600" : "text-red-500",
            )}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}% vs last month
          </p>
        )}
      </div>
    </CardBody>
  </Card>
);

// ==================== MODAL ====================
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ open, onClose, title, children, className }, ref) => {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          ref={ref}
          className={cn(
            "relative bg-white rounded-2xl shadow-xl w-full mx-4 max-h-[90vh] overflow-y-auto",
            className || "max-w-lg",
          )}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    );
  },
);
Modal.displayName = "Modal";
// ==================== EMPTY STATE ====================
interface EmptyProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyProps>(
  ({ title, description, action, icon }, ref) => (
    <div
      ref={ref}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  ),
);

EmptyState.displayName = "EmptyState";

// ==================== LOADING ====================
export const LoadingSpinner = forwardRef<
  HTMLDivElement,
  { className?: string }
>(({ className }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-center p-8", className)}
  >
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
  </div>
));

LoadingSpinner.displayName = "LoadingSpinner";

// ==================== TABLE ====================
interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
}

export function Table<T extends { _id: string }>({
  columns,
  data,
  onRowClick,
  loading,
}: TableProps<T>) {
  if (loading) return <LoadingSpinner />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row._id}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-gray-50 hover:bg-gray-50 transition-colors",
                onRowClick && "cursor-pointer",
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn("px-4 py-3 text-gray-700", col.className)}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==================== PAGINATION ====================
interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
}

export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  ({ page, pages, total, onPage }, ref) => (
    <div
      ref={ref}
      className="flex items-center justify-between px-4 py-3 border-t border-gray-100"
    >
      <p className="text-sm text-gray-500">{total} total records</p>
      <div className="flex gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 text-sm rounded-lg border disabled:opacity-40 hover:bg-gray-50"
        >
          Prev
        </button>
        <span className="px-3 py-1 text-sm">
          {page} / {pages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1 text-sm rounded-lg border disabled:opacity-40 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  ),
);
Pagination.displayName = "Pagination";

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value: textValue,
  onChange,
  disabled,
  hasError,
}) => {
  const value = textValue.split("");

  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1); // keep last digit only
    const next = [...value];
    next[i] = digit;
    onChange(next.join(""));
    if (digit && i < OTP_LENGTH - 1) focus(i + 1);
  };

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (value[i]) {
        const next = [...value];
        next[i] = "";
        onChange(next.join(""));
      } else if (i > 0) {
        focus(i - 1);
      }
    }
    if (e.key === "ArrowLeft" && i > 0) focus(i - 1);
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) focus(i + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const next = [...value];
    pasted.split("").forEach((ch, idx) => {
      next[idx] = ch;
    });
    onChange(next);
    // focus last filled or next empty
    const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    focus(lastIdx);
  };

  return (
    <div
      className="flex items-center gap-2.5 justify-center"
      onPaste={handlePaste}
    >
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <React.Fragment key={i}>
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ""}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            autoComplete="one-time-code"
            className={[
              "w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-150",
              "focus:outline-none focus:scale-105",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              hasError
                ? "border-red-400 bg-red-50 text-red-700 focus:border-red-500"
                : value[i]
                  ? "border-blue-500 bg-blue-50 text-blue-700 focus:border-blue-600"
                  : "border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:bg-blue-50/40",
            ].join(" ")}
          />
          {/* visual separator between groups of 3 */}
          {i === 2 && (
            <span className="text-gray-300 text-xl font-light select-none">
              —
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
