import * as React from 'react';
export const Input=React.forwardRef<HTMLInputElement,React.InputHTMLAttributes<HTMLInputElement>>(({className='',...props},ref)=><input ref={ref} className={'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60 '+className} {...props}/>);
Input.displayName='Input';
