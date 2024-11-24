import { json } from "@sveltejs/kit";
import {getRevisions} from "$lib/sites.js"

export async function GET()
{
	return json(getRevisions(), {status: 200})
}	