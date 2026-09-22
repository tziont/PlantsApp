import type { ButtonHTMLAttributes } from "react";

import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width on phones, intrinsic width from the `sm` breakpoint up. */
  block?: boolean;
  className?: string;
}

/**
 * The class list on its own, so a `<Link>` (or any non-button element) can look
 * like a button without wrapping one inside the other.
 */
export function buttonClass({
  variant = "primary",
  size = "md",
  block = false,
  className,
}: ButtonStyleOptions = {}) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    block ? styles.block : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonStyleOptions & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  variant,
  size,
  block,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, block, className })}
      {...props}
    />
  );
}
