import GeoJSON from 'ol/format/GeoJSON.js';
import TileLayer from 'ol/layer/Tile.js';
import { Map, View } from 'ol/index.js';
import { Point } from 'ol/geom.js';
import Stroke from 'ol/style/Stroke.js';
import Feature from 'ol/Feature.js';
import { Graticule, Vector as VectorLayer } from 'ol/layer.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Circle, Fill, Style, Icon } from 'ol/style.js';
import { useGeographic } from 'ol/proj.js';

useGeographic();

const minZoom = 5.5;
const maxZoom = 7;
const minWidth = 250;
const zoomPerPx = 0.001665;
const derbyish = [-1.4746, 52.9225];
const markerDelay = 100;
const fitViewDuration = 200;

const view = new View({
  center: derbyish,
  zoom: 6
});

const styleSevModerate = new Style({
  image: new Icon(/** @type {olx.style.IconOptions} */({
    anchor: [0.5, 46],
    anchorXUnits: "fraction",
    anchorYUnits: "pixels",
    src: "./markers/amber-dot-ring.gif",
    scale: 1
  }))
});

const styleSevHigh = new Style({
  image: new Icon(/** @type {olx.style.IconOptions} */({
    anchor: [0.5, 46],
    anchorXUnits: "fraction",
    anchorYUnits: "pixels",
    src: "./markers/red-dot-ring.gif",
    scale: 1
  }))
});

const ukStyle = new Style({
  fill: new Fill({
    color: 'rgba(0, 0, 0, 0)',
  })
});

const markerLayer = new VectorLayer({
  title: "Flood markers",
  source: new VectorSource({
  }),
  style: styleSevModerate
});

const ukSource = new VectorSource({
  url: 'data/geojson/uk.geojson',
  format: new GeoJSON(),
});

const ukLayer = new VectorLayer({
  title: "UK polygon",
  source: ukSource,
  style: ukStyle
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
    }),
    markerLayer,
    ukLayer
  ],
  view: view
});

let queryURL = "https://environment.data.gov.uk/flood-monitoring/id/floods/";
let apiFloodData = [];
// Toggle when user is inspecting a location
let localView = false;

ukSource.on("featuresloadend", function () {
  zoomUK(getPadding());
});

$(window).on("resize", function () {
  // No zoom adjustment when inspecting a location
  if (!localView) {
    zoomUK(getPadding());
  }
});

$.ajax({
  url: queryURL,
  method: "GET"
})
  .then(function (response) {

    if (!response.items.length) {
      // No data
      console.log("No data available");
    } else {
      apiFloodData = response.items;
      // Clone array to persist data in original
      updateMarkers([...apiFloodData]);
    }
  });

// Needs implementing
function getPadding() {
  // Get padding - probably based on a hidden DOM element
  return [200, 0, 0, 0];
}

function zoomUK(padding) {
  const feature = ukSource.getFeatures()[0];
  const polygon = feature.getGeometry();
  view.fit(polygon, {padding: padding, duration: fitViewDuration});
}

// Reset markers to initial state
function resetMarkers() {
  // Clone array to persist data in original
  updateMarkers([...apiFloodData]);
}

// Stagger process of adding markers
function updateMarkers(items) {
  if (items.length) {
    // Remove first item after adding to map
    addMarker(items.shift());
    // Recursive call with updated array - slight delay adds sense of dynamism
    let markerInterval = setTimeout(updateMarkers, markerDelay, items);
  }
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
    let vectorSource = markerLayer.getSource();
    // Add updated
    vectorSource.addFeature(feature);
  } else {
    console.log(markerData.floodArea.notation);
  }
}

