'use client';
import { clsx } from 'clsx';
export default function Button({ className='', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={clsx('px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition disabled:opacity-50', className)} {...props} />;
}
