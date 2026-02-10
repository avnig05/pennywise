import React from "react";
import clsx from "clsx";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
};

export function Label({ className, ...props }: LabelProps) {
  return <label className={clsx("text-sm font-medium text-gray-700", className)} {...props} />;
}
