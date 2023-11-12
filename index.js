
function CheckboxToggleIndeterminate(element_action)
{
	if (element_action.readOnly) {
		element_action.readOnly = false;
		element_action.checked = true;
	}
	else if (element_action.checked) {
		element_action.indeterminate = true;
		element_action.readOnly = true;
	}
}

function ToggleTagFiltersVisibility(element_action)
{
	const elementTagsContainer = document.getElementById("TagsContainer");
	const hideClassName = "tag-filters-hide";
	
	const showFilters = elementTagsContainer.classList.contains(hideClassName);
	
	if (showFilters) {
		elementTagsContainer.classList.remove(hideClassName);
	}
	else {
		elementTagsContainer.classList.add(hideClassName);
	}
}

function ToggleDeadWebsites(element_action)
{
	const elementTagsContainer = document.getElementById("TagsContainer");
	const elementTagDead = elementTagsContainer.querySelectorAll("input[name='dead']")[0];
	
	if (element_action.checked) {
		elementTagDead.readOnly = true;
		elementTagDead.checked = false;
		elementTagDead.indeterminate = true;
	}
	else {
		elementTagDead.readOnly = false;
		elementTagDead.checked = false;
		elementTagDead.indeterminate = false;
	}
	
	ToggleTag();
}

function ResetAllTags(element_action)
{
	const elementTagsContainer = document.getElementById("TagsContainer");
	const elementsTags = elementTagsContainer.querySelectorAll("input[type='checkbox']");
	
	for (const elementTag of elementsTags) {
		elementTag.checked = false;
		elementTag.readOnly = true;
		elementTag.indeterminate = true;
	}
	
	const elementSimpleFilterDead = document.getElementById("SimpleFilterDead");
	elementSimpleFilterDead.checked = true;
	
	ToggleTag();
}

function ToggleTag()
{
	const elementTagsContainer = document.getElementById("TagsContainer");
	const elementSitesContainer = document.getElementById("SitesContainer");
	const elementsTags = elementTagsContainer.querySelectorAll("input[type='checkbox']");
	
	const tagsOn = new Set();
	const tagsOff = new Set();
	
	for (const elementTag of elementsTags) {
		if (elementTag.indeterminate) {
			continue;
		}
		let tagName = elementTag.getAttribute("name");
		if (elementTag.checked) {
			tagsOn.add(tagName);
		}
		else {
			tagsOff.add(tagName);
		}
	}
	
	let previousHeadingTag = undefined;
	let previousHeadingTagHasVisibleInside = false;
	let previousHeadingSubtag = undefined;
	let previousHeadingSubtagHasVisibleInside = false;
	
	const ProcessHeader = (elementSiteContainer) => {
		const isSubtag = (elementSiteContainer?.id.indexOf(":") ?? -1) >= 0;
		
		const hideClassName = "hide-site";
		if (previousHeadingSubtag !== undefined) {
			if (!previousHeadingSubtagHasVisibleInside) {
				if (!previousHeadingSubtag.classList.contains(hideClassName)) {
					previousHeadingSubtag.classList.add(hideClassName);
				}
			}
			else {
				if (previousHeadingSubtag.classList.contains(hideClassName)) {
					previousHeadingSubtag.classList.remove(hideClassName);
				}
			}
		}
		
		if (isSubtag) {
			previousHeadingSubtag = elementSiteContainer;
			previousHeadingSubtagHasVisibleInside = false;
		}
		else {
			if (previousHeadingTag !== undefined) {
				if (!previousHeadingTagHasVisibleInside) {
					if (!previousHeadingTag.classList.contains(hideClassName)) {
						previousHeadingTag.classList.add(hideClassName);
					}
				}
				else {
					if (previousHeadingTag.classList.contains(hideClassName)) {
						previousHeadingTag.classList.remove(hideClassName);
					}
				}
			}
			
			previousHeadingTag = elementSiteContainer;
			previousHeadingSubtag = undefined;
			previousHeadingTagHasVisibleInside = false;
			previousHeadingSubtagHasVisibleInside = false;
		}
	};
	
	for (const elementSiteContainer of elementSitesContainer.children) {
		let siteTags = elementSiteContainer.getAttribute("data-tags")?.split(",") ?? [];
		if (siteTags.length === 1 && siteTags[0].length === 0) {
			siteTags.length = 0;
		}
		if (siteTags.length === 0) {
			if (elementSiteContainer.id.length > 0) {
				ProcessHeader(elementSiteContainer);
			}
			continue;
		}
		siteTags = new Set(siteTags);
		
		let siteIsVisible = (
			(tagsOn.size === 0 || Array.from(tagsOn).every((tagName) => siteTags.has(tagName)))
			&& (tagsOff.size === 0 || Array.from(tagsOff).every((tagName) => !siteTags.has(tagName)))
		);
		const hideClassName = "hide-site";
		if (siteIsVisible) {
			previousHeadingTagHasVisibleInside = true;
			if (previousHeadingSubtag !== undefined) {
				previousHeadingSubtagHasVisibleInside = true;
			}
			if (elementSiteContainer.classList.contains(hideClassName)) {
				elementSiteContainer.classList.remove(hideClassName);
			}
		}
		else {
			if (!elementSiteContainer.classList.contains(hideClassName)) {
				elementSiteContainer.classList.add(hideClassName);
			}
		}
	}
	
	ProcessHeader();
}

(function ()
{
	for (const element_action of document.querySelectorAll("input[type='checkbox'][indeterminate]")) {
		element_action.indeterminate = true;
		element_action.readOnly = true;
	}
	
	// Trigger onload event in all input tags that define the event.
	for (const element_action of document.querySelectorAll("input[onload]")) {
		element_action.dispatchEvent(new Event("load"));
	}
	
	ToggleTag();
})();
