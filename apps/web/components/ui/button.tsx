import React from "react";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Button({ variant = "solid", size = "md", className, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-6 text-base",
  };
  const variants = {
    solid: "bg-sage-500 text-white hover:bg-sage-600 focus:ring-sage-500",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
  };
  return <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />;
}
