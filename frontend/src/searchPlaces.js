import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import {
    MDCList
} from '@material/list';
import * as turf from '@turf/turf';
import proj4 from 'proj4';
import {
    MDCTabBar
} from '@material/tab-bar';
import {
    MDCCheckbox
} from '@material/checkbox';
import { MDCLinearProgress } from '@material/linear-progress';
import {MDCSnackbar} from '@material/snackbar';


const linearProgress = new MDCLinearProgress(document.querySelector('.mdc-linear-progress'));
linearProgress.close()


const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
snackbar.closeOnEscape = true


const epsg4326 = require('epsg-index/s/4326.json')
const epsg3857 = require('epsg-index/s/3857.json');

const axios = require('axios').default;
const places = []
let filteredPlaces = []
const placeMarkers = []
let selectedPlaceType
let melobourneSuburbsGeoJson


const showAddFreinds = () => {
    document.getElementById('userinput').style.display = 'inline';
    document.getElementById('map').style.visibility = 'hidden'
    document.getElementById('listingDesktop').style.visibility = 'hidden'
    document.getElementById('listingMobile').style.visibility = 'hidden'
}

const showMap = () => {
    document.getElementById('userinput').style.display = 'none';
    document.getElementById('map').style.visibility = 'visible'
    if (window.matchMedia('screen and (max-width: 800px)').matches) {
        document.getElementById('listingMobile').style.visibility = 'visible'
    } else {
        document.getElementById('listingDesktop').style.visibility = 'visible'
    }

}

const buildLocationList = () => {
    if (window.matchMedia('screen and (max-width: 800px)').matches) {
        buildLocationListMobile()
    } else {
        buildLocationListDesktop()
    }
}

const buildLocationListMobile = () => {
    var listings = document.getElementById('mobileLocationList');
    listings.innerHTML = ''
    const locationOutputs = filteredPlaces.forEach((place, i) => {

        var prop = {
            title: place.name,
            address: place.vicinity,
            id: place.id,
            city: place.vicinity
        };

        let li = document.createElement('li')
        li.classList.add("mdc-list-item")
        li.innerHTML = `<span class="mdc-list-item__ripple"></span>
      <span class="mdc-list-item__text">
        <span class="mdc-list-item__primary-text">${prop.title}</span>
        <span class="mdc-list-item__secondary-text">${prop.city}</span>
      </span>`

        li.addEventListener('click', event => {
            popup.setLngLat(place.location.coordinates).setHTML(`<strong>${prop.title}</strong><p>${prop.address}</p>`).addTo(map);
            map.flyTo({
                center: place.location.coordinates,
                zoom: 17.3,
            });
        })
        li.addEventListener('mouseleave', event => {
            popup.remove();
        })
        li.addEventListener('dblclick', event => {
            var win = window.open(`https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${prop.id}`, '_blank');
            win.focus();
        })
        listings.appendChild(li)
    });
}

var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 25
    });

const buildLocationListDesktop = () => {

    var listings = document.getElementById('listings');
    listings.innerHTML = ''
    filteredPlaces.forEach((place, i) => {

        var prop = {
            title: place.name,
            address: place.vicinity,
            id: place.id,
            city: place.vicinity
        };

        /* Add a new listing section to the sidebar. */
        var listing = listings.appendChild(document.createElement('div'));
        /* Assign a unique `id` to the listing. */
        listing.id = "listing-" + prop.id;
        /* Assign the `item` class to each listing for styling. */
        listing.className = 'item';

        /* Add the link to the individual listing created above. */
        var link = listing.appendChild(document.createElement('a'));
        link.href = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${prop.id}`;
        link.target = "_blank"
        link.className = 'title';
        link.id = "link-" + prop.id;
        link.innerHTML = prop.title;

        /* Add details to the individual listing. */
        var details = listing.appendChild(document.createElement('div'));
        details.innerHTML = prop.city;
        if (prop.phone) {
            details.innerHTML += ' · ' + prop.phoneFormatted;
        }

        listing.addEventListener('click', event => {
            popup.setLngLat(place.location.coordinates).setHTML(`<strong>${prop.title}</strong><p>${prop.address}</p>`).addTo(map);
            map.flyTo({
                center: place.location.coordinates,
                zoom: 17.3,
            });
        })
        listing.addEventListener('mouseleave', event => {
            popup.remove();
        })
    });
}

const showPlaceMarkers = () => {
    placeMarkers.forEach(marker => {
        marker.remove()
    })
    filteredPlaces.forEach(filteredPlace => {
        let makrerIcon
        if (filteredPlace.types.includes('park')) {
            makrerIcon = '<i class="material-icons nature md-24">nature</i>'
        } else if (filteredPlace.types.includes('cafe')) {
            makrerIcon = '<i class="material-icons cafe md-24">local_cafe</i>'
        } else if (filteredPlace.types.includes('restaurant')) {
            makrerIcon = '<i class="material-icons restaurant md-24">restaurant</i>'
        } else {
            console.log(filteredPlace)
            makrerIcon = '<i class="material-icons marker md-24">room</i>'
        }
        var el = document.createElement('div');
        el.className = 'geocoder-dropdown-item'
        el.innerHTML = `${makrerIcon}`
        let marker = new mapboxgl.Marker(el)
            .setLngLat(filteredPlace.location.coordinates)
            .addTo(map);
        placeMarkers.push(marker)
    })
}


mapboxgl.accessToken = process.env.MAP_BOX_ACCESS_TOKEN;

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
    placeholder: 'Address'
});

geocoderFreind.addTo('#geocoderFreind');

map.on('load', function () {

    map.addSource('metroploitan-suburbs', {
        'type': 'geojson',
        'data': geojson
    });

    map.addLayer({
        'id': 'metroploitan-suburbs',
        'type': 'fill',
        'source': 'metroploitan-suburbs',
        'layout': {},
        'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.8
        }
    });

    map.addLayer({
        'id': 'metroploitan-suburbs-text',
        'type': 'symbol',
        'source': 'metroploitan-suburbs',
        'layout': {
            'text-field': 'Melbourne metroploitan area',
            'text-justify': 'center'
        },
        'paint': {
            'text-opacity': 0.6,
        }
    });


    fetch('/metro.json')
        .then(response => response.json())
        .then(data => {
            data.features[0].geometry.coordinates[0][0] = data.features[0].geometry.coordinates[0][
                0
            ].map(coords => {
                return proj4(epsg3857.proj4, epsg4326.proj4, [coords[0], coords[1]]);
            })

            var metropolitanGeoJson = {
                'type': 'FeatureCollection',
                'features': []
            };
            metropolitanGeoJson.features = data.features
            melobourneSuburbsGeoJson = metropolitanGeoJson
            map.getSource('metroploitan-suburbs').setData(metropolitanGeoJson)


        });


});

const freindGeoCodeList = []
let freindGeoResult
let mapTabAdded

const renderFreindAddressList = () => {
    document.getElementById('friendAddressListDiv').style.display = freindGeoCodeList.length > 0 ?'inline' : 'none'
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

    circles.forEach((circle, index) => {
        if (!map.getSource(`${freindGeoCodeList[index].name}-circle`)) {
            map.addSource(`${freindGeoCodeList[index].name}-circle`, {
                'type': 'geojson',
                'data': circle
            });
        }

        if (!map.getLayer(`${freindGeoCodeList[index].name}-circle`)) {
            map.addLayer({
                "id": `${freindGeoCodeList[index].name}-circle`,
                "type": "fill",
                "source": `${freindGeoCodeList[index].name}-circle`,
                "layout": {},
                "paint": {
                    "fill-color": "red",
                    "fill-opacity": 0.2,
                }
            });
        }

        if (!map.getLayer(`${freindGeoCodeList[index].name}-circle-text`)) {
            map.addLayer({
                'id': `${freindGeoCodeList[index].name}-circle-text`,
                'type': 'symbol',
                'source': `${freindGeoCodeList[index].name}-circle`,
                'layout': {
                    'text-field': `${freindGeoCodeList[index].name}`,
                    'text-justify': 'center'
                },
                'paint': {
                    'text-opacity': 0.6,
                }
            });
        }
    })

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

    if (!intersection) {
        snackbar.labelText = 'No interesction found for provided addresses'
        snackbar.foundation.setTimeoutMs(4000)
        snackbar.open()
        linearProgress.close()
    }
    const pieces = melobourneSuburbsGeoJson.features[0].geometry.coordinates.map(c => turf.polygon(c))
    intersection = turf.intersect(pieces[0], intersection)

    axios.post('https://iqrbx1orsa.execute-api.ap-southeast-2.amazonaws.com/prod/places/nearBy', {
            geometry: intersection.geometry
        })
        .then(function (response) {
            linearProgress.close()
            const matchedPlaces = response.data

            while (places.length) {
                places.pop();
            }
            matchedPlaces.forEach(responseItem => {
                places.push(responseItem)
            })
            filteredPlaces = places.filter(place => place.types.includes(selectedPlaceType))
            var bbox = turf.bbox(intersection.geometry);
            map.fitBounds(bbox);
            showPlaceMarkers()
            buildLocationList()
            
        })
        .catch(function (error) {
            linearProgress.close()
            console.log(error);
        });

}

geocoderFreind.on('result', function (e) {
    console.log("geo matry : " + e.result.geometry.latitude + ":" + e.result.geometry.coordinates)
    freindGeoResult = e.result

});

const validateUserInputs = () => {

    if (freindGeoCodeList.length  < 2) {
        snackbar.labelText = 'Please add more than one location'
        snackbar.foundation.setTimeoutMs(4000)
        snackbar.open()
        return false
    }

    if (!document.querySelector('input[name="locationType"]:checked')) {
        snackbar.labelText = 'Please select location type'
        snackbar.foundation.setTimeoutMs(4000)
        snackbar.open()
        return false
    }
    return true
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('addFreindBtn').addEventListener("click", (event) => {
        freindGeoCodeList.push({
            "name": document.getElementById('freindName').value,
            "geoResult": freindGeoResult
        })
        geocoderFreind.clear()
        freindName.value = ''
        renderFreindAddressList()
    });

    document.getElementById('showPlaces').addEventListener("click", (event) => {
        document.getElementById('mapTab').disabled = false;
        if (validateUserInputs() ){
            tabBar.activateTab(1)
        }
  


    });

    const tabBar = new MDCTabBar(document.querySelector('.mdc-tab-bar'));
    tabBar.listen("MDCTabBar:activated", event => {
        console.log(event)
        const tabIndex = event.detail.index
        if (tabIndex === 0) {
            showAddFreinds()
        }
        if (tabIndex === 1) {
            map.center = [144.9547881, -37.8253549]
            map.zoom = 8
            linearProgress.open()
            showMap()
            selectedPlaceType = document.querySelector('input[name="locationType"]:checked').value;
            findIntersection()
        }
    })
}, false);