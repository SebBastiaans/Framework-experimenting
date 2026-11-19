import Card from '@/components/Card';
import SubHeader from '@/components/SubHeader';
import { getWebsites } from '@/lib/directus';

export default async function Home() {
	const websites = await getWebsites();

	return (
		<>
			<SubHeader websites={websites} />

			<section className="cards">
				{websites.map((website) => (
					<Card key={website.slug} website={website} />
				))}
			</section>
		</>
	);
}
