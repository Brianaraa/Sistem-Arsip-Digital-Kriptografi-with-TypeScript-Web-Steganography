
import React from 'react';

interface CardProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, description, children }) => {
    return (
        <div className="bg-secondary border border-border-color rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
            <div className="p-6 border-b border-border-color">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="mt-1 text-sm text-text-secondary">{description}</p>
            </div>
            {children}
        </div>
    );
};

export default Card;
