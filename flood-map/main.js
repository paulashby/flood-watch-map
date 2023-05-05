import TileLayer from 'ol/layer/Tile.js';
import { Map, View } from 'ol/index.js';
import { Point } from 'ol/geom.js';
import Stroke from 'ol/style/Stroke.js';
import Feature from 'ol/Feature.js';
import { Graticule, Vector as VectorLayer } from 'ol/layer.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Circle as CircleStyle, Fill, Style } from 'ol/style.js';
import { useGeographic } from 'ol/proj.js';
import { easeOut } from 'ol/easing.js';
import { getVectorContext } from 'ol/render.js';
import { unByKey } from 'ol/Observable.js';

useGeographic();

const derbyish = [-1.4746, 52.9225];
const MARKER_DELAY = 150; // Offset addition of markers to add dynamism
const RIPPLE_DURATION = 3000; // Length of marker ripple animation
const RIPPLE_OVERLAP = 1200; // Start next ripple before previous has completely faded away
const ZOOM_LOCAL_DURATION = 1000; // How fast to zoom into local view
const MAX_ZOOM = 11; // Limit local zoom
const mapGuide = $(".eng-bounds");

// Use closure from IIFE to contain related constants
const updateMarkerRadiusSettings = (function () {
  // Constants for calculating marker sizes
  const rangeStart = 320;
  const rangeEnd = 1054;
  const range = rangeEnd - rangeStart;
  const maxMarkerRadius = 8;
  let minMarkerRadius = Math.floor((maxMarkerRadius / Math.PI) * 2);

  return function () {
    const currWidth = $(window).width();
    let markerRadius = minMarkerRadius;

    if (currWidth >= rangeEnd) {
      markerRadius = maxMarkerRadius;
    } else if (currWidth >= rangeStart) {
      // How much wider is the window than rangeStart?
      const widthInRange = currWidth - rangeStart;
      // How much does the radius need to change during the animation?
      const sizeVariation = maxMarkerRadius - minMarkerRadius;
      // Map the size variation to the range
      const adjFactor = sizeVariation / range;
      // Add the remapped widthInRange to the minimum radius we require
      markerRadius = minMarkerRadius + (widthInRange * adjFactor);
    }
    // Variance to be used by ripple() when calculating radius animations
    const rippleVariance = markerRadius * Math.PI;

    // Make the update
    markerRadiusSettings.max = markerRadius;
    markerRadiusSettings.min = minMarkerRadius;
    markerRadiusSettings.variance = rippleVariance;
  };
})();

const engExtent = [-6, 49.75, 2, 55.48];

const markerRadiusSettings = {
  max: 0,
  min: 0,
  variance: 0
};

updateMarkerRadiusSettings();

const view = new View({
  center: derbyish,
  zoom: 6
});

const markerCircle = new CircleStyle({
  radius: markerRadiusSettings.max,
  fill: new Fill({ color: 'rgba(130, 130, 130, 1)' }),
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
    markerLayer
  ],
  view: view
});

const padLocalView = true;
let localView = false;
let localBounds = {
  initalised: false
};
let queryURL = "https://environment.data.gov.uk/flood-monitoring/id/floods/";
let apiFloodData = [];
let pulseInterval = 0; // Value is reset when number of markers is known
let filterBy = false; // Toggle when user is inspecting a location
let markerSetID = 0; // Tested as base case for addMarkers recursion

markerSource.on('addfeature', function (e) {
  if (localView || filterBy) {
    // All markers are added simultaneously, so we need to offset the start of each pulse
    const featureNumber = markerSource.getFeatures().length;
    const animationStartOffset = (featureNumber - 1) * 400;
    e.feature.pulseStarter = setTimeout(startPulse, animationStartOffset, e.feature, markerSetID);
  } else {
    pulse(e.feature);
  }
});

$(window).on("resize chartRendered", resizeMap);

$(window).on("home", function () {
  // Switch to national view mode
  localView = false;
  // Show appropriate markers
  updateMarkers([...apiFloodData]);
  // Adjust view to encompass England
  zoomToExtent(engExtent);
});

$(window).on("location", function (e, data) {
  // Prepare to switch view
  localView = true;
  localBounds.initalised = false;
  // Get items to include
  const items = data.items;
  // Show local markers and define local boundaries
  updateMarkers(items);
  // Define the area we're magnifying (edges listed in anticlockwise order)
  const localExtent = [
    localBounds.west,
    localBounds.south,
    localBounds.east,
    localBounds.north
  ];
  
  zoomToExtent(localExtent);
});

$(window).on("filterMarkers", function (e, data) {
  const severityLevel = data.severity;
  
  if (filterBy === severityLevel) {
    // Toggle back to unfiltered
    filterBy = false;
    updateMarkers([...apiFloodData]);
  } else {
    filterBy = severityLevel;
    updateMarkers(apiFloodData.filter(function(item) {return item.severityLevel === filterBy;}));
  }
});

if (typeof dev !== "undefined") {
  // Frame England within bounds of mapGuide element - on Flood Watch site, map is currently scaled when chart data loads
  zoomToExtent(engExtent);
}

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
      // Set pulseInterval to match number of markers
      setPulseInterval(apiFloodData.length);
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

function zoomToExtent(extent) {
  view.fit(extent, {
      padding: getPadding(),
      duration: ZOOM_LOCAL_DURATION,
      easing: easeOut,
      maxZoom: MAX_ZOOM
    });
}

// Replace corresponding entry in localBounds object if either value 
// of given coord is outside current bounds
function updateLocalBounds(coords) { // coords are [long, lat]  

  if (!localBounds.initalised) {
    // Initalised all fields with current coord values as basis for comparison
    localBounds = {
      initalised: true,
      north: coords[1],
      east: coords[0],
      south: coords[1],
      west: coords[0]
    }
  } else {
    // Update longitude - increases west of Greenwich Meridian
    if (coords[0] > localBounds.east) {
      localBounds.east = coords[0];
    } else if (coords[0] < localBounds.west) {
      localBounds.west = coords[0];
    }

    // Update latitude - increases from equator
    if (coords[1] > localBounds.north) {
      localBounds.north = coords[1];
    } else if (coords[1] < localBounds.south) {
      localBounds.south = coords[1];
    }
  }
}

function resizeMap() {
  // Check whether to use padding when zooming into a location
  if (padLocalView || !localView) {
    zoomToExtent(engExtent);
    updateMarkerRadiusSettings();
    markerCircle.setRadius(markerRadiusSettings.max);
  }
}

// Stagger process of adding markers
function updateMarkers(items) {
  // Increment markerSetID to end any existing recursion 
  markerSetID++;
  // Clear existing markers so we can start from a clean sheet
  clearMarkers();
  // Update pulseInterval to allow for given number of items
  setPulseInterval(items.length);

  if (localView || filterBy) {
    // Add markers simultaneously
    items.forEach(item => {
      addMarker(item);
    });

  } else if (items.length) {
    // Add marker to map and remove from array
    addMarker(items.shift());
    // Add markers iteratively - slight delay adds sense of dynamism
    setTimeout(addMarkers, MARKER_DELAY, items, markerSetID);
  }
}

function addMarkers(items, id) {
  if(id !== markerSetID) {
    // view location has changed - new set of markers being added
    return;
  }
  addMarker(items.shift());
  // Recursive call with updated array - slight delay adds sense of dynamism
  let markerInterval = setTimeout(addMarkers, MARKER_DELAY, items, id);
}

// Remove existing markers
function clearMarkers() {
  markerSource.forEachFeature(function (feature) {
    clearTimeout(feature.pulseStarter);
    clearInterval(feature.pulseTimer);    
  });
  markerSource.clear();
}

function addMarker(markerData) {

  if (markerData) {
    const coords = floodAreas[markerData.floodArea.notation];

    if (localView) {
      updateLocalBounds(coords);
    }

    if (coords) {
      // Marker is correct level if filtering is applied
      const severity = markerData.severity; // eg "Flood warning"
      const location = markerData.description;
      const feature = new Feature({
        geometry: new Point(coords),
        type: severity,
        level: markerData.severityLevel,
        name: location,
        local: localView
      });

      // Add updated
      markerSource.addFeature(feature);
    } else {
      console.log(markerData.floodArea.notation);
    }

  }
}

/*
    Set appropriate pulseInterval for the number of markers so the ripple animations loop through the markers gradually. 
    It's crucial that there's no pause between pulses here - ripple animations cause the tileLayer to re-render and, 
    once initiated, they rely upon the tileLayer postrender event for their progression.
    If no ripple animations are running, no rendering is happening, so no postrender events are generated. 
    This means the animation callback will no longer run, even though event listeners are added.   
*/
function setPulseInterval(markerCount) {
  // Math.max gives us a minimum mutliplier of 1 for the RIPPLE_DURATION - if it goes below this, 
  // the animation repeats much too frequently. This would only be a problem with < 10 markers.
  pulseInterval = Math.round(RIPPLE_DURATION * Math.max(1, markerCount / 10) - RIPPLE_OVERLAP);
}      

// Initiates delayed pulses for sets of markers that are added simultaneously
function startPulse(feature, id) {
  // Check the pulse is still required
  if (id === markerSetID) {
    pulse(feature);
  }
}

function pulse(feature) {
  ripple(feature);
  feature.pulseTimer = setInterval(ripple, pulseInterval, feature);
}

function ripple(feature) {
  // Markers should ripple only for appropriate view mode (local/national)
  const passesFilter = !filterBy || filterBy === feature.getProperties().level;
  const shouldRipple = passesFilter && feature.getProperties().local === localView;
  
  if (shouldRipple) {
    // See https://openlayers.org/en/latest/examples/feature-animation.html
    const start = Date.now();
    const rippleGeom = feature.getGeometry().clone();
    const listenerKey = tileLayer.on('postrender', animate);

    function animate(event) {
      const frameState = event.frameState;
      const elapsed = frameState.time - start;
      if (elapsed >= RIPPLE_DURATION) {
        unByKey(listenerKey);
        return;
      }
      const vectorContext = getVectorContext(event);
      const elapsedRatio = elapsed / RIPPLE_DURATION;
      // radius will be markerRadiusSettings.min at start and markerRadiusSettings.variance + markerRadiusSettings.min at end.
      const radius = easeOut(elapsedRatio) * markerRadiusSettings.variance + markerRadiusSettings.min;
      const opacity = easeOut(1 - elapsedRatio);

      const style = new Style({
        image: new CircleStyle({
          radius: radius,
          stroke: new Stroke({
            color: `rgba(255, 255, 255, ${opacity})`,
            width: 1 + opacity,
          }),
        }),
      });

      vectorContext.setStyle(style);
      vectorContext.drawGeometry(rippleGeom);
      // tell OpenLayers to continue postrender animation
      map.render();
    }
  }
}
