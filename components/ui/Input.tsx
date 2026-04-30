"use client";

import {
  forwardRef,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  useState,
} from "react";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const t = {
  rose: "#FF2D55",
  roseDim: "rgba(255,45,85,0.55)",
  roseBorder: "rgba(255,45,85,0.22)",
  roseGlow: "rgba(255,45,85,0.10)",
  surface: "#0E0C0B",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  borderFocus: "rgba(255,255,255,0.18)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  errorBorder: "rgba(255,45,85,0.45)",
  errorText: "#FF2D55",
};

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      disabled,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const hasError = !!error;

    const borderColor = hasError
      ? t.errorBorder
      : focused
        ? t.borderFocus
        : t.border;

    const boxShadow = focused
      ? hasError
        ? `0 0 0 3px ${t.roseGlow}`
        : `0 0 0 3px rgba(255,255,255,0.04)`
      : "none";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          width: fullWidth ? "100%" : undefined,
        }}
      >
        {/* Label */}
        {label && (
          <label
            style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              color: hasError ? t.roseDim : t.textMid,
              letterSpacing: "0.03em",
              userSelect: "none",
            }}
          >
            {label}
          </label>
        )}

        {/* Wrapper con iconos */}
        <div style={{ position: "relative", width: "100%" }}>
          {leftIcon && (
            <span
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: t.textDim,
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            disabled={disabled}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={{
              width: "100%",
              background: t.surface,
              border: `1px solid ${borderColor}`,
              borderRadius: "10px",
              padding: `10px ${rightIcon ? "40px" : "14px"} 10px ${leftIcon ? "40px" : "14px"}`,
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: "13px",
              color: disabled ? t.textDim : t.textPrimary,
              outline: "none",
              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
              boxShadow,
              cursor: disabled ? "not-allowed" : "text",
              opacity: disabled ? 0.5 : 1,
              boxSizing: "border-box",
              ...style,
            }}
            {...props}
          />

          {rightIcon && (
            <span
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: t.textDim,
                display: "flex",
                alignItems: "center",
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error o hint */}
        {(error || hint) && (
          <span
            style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: "11px",
              color: error ? t.errorText : t.textDim,
              letterSpacing: "0.02em",
            }}
          >
            {error ?? hint}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      fullWidth = true,
      disabled,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const hasError = !!error;

    const borderColor = hasError
      ? t.errorBorder
      : focused
        ? t.borderFocus
        : t.border;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          width: fullWidth ? "100%" : undefined,
        }}
      >
        {label && (
          <label
            style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              color: hasError ? t.roseDim : t.textMid,
              letterSpacing: "0.03em",
            }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            width: "100%",
            background: t.surface,
            border: `1px solid ${borderColor}`,
            borderRadius: "10px",
            padding: "10px 14px",
            fontFamily: "var(--font-jakarta), sans-serif",
            fontSize: "13px",
            color: disabled ? t.textDim : t.textPrimary,
            outline: "none",
            transition: "border-color 0.18s ease",
            resize: "vertical",
            minHeight: "96px",
            opacity: disabled ? 0.5 : 1,
            boxSizing: "border-box",
            ...style,
          }}
          {...props}
        />
        {(error || hint) && (
          <span
            style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: "11px",
              color: error ? t.errorText : t.textDim,
            }}
          >
            {error ?? hint}
          </span>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
