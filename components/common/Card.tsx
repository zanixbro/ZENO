import React from 'react';

interface CardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, description, children }) => {
  return (
    <div className="bg-zeno-card border border-zeno-accent/20 rounded-xl shadow-neon-glow p-6 md:p-8 h-full flex flex-col backdrop-blur-sm bg-glass">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zeno-accent">{title}</h1>
        <p className="text-zeno-muted mt-2">{description}</p>
      </div>
      <div className="flex-grow flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default Card;