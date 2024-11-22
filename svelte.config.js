import nodeAdapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';

import fs from "fs"

let useStatic = false;
try{
	let env = fs.readFileSync(".env",{encoding: "utf-8"});
	if(env.indexOf("useStatic=true") > -1)
	{
		useStatic = true;
	}
}
catch(e){}

console.log("useStatic" )
console.log(useStatic)


var adapter;
if(useStatic)
{
	adapter = staticAdapter({
			// default options are shown. On some platforms
		// these options are set automatically — see below
		pages: 'build',
		assets: 'build',
		fallback: undefined,
		precompress: false,
		strict: false // toggle this to true if you need to debug stuff
	})
}
else
{
	adapter = nodeAdapter();
}



/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		//adapter: nodeAdapter()
		adapter
	}
};

export default config;
