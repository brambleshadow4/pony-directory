import * as sites from "$lib/sites.js"
import {getMode} from "$lib/vars.js"
import { redirect } from '@sveltejs/kit';


export function load({params})
{
	if(getMode() != "")
	{
		redirect(307, "/")
		return;
	}

	let current = sites.getRevision("current")
	return {
		sitelist: current.sitelist,
		sites: current.sites
	};
}