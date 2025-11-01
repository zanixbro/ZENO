import React from 'react';

// Define a type for the 'as' prop
type AsProp<C extends React.ElementType> = {
  as?: C;
};

// Define props to omit from the underlying component's props
type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

// Define the polymorphic component props type
type PolymorphicComponentProps<
  C extends React.ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

// Base props for the Button component itself, excluding standard button attributes initially
interface BaseButtonProps {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

// Update the Button component to be polymorphic
const Button = <C extends React.ElementType = 'button'>({
  as,
  isLoading = false,
  children,
  variant = 'primary',
  ...props
}: PolymorphicComponentProps<C, BaseButtonProps>) => {
  const Component = as || 'button'; // Use 'as' prop or default to 'button'

  const baseClasses = "relative inline-flex items-center justify-center px-5 py-2.5 font-semibold text-sm transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zeno-bg";
  
  const variantClasses = {
    primary: 'bg-zeno-accent text-zeno-bg hover:bg-opacity-90 focus:ring-zeno-accent',
    secondary: 'bg-zeno-card border border-zeno-accent/50 text-zeno-accent hover:bg-zeno-hover focus:ring-zeno-accent'
  }

  return (
    <Component
      {...(props as React.ComponentPropsWithoutRef<C>)} // Cast props to the correct type for Component
      disabled={isLoading || (props as any).disabled} // Access disabled from props, needs any cast for generic Component
      className={`${baseClasses} ${variantClasses[variant]} disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ''}`}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span>{children}</span>
    </Component>
  );
};

export default Button;