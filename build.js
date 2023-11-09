import fs from "fs"
import yaml from "yaml"
import {marked} from "marked"

let fileText = fs.readFileSync('./directory.yml', 'utf8');
let data = yaml.parse(fileText);

let sites = {};
let sitesNotListed = new Set();
let sitesNotCompiled = new Set();

let adultContent = fs.existsSync("./.ADULT")

for(let site of data.sites)
{
	if(site.name == "" || site.name == null)
		continue;

	if(sites[site.name])
		throw new Error("Site " + site.name + " was already added.")

	sites[site.name] = site;
	sitesNotListed.add(site.name)
}

let siteText = data.body;

if(adultContent)
	siteText = siteText.replace("{{intro}}", data.intro_ad)	
else
	siteText = siteText.replace("{{intro}}", data.intro)	


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
	let siteData = sites[siteName]

	if((siteData.is_adult && !adultContent) || (!siteData.is_adult && adultContent))
		return "";

	if(!siteData)
	{
		throw new Error("No data found for site " + siteName)
	}
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