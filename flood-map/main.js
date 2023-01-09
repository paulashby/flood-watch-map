import GeoJSON from 'ol/format/GeoJSON.js';
import TileLayer from 'ol/layer/Tile.js';
import { Map, View } from 'ol/index.js';
import { Point, Polygon } from 'ol/geom.js';
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
  const event = new CustomEvent('localView', { detail: "Hello from localView event" });
  this.dispatchEvent(event);
});

$(window).on("localView", showLocal);

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
  view.fit(polygon, { padding: padding, duration: fitViewDuration });
}

function showLocal(e) {
  // Use this ?lat=y&long=x&dist=d
  // let areas = "https://environment.data.gov.uk/flood-monitoring/id/floodAreas/?lat=51.5072&long=0.1276&dist=10";
  // ?lat=y&long=x&dist=r
  let warningsURL = "https://environment.data.gov.uk/flood-monitoring/id/floods?lat=51.5072&long=0.1276&dist=40";


  // let detail = e.detail;
  // console.log(`Detail: ${detail}`);
  let items = [];

  $.ajax({
    url: warningsURL,
    method: "GET"
  })
    .then(function (response) {
  
      if (!response.items.length) {
        // No data
        console.log("No data available");
      } else {
        items = response.items;

        // Switch to local view mode
        localView = true;
        markerLayerNational.setVisible(false);
        
        // Show only markers for locality
        updateMarkers(items, true);

        // Zoom to locality
        view.fit(markerSourceLocal.getExtent(), {
          size: map.getSize(),
          padding: [100, 100, 100, 100],
          maxZoom: 16
        });
      }
    });


  /*
  Returns:
  --------
  county	        The name of the county intersecting the flood area, as entered by the Flood Incident Management Team		
  description	    A textual description of the item	xsd:string	
  eaAreaName	    Name of the relevant Environment Agency Area	xsd:string	
  eaRegionName	  Name of the relevant Environment Agency region	xsd:string	
  floodWatchArea	The Flood Watch Area corresponding ot a warning		optional
  fwdCode	        Identifying code for the corresponding Target Area in Flood Warnings direct	xsd:string	
  label	          A name for the item	xsd:string	
  lat	            latitude of the centroid of the area, in WGS84 coordinate ref	xsd:decimal	
  long	          longitude of the centroid of the area, in WGS84 coordinate ref	xsd:decimal	
  notation	      A string or other literal which uniquely identifies the item.	xsd:string	
  polygon	        The boundary of the area encoded as a geoJSON polygon	xsd:anyURI	
  quickDialNumber	The QuickDial number of flood line for an English language recording	xsd:string	optional
  riverOrSea	    Name of the river or sea area linked to the flood area	xsd:string	optional

  Not sure how useful this is
  */
  //  const event = new CustomEvent('build', { detail: elem.dataset.time });
  // elem.dispatchEvent(event);

  /*
  //  We could do this, but we won't know the correct padding for the zoom level
  let coords = e.detail;
  const geometry: new Point(coords);
  view.fit(point, { padding: [170, 50, 30, 150], minResolution: 50 });
  */

  // traverse data, assemble whatever we need AND, for now, we'll just determine the rectangle
  // We'll check for data in the function that dispatches the event

  // const items = e.detail.items;
  // const numItems = items.length;




}

// Reset markers to initial state
function resetMarkers() {
  // Clone array to persist data in original
  updateMarkers([...apiFloodData], false);
}

// Stagger process of adding markers
function updateMarkers(items, local) {
  if (items.length) {
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
  // Flash markers only for appropriate view mode (local/national)
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

