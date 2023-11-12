import fs from "fs"
import yaml from "yaml"
import {marked} from "marked"

function BuildSiteElement(site_data)
{
	const protocol = "//";
	//XXX: Use this when testing locally (without a web server).
	//const protocol = "https://";
	
	const GetUrl = (link) => {
		if (link.indexOf("://") >= 0) {
			return link;
		}
		return protocol + link;
	};
	
	const GetTagLabelGroupingClass = (idx_tag, tags) => {
		if (tags.length > idx_tag + 1 && tags[idx_tag + 1][0].startsWith(tags[idx_tag][0] + ":")) {
			return "tag-label-start";
		}
		else if (tags[idx_tag][0].indexOf(":") >= 0) {
			if (tags.length <= idx_tag + 1 || tags[idx_tag + 1][0].indexOf(":") < 0) {
				return "tag-label-end";
			}
			else {
				return "tag-label-middle";
			}
		}
		else {
			return "";
		}
	};
	
	return `\
<div class="site-container ${site_data.tags.has("dead") ? "dead" : ""}" data-tags="${Array.from(site_data.tags.keys()).join(",")}" >
	<div>
		<div class="site-title" >${site_data.name}</div>
		<span class="site-updated" >Checked on ${site_data.updated}</span>
	</div>
	<div class="site-body-container" >
		<div class="site-link-container" >
` + (site_data.link == undefined
? ""
: `			<a class="site-link" href="${GetUrl(site_data.link)}" >${site_data.link}</a>
`) + `\
` + (site_data.description == undefined
? ""
: `			<div class="site-description" >${site_data.description}</div>
`) + `\
		</div>
` + Array.from(site_data.links.values()).map((link_data) => `\
		<div class="site-link-container ${link_data.is_dead ? "dead" : ""}" >
			<a class="site-link" href="${GetUrl(link_data.link)}" >${link_data.link}</a>
` + (link_data.description == undefined
? ""
: `			<div class="site-description" >${link_data.description}</div>
`) + `\
		</div>
`).join("") + `\
		<div>
` + Array.from(site_data.tags).map((tag_data, idx_tag, tags) => `\
<div class="tag-label ${GetTagLabelGroupingClass(idx_tag, tags)}" name="${tag_data[0]}" >${tag_data[1].name}</div>\
`).join("") + `\
		</div>
	</div>
</div>
`;
}

function BuildTagElement(tag_data)
{
	return `\
<div class="tag-container" >
	<label><input type="checkbox" name="${tag_data.tag}" onclick="CheckboxToggleIndeterminate(this)" onchange="ToggleTag(this)" autocomplete="off" indeterminate /> ${tag_data.name}</label>
` + (tag_data.description == undefined
? ""
: `	<div class="tag-description" >${tag_data.description}</div>
`) + (
tag_data.subtags.size <= 0 ? "" : `\
	<div class="tag-subtag-container" >
` + Array.from(tag_data.subtags.values()).map((subtag_data) => `\
		<label><input type="checkbox" name="${subtag_data.id}" onclick="CheckboxToggleIndeterminate(this)" onchange="ToggleTag(this)" autocomplete="off" indeterminate /> ${subtag_data.name}</label>
`).join("") + `\
	</div>
`) + `\
</div>
`;
}

function ParseTags()
{
	let fileTextTags = fs.readFileSync('./tags.yml', 'utf8');
	let dataTags = yaml.parse(fileTextTags);
	
	const tags = new Map();
	
	let tagOrderId = 0;
	
	for (const tag of dataTags) {
		if (tag.tag == undefined) {
			continue;
		}
		let tagData = {
			tag: tag.tag,
			name: tag.name,
			id: tag.tag,
			order_id: ++tagOrderId,
			description: tag.description,
			subtags: new Map(),
		};
		if (tagData.name == undefined) {
			throw new Error(`Tag ${tagData.tag} does not have a name.`);
		}
		if (tag.subtags != undefined) {
			for (const subtag of tag.subtags) {
				if (subtag.tag == undefined) {
					continue;
				}
				let subtagData = {
					tag: subtag.tag,
					name: subtag.name,
					id: `${tagData.tag}:${subtag.tag}`,
					order_id: ++tagOrderId,
				};
				if (subtagData.name == undefined) {
					throw new Error(`Tag ${subtag.id} does not have a name.`);
				}
				if (tagData.subtags.has(tagData.tag)) {
					throw new Error(`Tag ${subtag.id} already exists.`);
				}
				tagData.subtags.set(subtag.tag, subtagData);
			}
		}
		
		if (tags.has(tagData.tag)) {
			throw new Error(`Tag ${tagData.tag} already exists.`);
		}
		tags.set(tagData.tag, tagData);
	}
	
	return tags;
}

function ParseSites(tags)
{
	let fileTextSites = fs.readFileSync('./sites.yml', 'utf8');
	let dataSites = yaml.parse(fileTextSites);
	
	const sites = new Map();
	
	const all_links = new Set();
	const CheckLink = (link) => {
		if (link == undefined) {
			return false;
		}
		
		if (all_links.has(link)) {
			console.error(`WARNING: The link "${link}" has already been used in another site entry.`);
			return false;
		}
		
		all_links.add(link);
		return true;
	}
	
	for (const site of dataSites) {
		if (site.name == undefined) {
			continue;
		}
		let siteData = {
			name: site.name,
			description: site.description,
			tags: new Map(),
			link: site.link,
			links: new Map(),
			updated: site.updated,
		};
		
		CheckLink(siteData.link);
		
		if (site.links !== undefined) {
			for (const link of site.links) {
				if (link.link == undefined) {
					continue;
				}
				let linkData = {
					link: link.link,
					description: link.description,
					is_dead: link.is_dead ?? false,
				};
				
				if (siteData.links.has(linkData.link) || siteData.link == linkData.link) {
					throw new Error(`Site "${siteData.name}" already contains the link: "${linkData.link}".`);
				}
				CheckLink(linkData.link);
				siteData.links.set(linkData.link, linkData);
			}
		}
		
		const unparsedTags = site.tags?.split(",").map((tag) => tag.split(":").filter((tag) => tag.length > 0)).filter((tag) => tag.length > 0) ?? [];
		for (const siteTag of unparsedTags) {
			const tag = tags.get(siteTag[0]);
			if (tag == undefined) {
				throw new Error(`Site "${siteData.name}" tag "${siteTag[0]}" does not exist.`);
			}
			siteData.tags.set(tag.tag, tag);
			
			for (const siteSubtag of siteTag.slice(1)) {
				const subtag = tag.subtags.get(siteSubtag);
				if (subtag == undefined) {
					throw new Error(`Site "${siteData.name}" tag "${tag.tag}:${siteSubtag}" does not exist.`);
				}
				
				siteData.tags.set(subtag.id, subtag);
			}
		}
		
		if (siteData.tags.size <= 0) {
			throw new Error(`Site "${siteData.name}" does not have any tags.`);
		}
		
		if (siteData.link == undefined && siteData.links.size <= 0) {
			throw new Error(`Site "${siteData.name}" does not have any links.`);
		}
		
		if (siteData.updated == undefined) {
			throw new Error(`Site "${siteData.name}" last updated date not set.`);
		}
		
		if (sites.has(siteData.name)) {
			throw new Error(`Site "${siteData.name}" already exists.`);
		}
		sites.set(siteData.name, siteData);
	}
	
	return sites;
}

(function () {
	const tags = ParseTags();
	const sites = ParseSites(tags);
	
	let fileTextPage = fs.readFileSync('./directory.yml', 'utf8');
	let dataPage = yaml.parse(fileTextPage);
	
	for (const adultContent of [false, true]) {
		let navHeadings = [];
		const AddNavHeading = (tag_data) => {
			let leftPadding = 5;
			if (tag_data.id.indexOf(":") >= 0) {
				leftPadding += 25;
			}
			navHeadings.push(`\
<a style="padding-left: ${leftPadding}px" href="#${tag_data.id}">${tag_data.name}</a>
`);
		};
		
		let lastTagId = "";
		const GetSortingTag = (site_data) => {
			const itrTag = site_data.tags.values();
			const tag1 = itrTag.next().value;
			const tag2 = itrTag.next().value;
			
			if ((tag2?.id.indexOf(":") ?? -1) >= 0) {
				return tag2;
			}
			return tag1;
		};
		let htmlSites = Array
			.from(sites.values())
			.filter((site_data) => adultContent || !site_data.tags.has("adult"))
			.sort((site_1, site_2) => GetSortingTag(site_1).order_id - GetSortingTag(site_2).order_id)
			.map((site_data) => {
				const siteHtml = BuildSiteElement(site_data);
				const siteMainTagId = GetSortingTag(site_data).id;
				let result = siteHtml;
				if (lastTagId !== siteMainTagId) {
					const tagParts = siteMainTagId.split(":");
					const lastTagParts = lastTagId.split(":");
					const BuildMajorHeading = (tag_id) => {
						const tagData = tags.get(tag_id);
						AddNavHeading(tagData);
						return `\
<div id="${tagData.id}" >
	<h1>${tagData.name}</h1>
` + (tagData.description == undefined
? ""
: `	<p>${tagData.description}</p>
`) + `\
</div>
`;
					};
					const BuildMinorHeading = (tag_id) => {
						const tagParts = tag_id.split(":");
						const tagData = tags.get(tagParts[0]);
						const subtagData = tagData.subtags.get(tagParts[1]);
						AddNavHeading(subtagData);
						return `\
<div id="${subtagData.id}" >
	<h2>${subtagData.name}</h2>
</div>
`;
					};
					let majorHeading = "";
					let minorHeading = "";
					if (tagParts.length > 1 && lastTagParts[0] !== tagParts[0]) {
						majorHeading = BuildMajorHeading(tagParts[0]);
					}
					if (tagParts.length > 1) {
						minorHeading = BuildMinorHeading(siteMainTagId);
					}
					else {
						majorHeading = BuildMajorHeading(siteMainTagId);
					}
					lastTagId = siteMainTagId;
					result = majorHeading + minorHeading + result;
				}
				return result;
			})
			.join("");
		
		let htmlTags = Array
			.from(tags.values())
			.filter((tag_data) => adultContent || tag_data.tag !== "adult")
			.map((tag_data) => BuildTagElement(tag_data))
			.join("");
		
		let html = `\
<!DOCTYPE html>
<html>
	<head>
		<link rel='stylesheet' href="index.css" />
	</head>
	<body>
		<div id='background' class="${adultContent ? "adult" : ""}"></div>
		<nav>
			<strong>Table of Contents</strong>
			${navHeadings.join("")}
		</nav>
		<main>
			${marked.parse(adultContent ? dataPage.intro_ad : dataPage.intro)}
			<label><input type="checkbox" id="SimpleFilterDead" onchange="ToggleDeadWebsites(this)" autocomplete="off" checked /> Show dead websites</label>
			<div>
				<h1>Advanced Filters</h1>
				<input type="button" class="tags-reset-button" onclick="ResetAllTags(this)" value="Reset Tag Filters" />
				<input type="button" class="tags-visibility-button" onclick="ToggleTagFiltersVisibility(this)" value="Show/Hide Filters" />
				<div id="TagsContainer" class="tag-filters tag-filters-hide" >
					${htmlTags}
				</div>
			</div>
			<h1>Fan Works</h1>
			<div id="SitesContainer" >
				${htmlSites}
			</div>
		</main>
		<script src="index.js"></script>
	</body>
</html>
`;
		
		fs.writeFileSync(adultContent ? "./adult.html" : "./index.html", html, "utf8");
	}
})();
