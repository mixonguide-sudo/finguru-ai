import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-700 relative overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};