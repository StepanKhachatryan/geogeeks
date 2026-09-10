'use client';

import Link from 'next/link';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { useTransition } from './TransitionProvider';

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
  /** Runs before the transition starts, e.g. to close the mobile menu. */
  onClick?: () => void;
  'aria-current'?: 'page';
  'data-reveal'?: string | boolean;
};

/**
 * A real anchor (shareable, middle-clickable, crawlable) whose left click is
 * routed through the curtain transition instead of navigating immediately.
 */
export function TransitionLink({ href, children, onClick: onActivate, ...rest }: Props) {
  const { navigate } = useTransition();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (event.button !== 0) return;
    onActivate?.();
    event.preventDefault();
    navigate(href);
  };

  return (
    <Link href={href} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
