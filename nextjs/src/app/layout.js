import SiteHeader from '@/components/SiteHeader';
import '@/styles/global.css';
import '@/styles/header.css';
import '@/styles/sub-header.css';
import '@/styles/home.css';

export const metadata = {
	title: 'Home',
};

export default function RootLayout({ children }) {
	return (
		<html lang="nl">
			<body>
				<SiteHeader />
				<main tabIndex={-1} id="main-content">
					{children}
				</main>
			</body>
		</html>
	);
}
