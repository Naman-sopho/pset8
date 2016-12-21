/* global google */
/* global _ */
/**
 * scripts.js
 *
 * Computer Science 50
 * Problem Set 8
 *
 * Global JavaScript.
 */

// Google Map
var map;

// markers for map
var markers = [];

// Create an info window
var info = new google.maps.InfoWindow();


// execute when the DOM is fully loaded
$(function() {

  // styles for map
  // https://developers.google.com/maps/documentation/javascript/styling
  var styles = [

    // hide Google's labels
    {
      featureType: "all",
      elementType: "labels",
      stylers: [{
        visibility: "off"
      }]
    },

    // hide roads
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{
        visibility: "off"
      }]
    }

  ];

  // options for map
  // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
  var options = {
    center: {
      lat: 40.7128,
      lng: -74.0059
    }, // New YorK
    disableDefaultUI: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    maxZoom: 14,
    panControl: true,
    styles: styles,
    zoom: 13,
    zoomControl: true
  };

  // get DOM node in which map will be instantiated
  var canvas = $("#map-canvas").get(0);

  // instantiate map
  map = new google.maps.Map(canvas, options);

  // configure UI once Google Map is idle (i.e., loaded)
  google.maps.event.addListenerOnce(map, "idle", configure);

});

/**
 * Adds marker for place to map.
 */
function addMarker(place) {
  // set custom marker icon
  var image = {
    url: 'img/icon.png'
  };

  var label = place.place_name + ", " + place.admin_name1;
  var myLatlng = new google.maps.LatLng(place.latitude, place.longitude);
  var marker = new MarkerWithLabel({
    icon: image,
    animation: google.maps.Animation.DROP,
    position: myLatlng,
    map: map,
    labelContent: label,
    labelClass: "labels",
  });

  var param = "geo=" + place.postal_code;
  var news = [];

  // add onclick listener to the marker
  marker.addListener('click', function() {
    info.setContent("<div id='articles'><img id='loader' src='img/ring-alt.gif' style='padding:10px 190px; align:center;'/></div>");
    info.open(map, marker);

    // empty news array to tackle if user clicks multiple times on the same marker
    news.length = 0;
    
    news.push("<h4>" + label + "</h4>");
    news.push("<ul>");

    // render unordered list from the JSON of articles.php
    $.getJSON("articles.php", param).done(function(data) {
      
      if ( data.length == 0 ) {
        news.push("<br><h2> No headlines to show. <br> Check back later! </h2>");
    }
      else {
        $.each(data, function(i, headline) {
          news.push("<li><a href='" + headline.link + "' target=_blank>" + headline.title + "</a></li>");
        });
      }
      news.push("</ul>");
      // set content of the infowindow
      info.setContent(news.join("\n"));

    }).fail(function(jqXHR, textStatus, errorThrown) {
      console.log("Unable to complete ajax request");
    });
  });

  markers.push(marker);
}

/**
 * Configures application.
 */
function configure() {
  // update UI after map has been dragged
  google.maps.event.addListener(map, "dragend", function() {
    update();
  });

  // update UI after zoom level changes
  google.maps.event.addListener(map, "zoom_changed", function() {
    update();
  });

  // remove markers whilst dragging
  google.maps.event.addListener(map, "dragstart", function() {
    removeMarkers();
  });

  // configure typeahead
  // https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
  $("#q").typeahead({
    autoselect: true,
    highlight: true,
    minLength: 1
  }, {
    source: search,
    templates: {
      empty: "no places found yet",
      suggestion: _.template("<div id=\"template\"><p><div id=\"placename\"><%- place_name %>, <%- admin_name1 %></div> <div id=\"postalcode\"><%- postal_code %></div></p></div>")
    }
  });

  // re-center map after place is selected from drop-down
  $("#q").on("typeahead:selected", function(eventObject, suggestion, name) {

    // ensure coordinates are numbers
    var latitude = (_.isNumber(suggestion.latitude)) ? suggestion.latitude : parseFloat(suggestion.latitude);
    var longitude = (_.isNumber(suggestion.longitude)) ? suggestion.longitude : parseFloat(suggestion.longitude);

    // set map's center
    map.setCenter({
      lat: latitude,
      lng: longitude
    });

    // update UI
    update();
  });

  // hide info window when text box has focus
  $("#q").focus(function(eventData) {
    hideInfo();
  });

  // re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
  // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
  document.addEventListener("contextmenu", function(event) {
    event.returnValue = true;
    event.stopPropagation && event.stopPropagation();
    event.cancelBubble && event.cancelBubble();
  }, true);

  // update UI
  update();

  // give focus to text box
  $("#q").focus();
}

/**
 * Hides info window.
 */
function hideInfo() {
  info.close();
}

/**
 * Removes markers from map.
 */
function removeMarkers() {
  $.each(markers, function(i, marker) {
    marker.setMap(null);
  });
}

/**
 * Searches database for typeahead's suggestions.
 */
function search(query, cb) {
  // get places matching query (asynchronously)
  var parameters = {
    geo: query
  };
  $.getJSON("search.php", parameters)
    .done(function(data, textStatus, jqXHR) {

      // call typeahead's callback with search results (i.e., places)
      cb(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

      // log error to browser's console
      console.log(errorThrown.toString());
    });
}

/**
 * Shows info window at marker with content.
 */
function showInfo(marker, content) {
  // start div
  var div = "<div id='info'>";
  if (typeof(content) === "undefined") {
    // http://www.ajaxload.info/
    div += "<img alt='loading' src='img/ajax-loader.gif'/>";
  } else {
    div += content;
  }

  // end div
  div += "</div>";

  // set info window's content
  info.setContent(div);

  // open info window (if not already open)
  info.open(map, marker);
}

/**
 * Updates UI's markers.
 */
function update() {
  // get map's bounds
  var bounds = map.getBounds();
  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();

  // get places within bounds (asynchronously)
  var parameters = {
    ne: ne.lat() + "," + ne.lng(),
    q: $("#q").val(),
    sw: sw.lat() + "," + sw.lng()
  };
  $.getJSON("update.php", parameters)
    .done(function(data, textStatus, jqXHR) {

      // remove old markers from map
      removeMarkers();

      // add new markers to map
      for (var i = 0; i < data.length; i++) {
        addMarker(data[i]);
      }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

      // log error to browser's console
      console.log(errorThrown.toString());
    });
}
