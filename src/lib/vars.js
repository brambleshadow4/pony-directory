import fs from "fs"
import dotenv from "dotenv"
dotenv.config()

function getMode()
{
	return process.env.MODE || "";
}

export {getMode}
