export async function getWebsites() {
	const url = `${process.env.DIRECTUS_URL}/items/toolgankelijk_website`; 

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Directus fout: ${response.status} ${response.statusText}`);
	}

	const websites = await response.json();
	return websites.data;
}
