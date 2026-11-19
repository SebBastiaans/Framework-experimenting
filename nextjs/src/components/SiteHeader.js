import Hamburger from '@/components/Hamburger';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';
import NavLink from '@/components/NavLink';
import navigation from '@/data/navigation.json';

export default function SiteHeader() {
	return (
		<>
			<a className="skip-link" href="#main-content">
				Jump directly to main content
			</a>
			<header className="site-header">
				<Logo />

				<nav className="header-navigation" aria-label="Hoofdmenu">
					<ul className="header-navigation-wrapper">
						{navigation.items.map((item) => (
							<li key={item.url}>
								<NavLink href={item.url} className="navbutton header">
									<Icon name={item.icon} />
									{item.text}
								</NavLink>
							</li>
						))}
					</ul>

					<div className="account-button">
						<a className="navbutton header" aria-disabled="true">
							<Icon name={navigation.account.icon} />
							{navigation.account.text}
						</a>
					</div>
				</nav>

				<Hamburger />
			</header>
		</>
	);
}
