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
const zoomLocalDuration = 1000;
const flashDuration = 3000;

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

const markerLayerNational = new VectorLayer({
  title: "Flood markers national",
  source: new VectorSource({
  }),
  style: styleModerate
});

const markerLayerLocal = new VectorLayer({
  title: "Flood markers local",
  source: new VectorSource({
  }),
  style: styleModerate
});

const markerSourceNational = markerLayerNational.getSource();
const markerSourceLocal = markerLayerLocal.getSource();

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
    markerLayerLocal,
    markerLayerNational,
    ukLayer
  ],
  view: view
});

let queryURL = "https://environment.data.gov.uk/flood-monitoring/id/floods/";
let apiFloodData = [];
let pulseInterval = 0; // Value is reset when number of markers is known
// Toggle when user is inspecting a location
let localView = false;

ukSource.on("featuresloadend", function () {
  zoomUK(getPadding());
});

markerSourceNational.on('addfeature', function (e) {
  pulse(e.feature);
});

markerSourceLocal.on('addfeature', function (e) {
  pulse(e.feature);
});

$(window).on("resize", function () {
  // No zoom adjustment when inspecting a location
  if (!localView) {
    zoomUK(getPadding());
  }
});

$(window).on("click", function () {
  const event = new CustomEvent('changeLocation', { detail: "Hello from toggleView event" });
  this.dispatchEvent(event);
});

$(window).on("locationEvent", function (e) {
  if (localView) {
    showNational();
  } else {
    showLocal(e);
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
      // Use item count to set pulseInterval
      pulseInterval = Math.round(flashDuration * apiFloodData.length / 100);
      // Clone array to persist data in original
      updateMarkers([...apiFloodData], false);
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
  view.fit(polygon, { 
    padding: padding, 
    duration: fitViewDuration,
    easing: easeOut
  });
}

function showLocal(e) {
  // Get event data
  let items = e.detail.items;

  // Clear existing markers
  markerSourceLocal.clear();

  // Switch to local view mode
  localView = true;
  markerLayerLocal.setVisible(true);
  markerLayerNational.setVisible(false);
  
  // Show only markers for locality
  updateMarkers(items, true);

  // Zoom to locality
  view.fit(markerSourceLocal.getExtent(), {
    size: map.getSize(),
    padding: [100, 100, 100, 100],
    duration: zoomLocalDuration,
    easing: easeOut,
    maxZoom: 16
  });
}

function showNational() {
  // Switch to national view mode
  localView = false;
  // Show appropriate markers
  markerLayerNational.setVisible(true);
  markerLayerLocal.setVisible(false);
  // Adjust view to encompass UK
  zoomUK(getPadding());
}

// Stagger process of adding markers
function updateMarkers(items, local) {
  // If local, add markers immediately, else stagger
  if (local) {
    items.forEach(item => {
      addMarker(items.shift(), local);
    });
  } else if (items.length) {
    // Remove first item after adding to map
    addMarker(items.shift(), local);
    // Recursive call with updated array - slight delay adds sense of dynamism
    let markerInterval = setTimeout(updateMarkers, markerDelay, items, local);
  }
}

function addMarker(markerData, local) {

  const coords = floodAreas[markerData.floodArea.notation];
  const source = local ? markerSourceLocal : markerSourceNational;

  if (coords) {
    const severity = markerData.severity; // eg "Flood warning"
    const severityLevel = markerData.severityLevel;
    const location = markerData.description;
    const feature = new Feature({
      geometry: new Point(coords),
      type: severity,
      level: severityLevel,
      name: location,
      local: local
    });

    if (severityLevel < 3) {
      feature.setStyle(styleSevere);
    }
    // Add updated
    source.addFeature(feature);
  } else {
    console.log(markerData.floodArea.notation);
  }
}

function pulse(feature) {
  flash(feature);
  feature.pulseTimer = setInterval(flash, pulseInterval, feature);
}

function flash(feature) {
  // Markers should flash only for appropriate view mode (local/national)
  const shouldFlash = feature.getProperties().local === localView;

  if (shouldFlash) {
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

