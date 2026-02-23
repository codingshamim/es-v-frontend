import { InputHTMLAttributes, ReactNode } from "react";

interface FormInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
> {
  label: string;
  icon?: ReactNode;
  error?: string;
  id?: string;
}

export function FormInput({
  label,
  icon,
  error,
  id: idProp,
  ...props
}: FormInputProps) {
  const id =
    idProp ?? props.name ?? props.placeholder?.replace(/\s/g, "-") ?? "input";

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-2 font-bengali"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full py-3 bg-[#111111] dark:bg-[#111111] border border-transparent focus:border-gray-800 dark:focus:border-white rounded-sm text-sm text-white dark:text-white placeholder-gray-500 focus:outline-none! transition-colors ${icon ? "pl-12" : "pl-4"} pr-4`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-sm text-red-400 font-bengali"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
