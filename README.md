# Pony Directory #

[pony.directory](https://pony.directory): your one stop shop for all MLP websites known to ponykind!

## Adding new sites ##
To add a new website, you'll to edit two files: sites.yml and directory.yml 

In sites.yml, please the following 5 properties 

```
- name: Twilight Sparkle's Secret Shipfic Folder Online
  link: www.tsssf.net
  description: Website for playing Twilight Sparkle's secret shipfic folder
  updated: 2023-11-08
  tags: game,tsssf
```

Some websites (think NSFW sites) are considered restricted and must have a 'restricted' tag. See the Restricted Sites section for more info.

In directory.yml, add the site to one or more existing groups. This will determine where it shows up on the page.

```
          - group: Secret Shipfic Folder
            children:              
            - site: www.secretshipfic.com
            - site: www.tsssf.net
            - site: childrenofkefentse.com
```


## Restricted Sites ##

MLP is a kid's franchise so pony.directory tries to limit what's on the main site to stuff that would be 
appropriate for all audiences. It's hard though with many websites featuring a mix of content. Below
are the current guidelines to judge whether a site is restricted or not. 

1. Sites which primarily feature sexually explicit works or content that would be considered inappropriate for the target audience are restricted.
2. Sites which directly link to sites described in (1) are restricted.
3. Sites which feature both SFW and NSFW content need to have appropriate precautions in place. Explicit content should not be shown without the viewer choosing interacting with it. Ideally, such content should be hidden unless the user opts in to list it.


## Building index.html ##
`npm run build`

By default, this builds index.html, which contains all non-restricted sites, and all.html which contains all websites.

pony.directory itself hosts the files in a different location than the repository. This can be set by creating a .env file to specify
where all assets should be copied to. 

```
BUILD_TO_DIRECTORY=/var/www/pony-directory
BUILD_ALL_TO_DIRECTORY=/var/www/all-pony-directory
```