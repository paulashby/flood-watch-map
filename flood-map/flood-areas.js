let floodAreas = {};

// Get data for all flood areas
$.ajax({
    url: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/?_limit=10000",
    method: "GET"
})
    .then(function (response) {

        if (!response.items.length) {
            // No data
            console.log("No data available");
        } else {
            response.items.forEach(item => {
                // Store coords in floodAreas using notation as key - this is also returned by the call to the flood monitoring endpoint, so can be used to retrieve the coords
                let key = item.notation;
                let coords = [item.long, item.lat];
                floodAreas[key] = coords;
            });
        }
        // Coords all stored - log to be stored locally
        console.log(JSON.stringify(floodAreas));
    });
