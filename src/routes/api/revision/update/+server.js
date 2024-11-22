import { json } from "@sveltejs/kit";
import {getRevision, saveRevision, formatRevision, env} from "$lib/sites.js"
import * as fs from 'fs';
import * as yaml from "yaml"

export async function POST({request, cookies})
{
	let body = await request.json();

	let envv = env();

	if(body.password != envv.approvePassword)
	{
		console.log("password mismatch")
		return json("bad password", {status: 401})
	}

	let revisionName = ""
	if(body.approve)
	{
		revisionName = saveRevision(formatRevision(body), true);
	}

	if(!body.revisionNo)
	{
		return json({}, {status: 200})
	}


	// update the old request and close
	let openRequestFile = "./revisions/" + body.revisionNo + " OPEN.yml";

	if(fs.existsSync(openRequestFile))
	{
		let file = fs.readFileSync(openRequestFile, {encoding: "utf8"});
		let obj = yaml.parse(file);

		obj.comments = body.comments;

		let outFile = "./revisions/" + body.revisionNo + " CLOSED.yml";
		fs.writeFileSync(outFile, yaml.stringify(obj));

		// delete the open request.
		fs.rmSync(openRequestFile, {force: true})
	}

	

	return json({}, {status: 200})	
}	