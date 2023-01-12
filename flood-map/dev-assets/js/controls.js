$("body").css({ "position": "relative" });

const bodyEl = $("body");
const btnsElmt = $("<div>").addClass("btns");


bodyEl.append(btnsElmt);

const apiDataBtn = $("<button>").attr("id", "apidata").text("API Data");
btnsElmt.append(apiDataBtn);

const locDataBtn = $("<button>").attr("id", "locdata").text("Local Data");
btnsElmt.append(locDataBtn);

const delayBtn = $("<button>").attr("id", "delay").text("Delay");
btnsElmt.append(delayBtn);

const locBttn = $("<button>").attr("id", "location").text("Location");
btnsElmt.append(locBttn);

const filterBtn = $("<button>").attr("id", "filter").text("Filter");
btnsElmt.append(filterBtn);

const targetBtn = $("<button>").attr("id", "target").text("Target");
btnsElmt.append(targetBtn);

const polyBtn = $("<button>").attr("id", "poly").text("Polygon");
btnsElmt.append(polyBtn);

const colourBtn = $("<button>").attr("id", "colour").text("Colourise");
btnsElmt.append(colourBtn);

const filterBy = false;

filterBtn.on("click", function (e) {
    const filterBy = $(this).hasClass("filter") ? false : 2;
    $(window).trigger("filterMarkers", [{
        severity: filterBy
    }]);
    $(this).toggleClass("filter");
});


apiDataBtn.on("click", function (e) {
    $(window).trigger("getData", [{
        local: false,
    }]); 
});

locDataBtn.on("click", function (e) {
    $(window).trigger("getData", [{
        local: true
    }]); 
});

delayBtn.on("click", function (e) {
    $(window).trigger("toggleDelay");  
    $(this).toggleClass("active");  
});

locBttn.on("click", function (e) {
    if($(this).hasClass("local")) {
        $(window).trigger("home");
    } else {
        $(window).trigger("location", [{
            location: "Search string",
            items: mockItems
        }]);
    }
    $(this).toggleClass("local active");    
});

targetBtn.on("click", function (e) {
    bodyEl.toggleClass("target");  
    $(this).toggleClass("active");  
});

polyBtn.on("click", function (e) {
    $(window).trigger("showPolygon");  
    $(this).toggleClass("active");   
});

colourBtn.on("click", function () {
    bodyEl.toggleClass("colourise");
    $(this).toggleClass("active");
})