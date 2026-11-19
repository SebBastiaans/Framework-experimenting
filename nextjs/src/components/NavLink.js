'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, className, children }) {
	const pathname = usePathname();
	const isCurrent = href === pathname;
	const isParent = href.length > 1 && pathname.startsWith(href);

	return (
		<Link
			href={href}
			className={isCurrent ? `${className} active` : className}
			aria-current={isCurrent ? 'page' : undefined}
			data-state={isParent ? 'active' : undefined}
		>
			{children}
		</Link>
	);
}
