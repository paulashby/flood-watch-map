import TileLayer from 'ol/layer/Tile';
import { Map, View } from 'ol/index';
import { Point } from 'ol/geom';
import { useGeographic } from 'ol/proj';
import Stroke from 'ol/style/Stroke';

import Feature from 'ol/Feature';
import { Graticule, Vector as VectorLayer} from 'ol/layer';
import { OSM, Vector } from 'ol/source';
import { Circle, Fill, Style, Icon } from 'ol/style';

useGeographic();

const minZoom = 5.5;
const maxZoom = 7;
const minWidth = 250;
const zoomPerPx = 0.001665;
const derbyish = [-1.4746, 52.9225];

const view = new View({
  center: derbyish,
  zoom: getZoom()
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new Graticule({
      // Line style
      strokeStyle: new Stroke({
        color: 'rgba(0,0,0,0.2)',
        width: 2,
        lineDash: [0.5, 4],
      }),
      showLabels: true,
      wrapX: false,
    })
  ],
  view: view
});

const styleSevModerate = new Style({
  image: new Icon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: "fraction",
    anchorYUnits: "pixels",
    src: "./markers/severity-moderate.png",
    scale: 0.1
  }))
});

const styleSevHigh = new Style({
  image: new Icon(/** @type {olx.style.IconOptions} */ ({
    anchor: [0.5, 46],
    anchorXUnits: "fraction",
    anchorYUnits: "pixels",
    src: "./markers/severity-high.png",
    scale: 0.1
  }))
});

let vectorLayer = new VectorLayer({
  title: "Test markers",
  source: new Vector({
  }),
  style: styleSevModerate
});

map.addLayer(vectorLayer);

const image = new Circle({
  radius: 8,
  fill: new Fill({ color: 'rgb(255, 153, 0)' }),
});

const style = new Style({
  image: image,
});

let queryURL = "https://environment.data.gov.uk/flood-monitoring/id/floods/";
let features = [];

// Get lat/lon based on city name
$.ajax({
  url: queryURL,
  method: "GET"
})
  .then(function (response) {

    if (!response.items.length) {
      // No data
      console.log("No data available");
    } else {
      // Get lat/long for flood event - this step is a serious bottleneck
      response.items.forEach(item => {
        let positionURL = item['@id'].replace("http://", "https://");
        $.ajax({
          url: positionURL,
          method: "GET"
        })
          .then(function (posResponse) {
            if (!posResponse || !response.items.length) {
              console.log("Could not establish position for " + item.description);
            } else {
              // Push to features array to be added to map by postrender callback
              let lon = posResponse.items.floodArea.long;
              let lat = posResponse.items.floodArea.lat;
              let severity = posResponse.items.severity; // eg "Flood warning"
              let severityLevel = posResponse.items.severityLevel;
              let location = posResponse.items.description;
              let feature = new Feature({
                geometry: new Point([lon, lat]),
                type: severity,
                level: severityLevel,
                name: location
              });

              if (severityLevel > 3) {
                feature.setStyle(styleSevHigh);
              }
              features.push(feature);
              let vectorSource = vectorLayer.getSource();
              // Remove existing features
              vectorSource.clear();
              // Add updated
              vectorSource.addFeatures(features);
            }
          });
      });
    }
  });
  
$(window).on("resize", function(){
  
  setTimeout( function() { 
    let newZoom = getZoom();
    view.animate({zoom: newZoom, duration: 200});
  }, 1000);
});

// Returns appropriate zoom value for current width of window
function getZoom() {
  let windowWidth = $(window).width();
  return Math.min(maxZoom, minZoom + (windowWidth - minWidth) * zoomPerPx);
}

