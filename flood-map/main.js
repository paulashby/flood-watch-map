import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Circle, Fill, Style } from 'ol/style';
import { Map, View } from 'ol/index';
import { Point } from 'ol/geom';
import { getVectorContext } from 'ol/render';
import { useGeographic } from 'ol/proj';
import Graticule from 'ol/layer/Graticule';
import Stroke from 'ol/style/Stroke';

useGeographic();

const derbyish = [-1.4746, 52.9225];

const layer = new TileLayer({
  source: new OSM()
});

const view = new View({
  center: derbyish,
  zoom: 7
});

const map = new Map({
  target: 'map',
  layers: [
    layer,
    new Graticule({
      // the style to use for the lines, optional.
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

// map.getView().setCenter(derbyish);

const image = new Circle({
  radius: 8,
  fill: new Fill({ color: 'rgb(255, 153, 0)' }),
});

const style = new Style({
  image: image,
});

let queryURL = "https://environment.data.gov.uk/flood-monitoring/id/floods/?min-severity=3";
let geometries = [];

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
              // Push to a points array to be added to map by postrender callback
              let lon = posResponse.items.floodArea.long;
              let lat = posResponse.items.floodArea.lat;
              geometries.push(new Point([lon, lat]));
            }
          });
      });
    }
  });

layer.on('postrender', function (event) {

  const vectorContext = getVectorContext(event);

  for (let i = 0; i < geometries.length; ++i) {
    if (geometries[i]) {
      vectorContext.setStyle(style);
      vectorContext.drawGeometry(geometries[i]);
    }
  }
  map.render();
});

$(window).on("resize", function(){
  
  setTimeout( function() { 
    const minZoom = 5.5;
    const maxZoom = 7;
    const minWidth = 250;
    const zoomPerPx = 0.001665;
    let windowWidth = $(window).width();
    let newZoom = Math.min(maxZoom, minZoom + (windowWidth - minWidth) * zoomPerPx);
    view.animate({zoom: newZoom, duration: 200});
  }, 1000);
});

