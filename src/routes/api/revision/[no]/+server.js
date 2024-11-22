import { json } from "@sveltejs/kit";
import {getRevision, saveRevision} from "$lib/sites.js"

export async function GET({request, cookies})
{
	let revisionNo = request.url.substring(request.url.lastIndexOf("/")+1);
	let result = getRevision(revisionNo)

	if(result == null)
		return json(null, {status: 404});
	else
		return json(result, {status: 200});
}	