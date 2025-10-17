'use client';
import { clsx } from 'clsx';
export default function Input({ className='', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx('w-full bg-transparent border border-white/20 rounded-xl px-3 py-2 outline-none focus:border-white/40', className)} {...props} />;
}
