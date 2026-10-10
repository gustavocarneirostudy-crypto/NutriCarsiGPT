import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
const styles=cva('inline-flex items-center justify-center gap-2 rounded-xl text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:pointer-events-none disabled:opacity-60',{variants:{variant:{default:'bg-emerald-700 text-white hover:bg-emerald-800',outline:'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'},size:{default:'h-12 px-5',sm:'h-10 px-4'}},defaultVariants:{variant:'default',size:'default'}});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof styles>{asChild?:boolean}
export const Button=React.forwardRef<HTMLButtonElement,ButtonProps>(({className,variant,size,asChild=false,...props},ref)=>{const Comp=asChild?Slot:'button';return <Comp className={twMerge(clsx(styles({variant,size,className})))} ref={ref} {...props}/>});
Button.displayName='Button';
