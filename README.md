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

Any sites which have 18+ content or would be considered offensive to certain communities MUST have a 'restricted' tag added to them.

In directory.yml, add the site to one or more existing groups. This will determine where it shows up on the page.

```
          - group: Secret Shipfic Folder
            children:              
            - site: www.secretshipfic.com
            - site: www.tsssf.net
            - site: childrenofkefentse.com
```

## Building index.html ##
`npm run build`

By default, this builds index.html, which contains all non-restricted sites, and all.html which contains all websites.

pony.directory itself hosts the files in a different location than the repository. This can be set by creating a .env file to specify
where all assets should be copied to. 

```
BUILD_TO_DIRECTORY=/var/www/pony-directory
BUILD_ALL_TO_DIRECTORY=/var/www/all-pony-directory
```