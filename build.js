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

	console.log(site)

	sites[site.name] = site;
	sitesNotListed.add(site.name)
}

let siteText = directory.body;

if(adultContent)
	siteText = siteText.replace("{{intro}}", directory.intro_ad)	
else
	siteText = siteText.replace("{{intro}}", directory.intro)	


let siteMatch = /{{(.*?)}}/.exec(siteText)

while(siteMatch)
{
	siteText = siteText.replace(siteMatch[0], buildSite(siteMatch[1]))
	sitesNotListed.delete(siteMatch[1])
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
		throw new Error("No data found for site " + siteName)
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