let showDead = document.getElementById('dead')

dead.onchange = function(e)
{
	if(dead.checked)
	{
		document.body.classList.add('show_dead')
	}
	else
	{
		document.body.classList.remove("show_dead");
	}
}

let tocToggle = document.getElementsByClassName('mobile-nav-bar')[0];
let nav = document.getElementsByTagName('nav')[0];
let main = document.getElementsByTagName('main')[0];
let htmlTag = document.getElementsByTagName('html')[0];
let oldScrollPosition = 0;

tocToggle.onclick = function()
{
	
	if(nav.classList.contains("show"))
	{
		main.style.display = "block";
		setTimeout(() => {
			nav.classList.remove("show");
			htmlTag.scrollTop = oldScrollPosition;
			
			
		}, 0)

	}
	else {
		oldScrollPosition = htmlTag.scrollTop;

		console.log(oldScrollPosition);
		htmlTag.scrollTop = 0;
		nav.classList.add("show");
		main.style.display = "none";
	}
}

let links = document.getElementsByTagName('a')

for (let i =0; i< links.length; i++)
{
	links[i].onclick = function(){

		
		if(nav.classList.contains("show"))
		{
			
			main.style.display = "block";
			setTimeout(() => {
				//mainScroll.scrollTop = mainScroll.scrollTop + 60
				
				htmlTag.scrollTop = htmlTag.scrollTop - 60;
				oldScrollPosition = 0;

				nav.classList.remove("show");

			},10);
			

		}
	}
}