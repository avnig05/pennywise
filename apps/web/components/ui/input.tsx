"use client";
import React from "react";
import clsx from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        "w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sage-500 focus:ring-1 focus:ring-sage-500",
        className
      )}
      {...props}
    />
  );
}
