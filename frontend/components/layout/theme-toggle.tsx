'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground',
          className,
        )}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-5 w-5 opacity-50" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const icon =
    theme === 'system' ? (
      <Monitor className="h-5 w-5" />
    ) : resolvedTheme === 'dark' ? (
      <Moon className="h-5 w-5" />
    ) : (
      <Sun className="h-5 w-5" />
    );

  const label =
    theme === 'system' ? 'System theme' : theme === 'dark' ? 'Dark mode' : 'Light mode';

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className,
      )}
      title={`${label} — click to switch`}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
