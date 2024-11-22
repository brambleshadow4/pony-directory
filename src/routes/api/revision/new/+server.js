import { json } from "@sveltejs/kit";
import {getRevision, saveRevision} from "$lib/sites.js"
import fs from "fs"
import yaml from 'yaml';

export async function POST({request, cookies})
{
	let body = await request.json();


	// size checks
	var files = fs.readdirSync("./revisions");
	var totalSize = 0;

	for(let file of files)
	{
		let stats = fs.statSync("./revisions/" + file)
		totalSize += stats.size;
	}

	if(totalSize > 1024*1024*1024){
		return json("Not enough space on disk", {status: 500})
	}


	let sites = [];

	for(let key in body.sites)
	{
		sites.push(body.sites[key]);
	}

	let sitelist = body.sitelist.map(x => {
		if(x.site) return x.site;
		if(x.tag == "h3") return "### " + x.text
		if(x.tag == "h2") return "## " + x.text
		if(x.tag == "h1") return "# " + x.text
		return "";
	})

	let obj = {
		sites,
		sitelist,
		comments: body.comments
	}

	let fileSize = yaml.stringify(obj).length;

	if(fileSize > 50*1024*1024)
	{
		return json("Revision file is too large to save (must be smaller than 50 MB)", {status: 500})
	}

	let revisionName = saveRevision(obj);

	if(revisionName == "")
		return json({}, {status: 500});

	return json({revision: revisionName}, {status: 200})
}	