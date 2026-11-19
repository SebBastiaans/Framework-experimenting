import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import site from '@/data/site.json';

export default function Card({ website }) {
	const progressId = `progress-${website.slug}`;
	const percent = website.percent ?? 0;

	return (
		<div className="card-wrapper">
			<article className="card-partner color-primary-light">
				<picture className="card-partner-logo">
					<Image
						className="partner-logo"
						src={`${site.faviconAPI}${website.homepage}&sz=128`}
						alt={`logo van ${website.title}`}
						width={128}
						height={128}
						fetchPriority="high"
						unoptimized
					/>
				</picture>

				<div className="card-content">
					<h2 className="card-title">
						<Link href={`/${website.slug}/`} className="card-link">
							{website.title}
						</Link>
					</h2>

					<div className="partner-progress-container color-primary">
						<progress id={progressId} max="100" value={percent}></progress>
						<label className="progress-percentage" htmlFor={progressId}>
							{percent}%
						</label>
					</div>

					<div className="card-icons-partner">
						<button type="button" className="navbutton small secondary" aria-label={`start audit ${website.title}`}>
							<Icon name="audit" />
						</button>

						<button type="button" className="navbutton small secondary" aria-label={`bewerk ${website.title}`}>
							<Icon name="edit" />
						</button>

						<button type="button" className="navbutton small secondary" aria-label={`verwijder ${website.title}`}>
							<Icon name="delete" />
						</button>
					</div>
				</div>
			</article>
		</div>
	);
}
