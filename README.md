# Pony Directory #

[pony.directory](https://pony.directory): your one stop shop for all MLP websites known to ponykind!

## Adding new sites ##
To add a new website, you'll need to edit directory.yml and add the url, a description, the date you checked the site in yyyy-mm-dd format, and any flags such as is_dead or is_adult

```
- name: www.tsssf.net
  description: Website for playing Twilight Sparkle's secret shipfic folder
  img: 
  updated: 2023-11-08
```

Any website which targets an 18+ audience should be tagged w/ `is_adult: true`. These are compiled into a separate website
which is not referenced from pony.directory. 

You will also then need to add it to an appropriate location on the main page. It's markdown so new heading can be added with #, and the info about each website can be inserted with {{sitename}}

## Building index.html ##
`npm run build`

Include a file ".ADULT" in the top level directory to compile the adult version of the site.
