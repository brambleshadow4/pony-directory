import { handler } from './build/handler.js';
import express from 'express';
import fs from "fs"
import http from 'http';
import https from 'https';
import dotenv from "dotenv"
import path from "path";
dotenv.config()


const app = express();

app.get("/.well-known/*", function(req,res, next){

	let p = path.join(process.cwd(), 'public', req.url);
	if(fs.existsSync(p))
	{
		res.sendFile(p);
		return;
	}
	next();

}, handler);




// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);


const privateKey = fs.readFileSync(process.env.KEY, 'utf8');
const certificate = fs.readFileSync(process.env.CERT, 'utf8');
const credentials = {key: privateKey, cert: certificate};

const httpsServer = https.createServer(credentials, app);

const PORT = 8000;
const SSLPORT = 443;


httpsServer.listen(process.env.PORT || 443, function () {
    console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
});
