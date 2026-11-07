import { UserRound } from 'lucide-react';

import { cn } from '@/lib/cn';

import { LogoMark } from './LogoMark';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'size-6', md: 'size-8', lg: 'size-10' } as const;

/** Decorative avatars: the author's name is always rendered as text next to them. */
export function UserAvatar({ size = 'lg', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#5b8dff] to-[#2347d8] text-white shadow-[0_0_14px_-4px_#3b6cf6]',
        SIZES[size],
        className,
      )}
    >
      <UserRound className="size-[55%]" strokeWidth={2.4} />
    </span>
  );
}

export function AgentAvatar({ size = 'lg', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#8b5cf6] to-[#4c2fe0] shadow-[0_0_16px_-4px_#7c3aed]',
        SIZES[size],
        className,
      )}
    >
      <LogoMark className="size-[58%] translate-y-[-4%]" from="#ffffff" to="#e0d4ff" />
    </span>
  );
}
