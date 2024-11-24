import * as sites from "$lib/sites.js"
import {getMode} from "$lib/vars.js"


export function load({params})
{
	let current = sites.getRevision("current");
	return {
		sitelist: current.sitelist,
		sites: current.sites,
		mode: getMode() || "safe"
	};
}