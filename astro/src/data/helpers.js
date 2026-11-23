/**
 * Geeft attributen terug op basis van of de link actief is
 * of een parent is van het actieve item
 *
 * @param {String} itemUrl De link
 * @param {String} pageUrl De huidige pagina
 * @returns {Object} De attributen (of leeg)
 */
export function getLinkActiveState(itemUrl, pageUrl) {
	const attributes = {};

	if (itemUrl === pageUrl) {
		attributes['aria-current'] = 'page';
	}

	if (itemUrl.length > 1 && pageUrl.indexOf(itemUrl) === 0) {
		attributes['data-state'] = 'active';
	}

	return attributes;
}
