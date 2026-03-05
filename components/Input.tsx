
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    id: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
    const baseStyle = "w-full px-3 py-2 bg-agency-black border border-agency-border text-white focus:outline-none focus:border-terminal-green text-sm font-mono placeholder-gray-700 transition-colors";
    return (
        <div className={className}>
            {label && <label htmlFor={id} className="block text-xs font-bold text-muted-text mb-1 uppercase tracking-wider">{label}</label>}
            <input id={id} className={`${baseStyle}`} {...props} />
        </div>
    );
};

export default Input;
