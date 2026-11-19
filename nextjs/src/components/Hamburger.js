import Icon from '@/components/Icon';
import NavLink from '@/components/NavLink';
import navigation from '@/data/navigation.json';

export default function Hamburger() {
	return (
		<>
			<div className="hamburger-wrapper">
				<button type="button" className="navbutton small hamburger" popoverTarget="mobile-nav-menu" aria-label="open menu">
					<Icon name="menu" />
				</button>
			</div>

			<div popover="auto" id="mobile-nav-menu" className="hamburger-menu">
				<div className="menu-header">
					<button
						type="button"
						className="navbutton small primary"
						popoverTarget="mobile-nav-menu"
						popoverTargetAction="hide"
						aria-label="close menu"
					>
						<Icon name="cross" />
					</button>
				</div>

				<nav aria-label="Mobiel menu">
					{navigation.items.map((item) => (
						<NavLink key={item.url} href={item.url} className="navbutton large primary full">
							<Icon name={item.icon} />
							{item.text}
						</NavLink>
					))}

					<a className="navbutton large primary full" aria-disabled="true">
						<Icon name={navigation.account.icon} />
						{navigation.account.text}
					</a>
				</nav>
			</div>
		</>
	);
}
