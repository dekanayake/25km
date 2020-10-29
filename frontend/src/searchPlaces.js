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



const epsg4326 = require('epsg-index/s/4326.json')
const epsg3857 = require('epsg-index/s/3857.json');

const axios = require('axios').default;
const places = []
let filteredPlaces = []
const placeMarkers = []


const showAddFreinds = () => {
    document.getElementById('userinput').style.display = 'inline';
    document.getElementById('mapControl').style.display = 'none'
    document.getElementById('map').style.visibility = 'hidden'
}

const showMap = () => {
    document.getElementById('userinput').style.display = 'none';
    document.getElementById('mapControl').style.display = 'inline'
    document.getElementById('map').style.visibility = 'visible'
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
            map.getSource('metroploitan-suburbs').setData(metropolitanGeoJson)


        });


});

const freindGeoCodeList = []
let freindGeoResult
let mapTabAdded

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

    circles.forEach((circle, index) => {
        map.addSource(`${freindGeoCodeList[index].name}-circle`, {
            'type': 'geojson',
            'data': circle
        });

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

    axios.post('https://iqrbx1orsa.execute-api.ap-southeast-2.amazonaws.com/prod/places/nearBy', {
            geometry: intersection.geometry
        })
        .then(function (response) {

            const matchedPlaces = response.data

            while (places.length) {
                A.pop();
            }
            matchedPlaces.forEach(responseItem => {
                places.push(responseItem)
            })
            filteredPlaces = places
            showPlaceMarkers()
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
        document.getElementById('mapTab').disabled = false;
        tabBar.activateTab(1)

        findIntersection()
    });

    const tabBar = new MDCTabBar(document.querySelector('.mdc-tab-bar'));
    tabBar.listen("MDCTabBar:activated", event => {
        console.log(event)
        const tabIndex = event.detail.index
        if (tabIndex === 0) {
            showAddFreinds()
        }
        if (tabIndex === 1) {
            showMap()
        }
    })

    const checkBoxes = document.querySelectorAll('.mdc-checkbox')
    const mdcCheckBoxList = []
    checkBoxes.forEach(checkBox => {
        const mdcCheckbox = new MDCCheckbox(checkBox)
        mdcCheckBoxList.push(mdcCheckbox)
        mdcCheckbox.listen('click', event => {
            const selectedPlaceTypes = mdcCheckBoxList.filter(mdcCheckbox => mdcCheckbox.checked).map(mdcCheckbox => mdcCheckbox.value)
            filteredPlaces = places.filter(place => {
                let exists = false
                selectedPlaceTypes.forEach(selectedType => {
                    if (place.types.includes(selectedType)) {
                        exists = true
                    }
                })
                return exists
            })
            showPlaceMarkers()
        })
    })
}, false);