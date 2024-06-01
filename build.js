import fs from "fs"
import yaml from "yaml"
import fse from "fs-extra"
import dotenv from "dotenv"
dotenv.config()


let directory = yaml.parse(fs.readFileSync('./directory.yml', 'utf8'));
let siteList = yaml.parse(fs.readFileSync('./sites.yml', 'utf8'));

var sites = {}
let sitesNotListed = new Set();
let totalSites = 0;


for(let site of siteList)
{
	if(site.link == "" || site.link == null)
		continue;

	if(sites[site.link])
		throw new Error("Site " + site.link + " was already added.")

	sites[site.link] = site;
	totalSites++;
	sitesNotListed.add(site.link)
}

console.log("Total sites: " + totalSites)

let sitesNotInSitesYML = new Set();

buildEverything(true);

if(sitesNotListed.size > 0)
{
	console.log([...sitesNotListed])
	throw new Error("Not all sites are included in directory.yml")
}


buildEverything(false);

/**
 * Builds everything to a *.html file and potentially copies it and other assets to an output directory specified in .env
 * @param {bool} includeRestrictedSites - whether or not to include restricted sites
 */
function buildEverything(includeRestrictedSites)
{
	let siteText = buildBodyText(directory.body, 1, includeRestrictedSites);

	if (sitesNotInSitesYML.size > 0) {
		throw new Error("Somes sites are missing in sites.yml: \n" + [...sitesNotInSitesYML].join("\n"));
	}


	let nav = buildTOC(directory.body, 1);
	let introText = includeRestrictedSites ? directory.intro_ad : directory.intro;

	let html = `
	<!DOCTYPE html>
	<html>
		<head>
			<link rel='stylesheet' href="index.css" />
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
		</head>
		<body>
			<div class='main-container'>
				<div class='mobile-nav-bar'>Table of Contents</div>
				<nav>
					<strong class='desktop-nav-heading'>Table of Contents</strong>
					${nav}
				</nav>
				<main>
					
					${introText}
					${siteText}
					
				</main>
			</div>
			<div id='background' class="${includeRestrictedSites ? "adult" : ""}"></div>

			<script src="index.js"></script>
		</body>
	</html>
	`;


	if(!includeRestrictedSites && process.env.BUILD_TO_DIRECTORY)
	{
		fse.copySync("./font", process.env.BUILD_TO_DIRECTORY + "/font", { overwrite: true})
		fse.copySync("./img", process.env.BUILD_TO_DIRECTORY + "/img", { overwrite: true});
		fse.copyFileSync("./index.css", process.env.BUILD_TO_DIRECTORY + "/index.css");
		fse.copyFileSync("./index.js", process.env.BUILD_TO_DIRECTORY + "/index.js");
		fs.writeFileSync(process.env.BUILD_TO_DIRECTORY + '/index.html', html, 'utf8');
	}
	if(includeRestrictedSites && process.env.BUILD_ALL_TO_DIRECTORY)
	{
		fse.copySync("./font", process.env.BUILD_ALL_TO_DIRECTORY + "/font", { overwrite: true})
		fse.copySync("./img", process.env.BUILD_ALL_TO_DIRECTORY + "/img", { overwrite: true});
		fse.copyFileSync("./index.css", process.env.BUILD_ALL_TO_DIRECTORY + "/index.css");
		fse.copyFileSync("./index.js", process.env.BUILD_ALL_TO_DIRECTORY + "/index.js");
		fs.writeFileSync(process.env.BUILD_ALL_TO_DIRECTORY + '/index.html', html, 'utf8');
	}

	if(includeRestrictedSites)
		fs.writeFileSync('./all.html', html, 'utf8');
	else
		fs.writeFileSync('./index.html', html, 'utf8');
}

/**
 * Builds the HTML used to display all info about each website.
 * @param nodes - a list of group, site, and html nodes (see directory.yml for an example structure)
 * @param {number} headingLevel - integer representing which tag h1, h2, etc. to use
 * @param {boolean} includeRestrictedSites - whether or not to incldue sites tagged with 'restricted'
 */ 
function buildBodyText(nodes, headingLevel, includeRestrictedSites)
{
	return nodes.map(function(x){

		if(x.site)
		{
			let site = sites[x.site];

			if(!site){
				sitesNotInSitesYML.add(x.site);
				return "";
			}

			let tags = site.tags ? site.tags.split(",") : [];
			let extraClasses = "";

			let isRestricted = tags.indexOf("restricted") > -1;
			if(isRestricted)
				tags.splice(tags.indexOf("restricted"),1)

			let isDead = tags.indexOf("dead") > -1
			if(isDead)
			{
				tags.splice(tags.indexOf("dead"),1)
				extraClasses += " dead"
			}
				
			if(tags.indexOf("redirect") > -1)
				extraClasses += " redirect"

			
			sitesNotListed.delete(site.link);

			if(isRestricted && !includeRestrictedSites)
			{
				return "";
			}
				

			let protocol = site.protocol || "https" 

			return `<div class="site-container ${extraClasses}" data-tags="">
				
				${site.name ? `
					<div>
						<div class="site-title">${site.name}</div>
					</div>`
				: "" }
				
				
				<div class="site-link-container">
					<a class="site-link" href="${protocol}://${site.link}">${site.link.replace(/\./g,"\u200B.")}</a>		
				</div>
				<div class="site-description">${site.description}</div>
				
				<div>

					${tags.map(x => `<div class="tag-label" name=${x}>${x}</div>`).join("")}
					
				</div>
				<div class="site-updated">Updated ${site.updated.substring(0,10)}</div>
			</div>`;
		}
		if(x.group)
		{
			if(x.children == null)
				throw new Error("no children for group " + x.group)
			
			return `<h${headingLevel} id=${getHeadingAnchor(x.group)}>${x.group}</h${headingLevel}>\n` + buildBodyText(x.children, headingLevel+1, includeRestrictedSites);
		}	
		if(x.html)
			return x.html + "\n"

	}).join("");
}

/**
 * Builds the table of contents
 * @param nodes - a list of group, site, and html nodes (see directory.yml for an example structure)
 * @param {number} headingLevel - represents how intented the top-level entries should be in the table of contents. Should start at 1, not 0
 * @returns HTML text
 */
function buildTOC(nodes, headingLevel)
{
	return nodes.map(function(x){

		if(!x.group)
			return "";
				
		if(x.children == null)
			throw new Error("no children for group " + x.group)

		let anchor = getHeadingAnchor(x.group);
		
		return `<div><a style="padding-left: ${headingLevel*25-25}px" href="#${anchor}">${x.group}</a></div>\n` + buildTOC(x.children, headingLevel+1);

	}).join("");
}

/**
 * Used to convert arbitrary text into an ID to be used by the table of contexnts
 * @param {string} text - the text to make an ID for
 * @returns {string}
 */
function getHeadingAnchor(text)
{
	text = text.trim();
	return text.replace(/[^A-Za-z0-9 ]/g,"").replace(/ +/g,"_")
}
