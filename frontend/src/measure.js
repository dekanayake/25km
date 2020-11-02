import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import * as turf from '@turf/turf';
import proj4 from 'proj4';

const epsg4326 = require('epsg-index/s/4326.json')
const epsg3857 = require('epsg-index/s/3857.json');
 
 // TO MAKE THE MAP APPEAR YOU MUST
        // ADD YOUR ACCESS TOKEN FROM
        // https://account.mapbox.com

        mapboxgl.accessToken =
            'pk.eyJ1IjoiZHVtaW5kYWUiLCJhIjoiY2tnbGd6NTAzMTA2aTJ0cGQ4Zjl5a29rOSJ9.DWoS_odLf0g8fA2t2_4iBQ';
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



        var geocoderHome = new MapboxGeocoder({ // Initialize the geocoder
            accessToken: mapboxgl.accessToken, // Set the access token
            countries: 'au',
            region: 'vic',
            flyTo: false,
            mapboxgl: mapboxgl,
            placeholder: 'Your home address'
        });




        var geocoderTo = new MapboxGeocoder({ // Initialize the geocoder
            accessToken: mapboxgl.accessToken, // Set the access token
            countries: 'au',
            bbox: [139.965, -38.03, 155.258, -27.839],
            flyTo: false,
            mapboxgl: mapboxgl,
            placeholder: 'Destination address'
        });

        // Add the geocoder to the map
        // map.addControl(geocoderHome);
        // map.addControl(geocoderTo);

        document.getElementById('geocoderHome').appendChild(geocoderHome.onAdd(map));
        document.getElementById('geocoderTo').appendChild(geocoderTo.onAdd(map));



        var distanceContainer = document.getElementById('distance');

        // GeoJSON object to hold our measurement features
        var geojson = {
            'type': 'FeatureCollection',
            'features': []
        };






        // Used to draw a line between points
        var linestring = {
            'type': 'Feature',
            'geometry': {
                'type': 'LineString',
                'coordinates': []
            }
        };

        var createGeoJSONCircle = function (center, radiusInKm, points) {
            if (!points) points = 64;

            var coords = {
                latitude: center[1],
                longitude: center[0]
            };

            var km = radiusInKm;

            var ret = [];
            var distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
            var distanceY = km / 110.574;

            var theta, x, y;
            for (var i = 0; i < points; i++) {
                theta = (i / points) * (2 * Math.PI);
                x = distanceX * Math.cos(theta);
                y = distanceY * Math.sin(theta);

                ret.push([coords.longitude + x, coords.latitude + y]);
            }
            ret.push(ret[0]);

            return {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [ret]
                        }
                    }]
                }
            };
        };

        map.on('load', function () {
            map.addSource('geojson', {
                'type': 'geojson',
                'data': geojson
            });

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
                    'text-justify' : 'center'
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


                    // console.log("coords :" + data.features[0].geometry)
                    var metropolitanGeoJson = {
                        'type': 'FeatureCollection',
                        'features': []
                    };
                    metropolitanGeoJson.features = data.features
                    map.getSource('metroploitan-suburbs').setData(metropolitanGeoJson)


                });
            map.addSource('single-point-home', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            map.addSource('single-point-to', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            // Add styles to the map
            map.addLayer({
                id: 'point-home',
                source: 'single-point-home',
                type: 'circle',
                paint: {
                    'circle-radius': 10,
                    'circle-color': '#448ee4'
                }
            });

            map.addLayer({
                id: 'point-to',
                source: 'single-point-to',
                type: 'circle',
                paint: {
                    'circle-radius': 10,
                    'circle-color': '#448ee4'
                }
            });

            map.addLayer({
                id: 'measure-lines',
                type: 'line',
                source: 'geojson',
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round'
                },
                paint: {
                    'line-color': '#000',
                    'line-width': 2.5
                },
                filter: ['in', '$type', 'LineString']
            });



        });



        geocoderHome.on('result', function (e) {
            console.log("geo matry : " + e.result.geometry.latitude + ":" + e.result.geometry.coordinates)
            map.getSource('single-point-home').setData(e.result.geometry);
            var point = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': e.result.geometry.coordinates
                },
                'properties': {
                    'id': 'home'
                }
            };
            map.setCenter(e.result.geometry.coordinates)
            map.addSource("polygon", createGeoJSONCircle(e.result.geometry.coordinates,
                25));

            map.addLayer({
                "id": "polygon",
                "type": "fill",
                "source": "polygon",
                "layout": {},
                "paint": {
                    "fill-color": "red",
                    "fill-opacity": 0.2,
                }
            });

            geojson.features.push(point);
        });

        geocoderTo.on('result', function (e) {
            map.getSource('single-point-to').setData(e.result.geometry);

            if (geojson.features.length > 1) {
                geojson.features.pop()
                geojson.features.pop()
            }

            var point = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': e.result.geometry.coordinates
                },
                'properties': {
                    'id': 'to'
                }
            };
            geojson.features.push(point);

        

            var value = document.createElement('pre');
            value.textContent =
                'Total distance: ' +
                turf.length(linestring).toLocaleString() +
                'km';
            distanceContainer.appendChild(value);

            linestring.geometry.coordinates = geojson.features.map(
                function (point) {
                    return point.geometry.coordinates;
                }
            );

            let intersectionPoints = turf.lineIntersect(linestring, map.getSource('metroploitan-suburbs')._data);
            let intersectionPointsArray = intersectionPoints.features.map(d => {return d.geometry.coordinates});
            let isExceedMetrpolitanMelobourneArea =  intersectionPointsArray.length > 0

            geojson.features.push(linestring);


            // Populate the distanceContainer with total distance
            distanceContainer.innerHTML = '';
            var value = document.createElement('pre');
            value.textContent =
                'Total distance: ' +
                turf.length(linestring).toLocaleString() +
                'km';

            if (isExceedMetrpolitanMelobourneArea) {
                value.textContent = value.textContent + " (destination is outside melbourne metropolitan area)"
                map.setPaintProperty('point-to', 'circle-color', "#FF0000");
                map.setPaintProperty('measure-lines', 'line-color', "#FF0000");
            }    
            else if (turf.length(linestring) > 25) {
                map.setPaintProperty('point-to', 'circle-color', "#FF0000");
                map.setPaintProperty('measure-lines', 'line-color', "#FF0000");
            } else {
                map.setPaintProperty('point-to', 'circle-color', "#008000");
                map.setPaintProperty('measure-lines', 'line-color', "#008000");
            }
            distanceContainer.appendChild(value);

            map.getSource('geojson').setData(geojson);
        });