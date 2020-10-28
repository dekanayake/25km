import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import {
    MDCList
} from '@material/list';
import * as turf from '@turf/turf';

const axios = require('axios').default;

mapboxgl.accessToken = 'pk.eyJ1IjoiZHVtaW5kYWUiLCJhIjoiY2tnbGd6NTAzMTA2aTJ0cGQ4Zjl5a29rOSJ9.DWoS_odLf0g8fA2t2_4iBQ';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [144.9547881, -37.8253549],
    zoom: 8
});

var mq = window.matchMedia("(min-width: 420px)");

if (mq.matches) {
    map.setZoom(8)
} else {
    map.setZoom(7)
}

var geojson = {
    'type': 'FeatureCollection',
    'features': []
};

var geocoderFreind = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    countries: 'au',
    region: 'vic',
});

geocoderFreind.addTo('#geocoderFreind');

const freindGeoCodeList = []
let freindGeoResult

const renderFreindAddressList = () => {
    var freindAddressList = document.getElementById('freindAddressList');
    const liResults = freindGeoCodeList.map((freindGeoCode, index) => {
        return ` <li class="mdc-list-item">
      <span class="mdc-list-item__ripple"></span>
      <span class="mdc-list-item__text">
        <span class="mdc-list-item__primary-text">${freindGeoCode.geoResult.place_name}</span>
        <span class="mdc-list-item__secondary-text">${freindGeoCode.name}</span>
      </span>
    </li>`
    })
    freindAddressList.innerHTML = liResults.join([''])
}

const findIntersection = () => {
    const circles = freindGeoCodeList.map((freindGeoCode, index) => {
        var center = freindGeoCode.geoResult.geometry.coordinates;
        var radius = 25;
        var options = {
            steps: 10,
            units: 'kilometers'
        };
        return turf.circle(center, radius, options);
    });
    let intersection
    let intersectionInputs = []
    circles.forEach((circle, index) => {
        intersectionInputs.push(circle)
        if (intersectionInputs.length == 2) {
            intersection = turf.intersect(intersectionInputs[0], intersectionInputs[1]);
        }
        if (intersectionInputs.length > 2 && intersection) {
            intersection = turf.intersect(intersection, circle)
        }
    })

    console.log(JSON.stringify(intersection))
    
    axios.post('https://iqrbx1orsa.execute-api.ap-southeast-2.amazonaws.com/prod/places/nearBy', {
        geometry: intersection.geometry
      })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });

}

geocoderFreind.on('result', function (e) {
    console.log("geo matry : " + e.result.geometry.latitude + ":" + e.result.geometry.coordinates)
    freindGeoResult = e.result

});

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('addFreindBtn').addEventListener("click", (event) => {
        freindGeoCodeList.push({
            "name": document.getElementById('freindName').value,
            "geoResult": freindGeoResult
        })
        renderFreindAddressList()
    });

    document.getElementById('showPlaces').addEventListener("click", (event) => {
        findIntersection()
    });
}, false);