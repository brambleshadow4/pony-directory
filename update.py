
import yaml
import io
import os
from colorama import Fore, Back, Style
from datetime import datetime

from pynput import keyboard
from pynput.keyboard import Key

isNew = True
editSite = {}
item = 0
inRemoveMode = False

def edit_menu(key):
	global item
	maxItems = 7

	if key == Key.right:
		pass		
	elif key == Key.left:
		pass
	elif key == Key.up:
		item -= 1
		if item < 0:
			item = maxItems-1
		renderMenu()
	elif key == Key.down:
		item += 1
		if item >= maxItems:
			item = 0
		renderMenu()
	elif key == Key.esc:
		item = -1
		return False

	if key == Key.enter:
		return False


def c(selected):
	if selected:
		return Back.WHITE + Fore.BLACK
	else:
		return Fore.WHITE + Back.BLACK

def walkDirectory(node):
	global directoryList
	if "site" in node:
		directoryList.append([node, "    " + node["site"]])
	elif "group" in node:
		directoryList.append([node, "## " + node["group"]+ " ##"])
		for subnode in node["children"]:
			walkDirectory(subnode)
	elif "html" in node:
		pass
	else:
		for subnode in node:
			walkDirectory(subnode)

def insertIntoDirectory(node, insertAfterNode, siteName):

	if "children" in insertAfterNode:
		insertAfterNode["children"].insert(0, {"site": siteName})
		return True

	if "group" in node:
		for i in range(len(node["children"])):

			if node["children"][i] == insertAfterNode:
				node["children"].insert(i+1, {"site": siteName})
				return True

			if insertIntoDirectory(node["children"][i], insertAfterNode, siteName):
				return True
		return False
			
	elif "html" in node or "site" in node:
		#print("looping through site " + node["site"])
		pass
	else:
		for i in range(len(node)):

			if node[i] == insertAfterNode:
				node.insert(i+1, {"site": siteName})
				return True
			
			if insertIntoDirectory(node[i], insertAfterNode, siteName):
				return True
		return False

def removeFromDirectory(node, nodeToRemove):
	if "group" in node:
		for i in range(len(node["children"])):

			if node["children"][i] == nodeToRemove:
				node["children"].pop(i)
				return True

			if removeFromDirectory(node["children"][i], nodeToRemove):
				return True

		return False
			
	elif "html" in node or "site" in node:
		pass
	else:
		for i in range(len(node)):

			if node[i] == nodeToRemove:
				node.pop(i)
				return True
			
			if removeFromDirectory(node[i], nodeToRemove):
				return True
		return False



def addRemoveMenu(key):
	global item
	global inRemoveMode

	if inRemoveMode:
		pass
	else:
		if key == Key.right:
			pass		
		elif key == Key.left:
			pass
		elif key == Key.up:
			item -= 1
			renderAddRemoveMenu()
		elif key == Key.page_up:
			item -= 24
			renderAddRemoveMenu()
		elif key == Key.down:
			item += 1
			renderAddRemoveMenu()
		elif key == Key.page_down:
			item += 24
			renderAddRemoveMenu()

	if key == Key.tab:
		inRemoveMode = not(inRemoveMode)
		renderAddRemoveMenu()

	if key == Key.esc:
		item = -1
		return False
	
	if key == Key.enter:
		return False



def renderAddRemoveMenu():
	global directoryList
	global item
	global editSite

	os.system("cls")

	
	if item < 0:
		item = 0
	if item >= len(directoryList):
		item = len(directoryList)-1

	if directoryList[item][1] == "    " + editSite["link"]:
		print(c(True) + "            [Enter] Delete Location           " + c(False))
		isDelete = True
	else:
		print(c(True) + "            [Enter] Insert Location           " + c(False))
		isDelete = False


	lowerBound = item - 12
	upperBound = item + 12

	if len(directoryList) < 24:
		lowerBound = 0
		upperBound = len(directoryList) -1

	elif lowerBound < 0:
		lowerBound = 0
		upperBound = 24

	elif upperBound >= len(directoryList):

		upperBound = len(directoryList)-1
		lowerBound = upperBound-24

	for i in range(lowerBound, upperBound):
		

		if isDelete and i == item:
			print(Fore.RED + "  - " + editSite["link"] + c(False))
		elif directoryList[i][1] == "    " + editSite["link"]:
			print(Fore.YELLOW +  directoryList[i][1] + c(False))
		else:
			print(directoryList[i][1])

		if i == item and not(isDelete):
			print(Fore.GREEN + "  + " + editSite["link"] + c(False))





def renderMenu():
	global directoryList
	os.system("cls")
	if isNew:
		print("New Site " + editSite["link"])
	else:
		print("Editing " + editSite["link"])
	print("===================")


	print(c(item==0) + "Name: " + editSite["name"])
	print(c(item==1) + "Tags: " + editSite["tags"])
	print(c(item==2) + "Description: " + editSite["description"])
	print(c(item==3)+ "Edit Location: " + c(False))

	index = -1
	mostRecentHeader = ""
	mostRecentHeaderIndex = -1
	for k in range(len(directoryList)):
		if directoryList[k][1].startswith("##"):
			mostRecentHeader = directoryList[k][1]
			mostRecentHeaderIndex = k
		if directoryList[k][1] == "    " + editSite["link"]:
			index = k
			break

	if index > -1:

		if mostRecentHeaderIndex < index-2:
			print("    " + mostRecentHeader)
		if index-2 > 0:
			print("    " + directoryList[index-2][1])
		if index-1 > 0:
			print("    " + directoryList[index-1][1])
		print("    " + Fore.YELLOW + directoryList[index][1] + c(False))
		if index+1 > 0:
			print("    " + directoryList[index+1][1])
		if index+2 > 0:
			print("    " + directoryList[index+2][1])
	else:
		print("    Not in list")



	print(c(item==4) + "[Last reviewed " + (editSite["updated"].strftime('%Y-%m-%d')) + "]")
	print(c(item==5) + "[CANCEL]" + c(False)+ "  " + c(item==6) + "[SAVE]" + c(False))

directoryStructure = {} 

with io.open("./directory.yml","r",encoding="utf8") as f:
	directoryStructure = yaml.safe_load(f)

directoryList = []
walkDirectory(directoryStructure["body"])


while True:
	os.system("cls")
	link = input("Link: ")

	if link == "exit" or link == "":
		break

	sites = []
	tags = {}

	with io.open("./sites.yml","r",encoding="utf8") as f:
		sites = yaml.safe_load(f)

	item=0
	editSite = None
	isNew = True

	for site in sites:
		thisLink = site["link"]

		for tag in site["tags"].split(","):
			tags[tag] = True
		
		if thisLink.find(link) != -1:
			editSite = dict(site)
			isNew = False

	tagList = ""
	for tag in tags:
		tagList += ", " + tag
	tagList = tagList[2:]


	if editSite == None:
		editSite = {
			"name": "",
			"link": link,
			"description": "",
			"tags": "",
			"updated": datetime.today()
		}

	while True:

		renderMenu()

		with keyboard.Listener(suppress=True, on_press=edit_menu) as listener:
			listener.join()

		if item == 0:
			editSite["name"] = input("Name: ")
		if item == 1:
			print(tagList)
			editSite["tags"] = input("Tags: ")
			
		if item == 2:
			editSite["description"] = input("Description: ")
		if item == 3:

			item = 0
			for k in range(len(directoryList)):
				if directoryList[k][1] == "    " + editSite["link"]:
					item = k
					break

			renderAddRemoveMenu()
			with keyboard.Listener(suppress=True, on_press=addRemoveMenu) as listener:
				listener.join()
			
			## add or remove the item
			if item != -1:
				if directoryList[item][1] == "    " + editSite["link"]:
					removeFromDirectory(directoryStructure["body"], directoryList[item][0])
				else:
					insertIntoDirectory(directoryStructure["body"], directoryList[item][0], editSite["link"])
				directoryList = []
				walkDirectory(directoryStructure["body"])


			item = 3
		if item == 4:
			os.system("\"C:\\Program Files\\Mozilla Firefox\\firefox.exe\" https://" + editSite["link"])
			editSite["updated"] = datetime.today()
		if item == 5:
			break
		if item == 6:

			for i in range(len(sites)):
				if sites[i]["link"] == editSite["link"]:
					sites[i] = editSite
			if isNew:
				sites.append(editSite)

			with io.open("./sites.yml","w",encoding="utf8") as f:
				f.write(yaml.dump(sites))

			with io.open("./directory.yml","w",encoding="utf8") as f:
				f.write(yaml.dump(directoryStructure))
			break
	