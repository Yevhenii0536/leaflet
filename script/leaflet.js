import { FLIGHT_DATA } from './flightData.js';

const map = L.map('map').setView([51.505, -0.09], 13);
const controlButton = L.control({ position: 'bottomleft' });

controlButton.onAdd = function () {
    const div = L.DomUtil.create('div');
    div.innerHTML = '<button class="control-button control-button__on" id="flight-control">Почати</button>';
    return div;
};

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
    .addTo(map);

controlButton.addTo(map);

let animationRunning = false;
let animationTimer;

document.getElementById('flight-control')
    .addEventListener('click', function () {
        if (animationRunning) {
            stopFlight();
            this.textContent = 'Почати';
            this.classList.remove('control-button__off')
            this.classList.add('control-button__on')
        } else {
            playFlight();
            this.textContent = 'Стоп';
            this.classList.add('control-button__off')
            this.classList.remove('control-button__on')
        }
});

function stopFlight() {
    clearTimeout(animationTimer)
    droneMarker.setLatLng([51.505, -0.09]);
    animationRunning = false;
}
const getCoordinatesByDirection = (lat, lng, direction) => {
    const angle = (direction * Math.PI) / 180;
    const distance = 1;
    const earthRadius = 6371;
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;

    const newLat = Math.asin(Math.sin(latRad) * Math.cos(distance / earthRadius) +
        Math.cos(latRad) * Math.sin(distance / earthRadius) * Math.cos(angle));

    const newLng = lngRad + Math.atan2(Math.sin(angle) * Math.sin(distance / earthRadius) * Math.cos(latRad),
        Math.cos(distance / earthRadius) - Math.sin(latRad) * Math.sin(newLat));

    const newLatDeg = (newLat * 180) / Math.PI;
    const newLngDeg = (newLng * 180) / Math.PI;

    return { newLat: newLatDeg, newLng: newLngDeg };
};

const updatedFlightData = FLIGHT_DATA.reduce((acc, data, index) => {
    let initialLat, initialLng;
    if (!index) {
        initialLat = 51.505;
        initialLng = -0.09;
    } else {
        initialLat = acc[index - 1].lat;
        initialLng = acc[index - 1].lng;
    }

    const { newLat, newLng } = getCoordinatesByDirection(initialLat, initialLng, data.direction);
    const updatedData = {
        ...data,
        lat: newLat,
        lng: newLng
    };

    acc.push(updatedData);
    return acc;
}, []);


const paperPlaneIcon = L.icon({
    iconUrl: './icons/drone.png',
    iconSize: [30, 30],
    iconAnchor: [15, 10],
    className: 'drone'
});

const droneMarker = L.marker([51.505, -0.09], {icon: paperPlaneIcon}).addTo(map);

function playFlight() {
    let currentIndex = 0;

    function moveDrone() {
        const dataPoint = updatedFlightData[currentIndex];
        animationRunning = true;

        droneMarker
            .setLatLng([dataPoint.lat, dataPoint.lng])
            .addTo(map)
            .bindPopup(`<b>Timestamp:</b> ${dataPoint.timestamp}<br><b>Speed:</b> ${dataPoint.speed} km/h<br><b>Direction:</b> ${dataPoint.direction}&deg;`,
                { className: 'popup' })
            .openPopup();

        map.flyTo([dataPoint.lat, dataPoint.lng], 13, {
            animate: true,
            duration: (dataPoint.timestamp - dataPoint.timestamp) / 1000
        });

        currentIndex++;

        if (currentIndex < updatedFlightData.length) {
            animationTimer = setTimeout(moveDrone, 300);
        }
    }

    moveDrone();
}
