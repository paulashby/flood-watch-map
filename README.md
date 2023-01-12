# flood-watch-map
Map making use of the OpenLayers library for use on [Flood Watch web app](https://github.com/Sam010000101/flood-watch).

![html 5](https://img.shields.io/badge/html-5-blue)
![Valid HTML](https://img.shields.io/badge/valid-HTML-green)
![Valid CSS](https://img.shields.io/badge/valid-CSS-green)
![JavaScript ES6](https://img.shields.io/badge/javascript-ES6-yellow)
![jQuery 3](https://img.shields.io/badge/jQuery-4-yellow)
![OpenLayers 7](https://img.shields.io/badge/OpenLayers-7-yellow)

Data is sourced from the [Environment Agency Real Time flood-monitoring API](https://environment.data.gov.uk/flood-monitoring/doc/reference) via jQuery AJAX calls. The returned positional data is mapped onto an [Open Street Map](https://www.openstreetmap.org/) tile layer provided by OpenLayers. 

## Challenges
The Environment Agency flood monitoring API does not directly return geographical coordinates, but rather provides links to indiviual flood area endpoints. Making calls to each of these to retrieve coordinates proved to be a considerabe bottle neck. In order to improve loading times, I stored the [flood area data locally](http://environment.data.gov.uk/flood-monitoring/id/floodAreas/?_limit=10000) which proved to be an extremely successful strategy.

## Credits
Thanks to [the Trilogy Skills Bootcamp in Front-End Web Development](https://skillsforlife.edx.org/coding/frontend/landing/?s=Google-Unbranded&pkw=web%20design%20training&pcrid=624628533241&pmt=p&utm_source=google&utm_medium=cpc&utm_campaign=GGL%7CSKILLS-FOR-LIFE%7CSEM%7CCODING%7C-%7COFL%7CTIER-1%7CALL%7CNBD-G%7CBMM%7CPrimary%7CSubject-Matter&utm_term=web%20design%20training&s=google&k=web%20design%20training&utm_adgroupid=140443158663&utm_locationphysicalms=1006886&utm_matchtype=p&utm_network=g&utm_device=c&utm_content=624628533241&utm_placement=&gclid=Cj0KCQjwqc6aBhC4ARIsAN06NmMdwBRSe3BLeaChkukN5Bbqb18220k1ku9TB2o9tzsX0xYUc-dlRWgaAuyvEALw_wcB&gclsrc=aw.ds) for dreaming up the exercise. Thanks also to Philip Howley, the course Instructor and Brooke Love, my personal teaching assistant.

## Contributors on the [Flood Watch web app](https://github.com/Sam010000101/flood-watch) itself:
* Sam Brooke
* Damien Nsoh Ayine
* Dayo Adekunle
