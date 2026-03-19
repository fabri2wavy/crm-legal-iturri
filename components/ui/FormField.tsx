import React from "react";
import styles from "./FormField.module.css";

/* ── Types ──────────────────────────────────────────────────── */
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

/* ── Component ─────────────────────────────────────────────── */
export function FormField({
  label,
  id,
  error,
  className,
  ...inputProps
}: FormFieldProps) {
  const inputClasses = [
    styles.input,
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
