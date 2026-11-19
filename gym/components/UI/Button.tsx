import type { ButtonHTMLAttributes } from "react";
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'text' | 'danger';
};

export default function Button({
    variant,
    className = '',
    type = 'button',
    ...props
}: ButtonProps) {
    const variantClass = variant
        ? {
            primary: 'primary',
            secondary: 'secondary',
            text: 'text-button',
            danger: 'danger-button',
        }[variant]
        : '';
    return (
        <button
            type={type}
            className={[variantClass, className].filter(Boolean).join(' ')}
            {...props}
        />
    );
}