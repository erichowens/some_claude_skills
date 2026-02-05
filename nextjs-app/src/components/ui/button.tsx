'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // Windows 3.1 variants
        win31: [
          'bg-win31-gray text-win31-black font-system rounded-none',
          'border-2',
          'border-t-win31-white border-l-win31-white',
          'border-b-win31-black border-r-win31-black',
          'shadow-[inset_-1px_-1px_0_var(--color-win31-dark-gray),inset_1px_1px_0_var(--color-win31-light-gray)]',
          'hover:bg-win31-light-gray',
          'active:border-t-win31-black active:border-l-win31-black',
          'active:border-b-win31-white active:border-r-win31-white',
          'active:shadow-[inset_1px_1px_0_var(--color-win31-dark-gray)]',
        ],
        'win31-primary': [
          'bg-win31-navy text-win31-white font-system rounded-none',
          'border-[3px] border-win31-black',
          'hover:bg-win31-blue',
          'active:translate-x-px active:translate-y-px',
        ],
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm rounded-md',
        sm: 'h-9 px-3 text-xs rounded-md',
        lg: 'h-11 px-8 text-base rounded-md',
        icon: 'h-10 w-10 rounded-md',
        'win31-sm': 'h-7 px-2 py-1 text-xs min-w-16',
        'win31-default': 'h-8 px-3 py-1 text-sm min-w-20',
        'win31-lg': 'h-10 px-4 py-2 text-sm min-w-24',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
