import Link from 'next/link';
import Icon from '@/components/Icon';
import sorting from '@/data/sorting.json';

function AddButton({ label = 'Website toevoegen', href = '#' }) {
	return (
		<div className="add-btn">
			<p aria-hidden="true">{label}</p>

			<Link href={href} className="add-button" aria-label={label}>
				<Icon name="add" />
			</Link>
		</div>
	);
}

function Search() {
	return (
		<search className="search">
			<form action="/" role="search">
				<label htmlFor="partner-search" className="visually-hidden">
					Zoek een partner
				</label>
				<input type="search" id="partner-search" name="q" placeholder="zoeken" />
			</form>
		</search>
	);
}

function Filter({ websites }) {
	return (
		<div className="filter">
			<button type="button" className="filter-btn" popoverTarget="filter-menu">
				Filter pagina
				<Icon name="filter" />
			</button>

			<form method="GET" action="/" popover="auto" id="filter-menu" className="filter-menu">
				<label htmlFor="breadcrumb-partner" className="visually-hidden">
					Kies een partner
				</label>
				<select id="breadcrumb-partner" name="partner">
					<option value="">Kies een partner</option>
					{websites.map((website) => (
						<option key={website.slug} value={website.slug}>
							{website.title}
						</option>
					))}
				</select>

				<button type="submit" name="level" value="partner">
					Ga
				</button>
			</form>
		</div>
	);
}

function Sort() {
	if (sorting.length === 0) return null;

	return (
		<form method="GET" action="/" className="sort" aria-label="Sorteren">
			{sorting.map((field) => (
				<div key={field.name} className="sort-field">
					<label htmlFor={`sort-${field.name}`}>{field.label}</label>
					<select id={`sort-${field.name}`} name={field.name} defaultValue={field.value}>
						{field.options.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
			))}

			<button type="submit">Toepassen</button>
		</form>
	);
}

export default function SubHeader({ websites }) {
	return (
		<div className="subheader-container">
			<section className="subheader-layout">
				<h1 className="visually-hidden">Home pagina</h1>

				<AddButton />
				<Search />
				<Filter websites={websites} />
				<Sort />
			</section>
		</div>
	);
}
