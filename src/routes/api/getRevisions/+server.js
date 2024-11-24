import { json } from "@sveltejs/kit";
import {getRevisions} from "$lib/sites.js"

export async function GET()
{
	let resp = json(getRevisions(), {status: 200});

	resp.headers.append('Access-Control-Allow-Origin', "*");
	return resp 
}	