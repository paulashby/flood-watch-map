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
const markerDelay = 0; // Let the event loop delay markers
const fitViewDuration = 200;
const zoomLocalDuration = 1000;
const flashDuration = 3000;
const mapGuide = $(".uk-bounds");

const view = new View({
  center: derbyish,
  zoom: 6
});

const ukStyle = new Style({
  fill: new Fill({
    color: 'rgba(0, 0, 0, 0)',
  })
});
ukStyle.getFill().setColor('rgba(255, 0, 0, 0.6)');

const markerCircle = new CircleStyle({
  radius: 8,
  fill: new Fill({ color: 'rgba(100, 100, 100, 0.75)' }),
});

const markerStyle = new Style({
  image: markerCircle
});

const tileLayer = new TileLayer({
  source: new OSM()
});

const markerLayer = new VectorLayer({
  title: "Flood markers national",
  source: new VectorSource({
  }),
  style: markerStyle
});

const markerSource = markerLayer.getSource();

const ukSource = new VectorSource({
  url: 'data/geojson/england.geojson',
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
let pulseInterval = 0; // Value is reset when number of markers is known
// Toggle when user is inspecting a location
let localView = false;
let filterBy = false;


// Event handlers
ukSource.on("featuresloadend", function () {
  zoomUK(getPadding());
});

markerSource.on('addfeature', function (e) {
  pulse(e.feature);
});

$(window).on("resize chartRendered", resizeMap);

$(window).on("home", function () {
  // Switch to national view mode
  localView = false;
  // Show appropriate markers
  updateMarkers([...apiFloodData]);
  // Adjust view to encompass UK
  zoomUK(getPadding());
});

$(window).on("location", function (e, data) {
  // Get items to include
  const items = data.items;
  // Switch to local view mode
  localView = true;
  // Show appropriate markers
  updateMarkers(items);

  // Zoom to locality
  view.fit(markerSource.getExtent(), {
    size: map.getSize(),
    padding: getPadding(),
    duration: zoomLocalDuration,
    easing: easeOut,
    maxZoom: 16
  });
});

$(window).on("filterMarkers", function (e, data) {
  // Load all markers
  filterBy = data.severity;
  updateMarkers([...apiFloodData]);
});


// Get flood data and update markers
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
      updateMarkers([...apiFloodData]);
    }
  });

// Get padding based on hidden DOM element
function getPadding() {
  const offset = mapGuide.offset();
  const windowWidth = $(window).width();
  const windowHeight = $(window).height();
  const guideWidth = mapGuide.width();
  const guideHeight = mapGuide.height();
  const paddingTop = offset.top;
  const paddingRight = windowWidth - (offset.left + guideWidth);
  const paddingBottom = windowHeight - (offset.top + guideHeight);
  const paddingLeft = offset.left;
  return [paddingTop, paddingRight, paddingBottom, paddingLeft];
}

function resizeMap() {
  // No zoom adjustment when inspecting a location
  if (!localView) {
    zoomUK(getPadding());
  }
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

// Stagger process of adding markers
function updateMarkers(items) {
  // Clear existing markers so we can start from a clean sheet
  clearMarkers();

  if (localView) {
    // Add markers simultaneously
    items.forEach(item => {
      addMarker(items.shift());
    });
  } else if (items.length) {
    // Add marker to map and remove from array
    addMarker(items.shift());
    // Add markers iteratively - slight delay adds sense of dynamism
    let markerInterval = setTimeout(addMarkers, markerDelay, items);
  }
}

function addMarkers(items) {
  addMarker(items.shift());
  // Recursive call with updated array - slight delay adds sense of dynamism
  let markerInterval = setTimeout(addMarkers, markerDelay, items);
}

// Remove existing markers
function clearMarkers() {
  markerSource.forEachFeature(function (feature) {
    clearInterval(feature.pulseTimer);
  });
  markerSource.clear();
}

function addMarker(markerData) {

  if (markerData) {
    const coords = floodAreas[markerData.floodArea.notation];

    if (coords) {
      const severityLevel = markerData.severityLevel;

      if (!filterBy || filterBy === severityLevel) {
        // Marker is correct level is filtering is applied
        const severity = markerData.severity; // eg "Flood warning"
        const location = markerData.description;
        const feature = new Feature({
          geometry: new Point(coords),
          type: severity,
          level: severityLevel,
          name: location,
          local: localView
        });

        // Add updated
        markerSource.addFeature(feature);
      }

    } else {
      console.log(markerData.floodArea.notation);
    }

  }
}

function pulse(feature) {
  flash(feature);
  feature.pulseTimer = setInterval(flash, pulseInterval, feature);
}

function flash(feature) {
  // Markers should flash only for appropriate view mode (local/national)
  const passesFilter = !filterBy || filterBy === feature.getProperties().level;
  const shouldFlash = passesFilter && feature.getProperties().local === localView;

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

