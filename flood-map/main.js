import TileLayer from 'ol/layer/Tile';
import { Map, View } from 'ol/index';
import { Point } from 'ol/geom';
import { useGeographic } from 'ol/proj';
import Stroke from 'ol/style/Stroke';

import Feature from 'ol/Feature';
import { Graticule, Vector as VectorLayer } from 'ol/layer';
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
  image: new Icon(/** @type {olx.style.IconOptions} */({
    anchor: [0.5, 46],
    anchorXUnits: "fraction",
    anchorYUnits: "pixels",
    src: "./markers/severity-moderate.png",
    scale: 0.1
  }))
});

const styleSevHigh = new Style({
  image: new Icon(/** @type {olx.style.IconOptions} */({
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

// Limit with ?_limit=10
let queryURL = "https://environment.data.gov.uk/flood-monitoring/id/floods/";
let locationURLs = [];
let features = [];


$(window).on("areasLoaded", function () {
  $.ajax({
    url: queryURL,
    method: "GET"
  })
    .then(function (response) {
  
      if (!response.items.length) {
        // No data
        console.log("No data available");
      } else {
        response.items.forEach(item => {
          addMarker(item);
        });
      }
    });
});

$(window).on("resize", function () {

  setTimeout(function () {
    let newZoom = getZoom();
    view.animate({ zoom: newZoom, duration: 200 });
  }, 1000);
});

// Returns appropriate zoom value for current width of window
function getZoom() {
  let windowWidth = $(window).width();
  return Math.min(maxZoom, minZoom + (windowWidth - minWidth) * zoomPerPx);
}

function addMarker(markerData) {

  let coords = floodAreas[markerData.floodArea.notation];

  if (coords) {
    let severity = markerData.severity; // eg "Flood warning"
    let severityLevel = markerData.severityLevel;
    let location = markerData.description;
    let feature = new Feature({
      geometry: new Point(coords),
      type: severity,
      level: severityLevel,
      name: location
    });

    if (severityLevel < 3) {
      feature.setStyle(styleSevHigh);
    }
    features.push(feature);
    let vectorSource = vectorLayer.getSource();
    // Remove existing features
    vectorSource.clear();
    // Add updated
    vectorSource.addFeatures(features);
  }
}

