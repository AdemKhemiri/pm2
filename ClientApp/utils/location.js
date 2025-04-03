// const axios = require('axios');

 async function getPublicIP() {
    return await fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(response => {
        // console.log(response.ip);
        return response.ip;
    });
  }

async function trackLicenseLocation() {
  try {
    // Get client IP (works with Express 'trust proxy')
    const ip = await getPublicIP().then(ip => ip);

    // Free IP geolocation API (no API key needed)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon`)
    .then(response => response.json())
    .then(data => data)
    const { country, city, lat, lon } = response;
    const object = {
      country,
      city,
      coordinates: { lat, lon },
      globalIP: ip,
    }
    return object;
  } catch (error) {
    console.error('Location tracking failed:', error);
  }
}
module.exports = trackLicenseLocation
