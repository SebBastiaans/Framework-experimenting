export async function getWebsites() {
	const url = `${import.meta.env.DIRECTUS_URL}/items/toolgankelijk_website`; // naam van de collectie in Directus

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${import.meta.env.DIRECTUS_TOKEN}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Directus fout: ${response.status} ${response.statusText}`);
	}

	const websites = await response.json();
	return websites.data; // Directus stopt de items altijd in "data"
}
