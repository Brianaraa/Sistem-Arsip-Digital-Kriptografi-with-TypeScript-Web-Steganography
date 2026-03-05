
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
    // CIA Theme Button Styles
    const baseStyle = "px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border";
    
    const variantStyles = {
        primary: "bg-terminal-green/10 border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-black focus:ring-1 focus:ring-terminal-green",
        secondary: "bg-transparent border-agency-border text-muted-text hover:border-white hover:text-white focus:ring-1 focus:ring-white",
        danger: "bg-alert-red/10 border-alert-red text-alert-red hover:bg-alert-red hover:text-white focus:ring-1 focus:ring-alert-red"
    };

    return (
        <button className={`${baseStyle} ${variantStyles[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
