import GeoJSON from 'ol/format/GeoJSON.js';
import TileLayer from 'ol/layer/Tile.js';
import { Map, View } from 'ol/index.js';
import { Point } from 'ol/geom.js';
import Stroke from 'ol/style/Stroke.js';
import Feature from 'ol/Feature.js';
import { Graticule, Vector as VectorLayer } from 'ol/layer.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Circle as CircleStyle, Fill, Style, Icon } from 'ol/style.js';
import { useGeographic } from 'ol/proj.js';


import { easeOut } from 'ol/easing.js';
import { getVectorContext } from 'ol/render.js';
import { unByKey } from 'ol/Observable.js';

useGeographic();

const derbyish = [-1.4746, 52.9225];
const markerDelay = 100;
const fitViewDuration = 200;
const flashDuration = 3000;
const pulseInterval = 7000;

const view = new View({
  center: derbyish,
  zoom: 6
});

const ukStyle = new Style({
  fill: new Fill({
    color: 'rgba(0, 0, 0, 0)',
  })
});

const circleModerate = new CircleStyle({
  radius: 8,
  fill: new Fill({ color: 'rgba(255, 182, 0, 0.75)' }),
});

const circleSevere = new CircleStyle({
  radius: 8,
  fill: new Fill({ color: 'rgba(255, 0, 0, 0.75)' }),
});

const styleModerate = new Style({
  image: circleModerate
});

const styleSevere = new Style({
  image: circleSevere
});

const tileLayer = new TileLayer({
  source: new OSM()
});

const markerLayer = new VectorLayer({
  title: "Flood markers",
  source: new VectorSource({
  }),
  style: styleModerate
});

const vectorSource = markerLayer.getSource();

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
    tileLayer,
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

vectorSource.on('addfeature', function (e) {
  pulse(e.feature);
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
  view.fit(polygon, { padding: padding, duration: fitViewDuration });
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
      feature.setStyle(styleSevere);
    }
    // Add updated
    vectorSource.addFeature(feature);
  } else {
    console.log(markerData.floodArea.notation);
  }
}

function pulse(feature) {
  flash(feature);
  feature.pulseTimer = setInterval(flash, pulseInterval, feature);
}

function flash(feature) {
  if (!localView) {
    const start = Date.now();
    const flashGeom = feature.getGeometry().clone();
    const listenerKey = tileLayer.on('postrender', animate);

    function animate(event) {
      const frameState = event.frameState;
      const elapsed = frameState.time - start;
      if (elapsed >= flashDuration) {
        unByKey(listenerKey);
        return;
      }
      const vectorContext = getVectorContext(event);
      const elapsedRatio = elapsed / flashDuration;
      // radius will be 5 at start and 30 at end.
      const radius = easeOut(elapsedRatio) * 25 + 5;
      const opacity = easeOut(1 - elapsedRatio);

      const style = new Style({
        image: new CircleStyle({
          radius: radius,
          stroke: new Stroke({
            color: `rgba(255, 255, 255, ${opacity})`,
            width: 3 + opacity,
          }),
        }),
      });

      vectorContext.setStyle(style);
      vectorContext.drawGeometry(flashGeom);
      // tell OpenLayers to continue postrender animation
      map.render();
    }
  }
}

