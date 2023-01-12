$("body").css({ "position": "relative" });

const bodyEl = $("body");
const btnsElmt = $("<div>").addClass("btns");


bodyEl.append(btnsElmt);

const locBttn = $("<button>").attr("id", "location").text("Local");
btnsElmt.append(locBttn);

const filterBtn = $("<button>").attr("id", "filter").text("Filter");
btnsElmt.append(filterBtn);

const targetBtn = $("<button>").attr("id", "target").text("Target");
btnsElmt.append(targetBtn);

const polyBtn = $("<button>").attr("id", "poly").text("Polygon");
btnsElmt.append(polyBtn);

const filterBy = false;

filterBtn.on("click", function (e) {
    filterBy = filterBy === false ? 4 : false;
    $(window).trigger("filterMarkers", [{
        severity: filterBy
    }]);
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
    $(this).toggleClass("local");    
});

targetBtn.on("click", function (e) {
    bodyEl.toggleClass("target");    
});

polyBtn.on("click", function (e) {
    $(window).trigger("showPolygon");  
});