import * as fs from 'fs';
import * as yaml from 'yaml';
import * as os from "os"


export function env()
{
	let data = fs.readFileSync("./.env", {encoding: "utf8"});
	let lines = data.split(/\r?\n/g)
	let env = {};
	for(let line of lines)
	{
		if(line.startsWith("#"))
			continue;

		let idx = line.indexOf("=")
		let a = line.substring(0,idx).trim();
		let b = line.substring(idx+1).trim();
		env[a] = b;
	}
	return env;
}

export function formatRevision(body)
{
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

	return {
		sites,
		sitelist,
		comments: body.comments
	}
}


export function getRevision(id)
{
	var data = {}
	if(id == "current")
	{
		data = fs.readFileSync("./current/sites.yml", {encoding: "utf8"});
	}
	else
	{	

		let pathOpen = "./revisions/" + decodeURIComponent(id) + " OPEN.yml";
		let pathClosed = "./revisions/" + decodeURIComponent(id) + " CLOSED.yml";

		if(fs.existsSync(pathOpen))
		{
			data = fs.readFileSync(pathOpen, {encoding: "utf8"});
		}
		else if(fs.existsSync(pathClosed))
		{
			data = fs.readFileSync(pathClosed, {encoding: "utf8"});
		}
		else
		{
			return null;
		}
		
	}

	var siteArray = yaml.parse(data);

	let sitelist = siteArray.sitelist.map(x => {
		if(x.startsWith("# "))
			return {tag: "h1", level:1, text: x.substring(2)};
		if(x.startsWith("## "))
			return {tag: "h2", level:2, text: x.substring(3)};
		if(x.startsWith("### "))
			return {tag: "h3", level:3, text: x.substring(4)};
		return {site: x}
	})

	var sites = {}
	for(let site of siteArray.sites)
	{
		sites[site.link] = site;
	}

	return {sites, sitelist, comments: siteArray.comments}
}


function getRevisionNo()
{
	let revisions = getRevisions();

	if(revisions.filter(x => x.indexOf("OPEN")).length >= 50)
		return "";

	revisions.sort();
	revisions.reverse();
	
	let revisionNo = 0;
	let revisionDate = new Date().toISOString().substring(0,10)
	if(revisions.length > 0)
	{
		let lastRevisionDate = revisions[0].substring(0,10)
		let lastRevisionNo = Number(revisions[0].substring(11,13));

		if(lastRevisionDate == revisionDate && lastRevisionNo >= 99)
			return "";

		else if (lastRevisionDate == revisionDate)
			revisionNo = lastRevisionNo+1;
	}

	return revisionDate + " " + pad2(revisionNo);
}

function pad2(num)
{
	if(num < 10)
		return "0" + num
	return "" + num;
}

export function saveRevision(object, toProd)
{
	let revisionNo = getRevisionNo();

	if(revisionNo == "")
		return ""



	let file = "./revisions/" + revisionNo + " OPEN.yml";

	if(toProd)
	{
		file = "./current/sites.yml"
		object.comments = [];
	}

	fs.writeFileSync(file, yaml.stringify(object));


	if(toProd)
	{
		let envv = env();
		if(envv.RunScript)
		{
			os.system(envv.RunScript);
		}
	}

	return revisionNo;
}

export function getRevisions()
{
	var files = fs.readdirSync("./revisions");
	return files.reverse()
}