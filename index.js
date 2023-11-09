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