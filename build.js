import fs from "fs"
import yaml from "yaml"
import {marked} from "marked"


let directory = yaml.parse(fs.readFileSync('./directory.yml', 'utf8'));

let sites = {};
let siteList = yaml.parse(fs.readFileSync('./sites.yml', 'utf8'));
let sitesNotListed = new Set();
let sitesNotCompiled = new Set();

let adultContent = fs.existsSync("./.ADULT")

for(let site of siteList)
{
	if(site.name == "" || site.name == null)
		continue;

	if(sites[site.name])
		throw new Error("Site " + site.name + " was already added.")

	sites[site.name] = site;
	sitesNotListed.add(site.name)
}

let struct = buildStructure(directory.body);

// Parse TOC
let siteText = flatten(stripSitelessNodes(buildStructure(directory.body)));

let nav = toTOC(stripSitelessNodes(buildStructure(directory.body)));

if(adultContent)
	siteText = siteText.replace("{{intro}}", directory.intro_ad)	
else
	siteText = siteText.replace("{{intro}}", directory.intro)	


let siteMatch = /{{(.*?)}}/.exec(siteText)

while(siteMatch)
{
	siteText = siteText.replace(siteMatch[0], buildSite(siteMatch[1]))
	siteMatch = /{{(.*?)}}/.exec(siteText)
}

if(sitesNotListed.size > 0)
{
	console.log([...sitesNotListed])
	throw new Error("Not all registered sites are on the list")
}


let html = `
<!DOCTYPE html>
<html>
	<head>
		<link rel='stylesheet' href="index.css" />
	</head>
	<body>
		<div id='background' class="${adultContent ? "adult" : ""}"></div>
		<nav>
			<strong>Table of Contents</strong>
			${nav}
		</nav>
		<main>
			${marked.parse(siteText)}
		</main>
		<script src="index.js"></script>
	</body>
</html>
`;


fs.writeFileSync('./index.html', html, 'utf8');


function buildSite(siteName)
{
	let siteData = sites[siteName];

	if(!siteData)
	{
		throw new Error("Site " + siteName + " is not included in sites.yml")
	}

	if((siteData.is_adult && !adultContent) || (!siteData.is_adult && adultContent))
		return "";

	
	let classes = "";

	if(siteData.is_dead)
		classes += " dead";
	if(siteData.is_adult)
		classes += " adult";

	let protocol = "https://"
	if(siteData.no_https)
		protocol = "http://"

	return `<div class="${classes}">
	    <a class='site' href="${protocol + siteName}">${siteName}</a>
	    <span>${siteData.description}</span>
	    <span class='updated'>Checked on ${siteData.updated}</span>
	  </div>`
}

function buildStructure(text)
{
	let lines = text.split("\n")

	let currentStructure = {level:0, children: [], text:""};

	for(let line of lines)
	{
		let s = line.trim()
		if(s.startsWith("#"))
		{	
			let level=1
			while(s[level] == "#")
				level++;

			let newStructure = {
				type: "heading",
				level,
				text: line,
				children: []
			}

			while(currentStructure.level >= level)
				currentStructure = currentStructure.parent;

			newStructure.parent = currentStructure;
			currentStructure.children.push(newStructure);
			currentStructure = newStructure;
		}
		else if (s.startsWith("{"))
		{
			let siteName = s.replace(/\{|\}/g,"").trim();

			if(!sites[siteName])
			{
				currentStructure.children.push({type: "text", text: line})
				continue;
			}

			sitesNotListed.delete(siteName)

			if((adultContent && sites[siteName].is_adult) || (!adultContent && !sites[siteName].is_adult))
			{
				currentStructure.children.push({type: "site", text: line})
			}
		}
		else
		{
			currentStructure.children.push({type: "text", text: line})
		}
	}

	while(currentStructure.level != 0)
		currentStructure = currentStructure.parent;

	return currentStructure;
}

function stripSitelessNodes(node)
{
	if(node.type == "text")
		return node;
	if(node.type == "site")
		return node;

	for(let i=0; i < node.children.length; i++)
	{
		if(node.children[i].type == "text")
			continue;
		if(node.children[i].type == "site")
			continue;

		stripSitelessNodes(node.children[i]);

		if(!hasSites(node.children[i]))
		{
			node.children.splice(i,1);
			i--
		}
	}

	return node;
}

function flatten(node)
{
	if(node.type == "text" || node.type == "site")
		return node.text + "\n";

	let headingHTML = "";
	if(node.level > 0)
	{
		let text = node.text.replace(/#/g,"").trim();
		let tag = "h"+node.level
		headingHTML= `<${tag} id="${getHeadingAnchor(node.text)}">${text}</${tag}>`;
	}

	return headingHTML + node.children.map(x => flatten(x)).join("");
}

function getHeadingAnchor(text)
{
	text = text.replace(/#/g,"").trim();
	return text.replace(/[^A-Za-z0-9 ]/g,"").replace(/ +/g,"_")
}

function toTOC(node)
{
	if(node.type == "text" || node.type == "site")
		return "";

	let section = node.text.replace(/#/g,"").trim();

	let sectionLink = getHeadingAnchor(node.text);

	let thisNode = node.level == 0 ? "" : `<a style="padding-left: ${node.level*25-20}px" href="#${sectionLink}">${section}</a>\n`


	return thisNode+ node.children.map(toTOC).join("")

}

function hasSites(node)
{
	if(node.type == "text")
	{
		return false;
	}
	if(node.type == "site")
	{
		return true;
	}

	for(let k of node.children)
	{
		if(hasSites(k))
		{
			return true;
		}
	}

	return false;
}