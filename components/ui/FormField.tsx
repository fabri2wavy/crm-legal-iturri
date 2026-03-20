import React from "react";
import styles from "./FormField.module.css";

/* ── Types ──────────────────────────────────────────────────── */
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  variant?: "dark" | "light";
}

/* ── Component ─────────────────────────────────────────────── */
export function FormField({
  label,
  id,
  error,
  variant = "dark",
  className,
  ...inputProps
}: FormFieldProps) {
  const inputClasses = [
    styles.input,
    styles[variant],
    error ? styles.inputError : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.group}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input id={id} className={inputClasses} {...inputProps} />
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
