import * as sites from "$lib/sites.js"

export function load({params})
{
	let current = sites.getRevision("current")
	return {
		sitelist: current.sitelist,
		sites: current.sites
	};
}