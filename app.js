/**
 * FLOODCAST AI: URBAN FLOOD NOWCASTING & CIVIC REROUTING ENGINE (SIH 2026 - MoES SIH-26085)
 * Real-Time Urban Flood Nowcasting, Drainage-Rainfall Coupling & Dynamic Traffic Rerouting
 * Zero Watermarks • Esri High-Res Tiles • 3D Hydraulic Digital Twin
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. CHENNAI GEOGRAPHIC DATABASE & GROUND TRUTH
  // =========================================================================

  const CHENNAI_DATA = {
    center: [13.0180, 80.2220],
    zoom: 12,

    // 4 Natural Sea Gateways (Bay of Bengal Outlets)
    gateways: [
      {
        id: 'ennore',
        name: 'Gateway 1: Ennore Creek (North)',
        basin: 'Kosasthalaiyar River Basin',
        desc: 'Surplus from Puzhal/Poondi reservoirs & North Chennai runoff into Bay of Bengal',
        coords: [13.2350, 80.3250]
      },
      {
        id: 'cooum',
        name: 'Gateway 2: Cooum River Mouth (Central)',
        basin: 'Cooum River (Napier Bridge)',
        desc: 'Carries central urban stormwater runoff past Napier Bridge into the sea',
        coords: [13.0675, 80.2858]
      },
      {
        id: 'adyar',
        name: 'Gateway 3: Adyar River Estuary (South)',
        basin: 'Adyar River Basin',
        desc: 'Discharges Chembarambakkam surplus past Saidapet to San Thome estuary',
        coords: [13.0110, 80.2740]
      },
      {
        id: 'kovalam',
        name: 'Gateway 4: Kovalam / Muttukadu Creek (Far South)',
        basin: 'Kovalam & Pallikaranai Marsh',
        desc: 'Drains Tambaram, Velachery & OMR wetlands via Muttukadu backwaters',
        coords: [12.8120, 80.2450]
      }
    ],

    // Buckingham Canal Interceptor Line (Connects the basins along coast)
    buckinghamCanal: [
      [13.2100, 80.3100],
      [13.1400, 80.2900],
      [13.0800, 80.2800],
      [13.0200, 80.2580],
      [12.9400, 80.2450],
      [12.8300, 80.2400]
    ],

    // Verified Vulnerable Hotspots
    hotspots: [
      {
        id: 'subway-south',
        name: 'Thillai Ganga Nagar Subway',
        region: 'South Chennai (Zone 12 - Alandur)',
        type: 'Railway Underpass (Critical Choke Point)',
        coords: [12.9934, 80.1984],
        vulnerability: 'High Risk (Receives runoff from Nanganallur & Adyar basin backflow)',
        currentDepth: 0.0,
        status: 'green'
      },
      {
        id: 'subway-north',
        name: 'Ganesapuram Subway (Vyasarpadi)',
        region: 'North Chennai (Zone 4 - Tondiarpet)',
        type: 'Railway Underpass',
        coords: [13.1091, 80.2625],
        vulnerability: 'Severe Risk (Captain Cotton Canal & Otteri Nullah backflow)',
        currentDepth: 0.0,
        status: 'green'
      },
      {
        id: 'velachery-lake',
        name: 'Velachery (Ram Nagar / Lake Basin)',
        region: 'South Chennai (Zone 13)',
        type: 'Encroached Basin (4.81 Mcft lake capacity)',
        coords: [12.9784, 80.2185],
        vulnerability: 'Severe Risk (Lake storage capacity lost 75% to siltation)',
        currentDepth: 0.0,
        status: 'green'
      },
      {
        id: 'tnagar-mambalam',
        name: 'T. Nagar (Bazullah Rd / Mambalam Canal)',
        region: 'Central Chennai (Zone 10)',
        type: 'Commercial Arterial SWD',
        coords: [13.0418, 80.2341],
        vulnerability: 'Moderate Risk (Improved via desilted canal)',
        currentDepth: 0.0,
        status: 'green'
      },
      {
        id: 'omr-semmancheri',
        name: 'Semmancheri (OMR IT Corridor)',
        region: 'South Chennai (Zone 15)',
        type: 'Low-lying Wetland Plain',
        coords: [12.8710, 80.2260],
        vulnerability: 'High Risk (Runoff into Buckingham Canal)',
        currentDepth: 0.0,
        status: 'green'
      }
    ],

    // Navigation Corridors
    corridors: {
      south: {
        name: 'South Chennai: Nanganallur ➔ Guindy (Kathipara)',
        origin: [12.9820, 80.1910],
        destination: [13.0080, 80.2080],
        // Primary path: Direct through vulnerable Thillai Ganga Nagar Subway
        primaryPath: [
          [12.9820, 80.1910], // Nanganallur Market
          [12.9875, 80.1945], 
          [12.9934, 80.1984], // Thillai Ganga Nagar Subway (HOTSPOT)
          [13.0005, 80.2025], 
          [13.0080, 80.2080]  // Guindy Kathipara
        ],
        // Alternate Safe Elevated Overpass (GST Rd & Kathipara Grade Separator)
        alternatePath: [
          [12.9820, 80.1910], // Nanganallur
          [12.9840, 80.1830], 
          [12.9940, 80.1905], // GST Road (Elevated Highway)
          [13.0015, 80.1985], // Alandur Cement Road Overpass
          [13.0070, 80.2045], // Kathipara Cloverleaf Flyover
          [13.0080, 80.2080]  // Guindy Destination
        ],
        hotspotRef: 'subway-south'
      },
      north: {
        name: 'North Chennai: Perambur ➔ Chennai Central',
        origin: [13.1110, 80.2330],
        destination: [13.0827, 80.2707],
        // Primary path through Vyasarpadi Ganesapuram Subway
        primaryPath: [
          [13.1110, 80.2330], // Perambur
          [13.1105, 80.2480],
          [13.1091, 80.2625], // Ganesapuram Subway (HOTSPOT)
          [13.0950, 80.2680],
          [13.0827, 80.2707]  // Chennai Central
        ],
        // Alternate Safe Elevated Overpass (Stephenson Rd & Murasoli Maran Flyover)
        alternatePath: [
          [13.1110, 80.2330], // Perambur
          [13.1040, 80.2420], // Stephenson Road Flyover
          [13.0980, 80.2540], // Basin Bridge Elevated High Ground
          [13.0880, 80.2630], // Wall Tax Road Bypass
          [13.0827, 80.2707]  // Chennai Central
        ],
        hotspotRef: 'subway-north'
      }
    }
  };

  // =========================================================================
  // 2. STATE MANAGEMENT & VEHICLE CLEARANCE MATRIX
  // =========================================================================

  const state = {
    rainIntensity: 0,         // mm/hr (from IMD Doppler Radar)
    rainDuration: 0,          // Hours of continuous downpour
    currentCorridor: 'south', // 'south' or 'north'
    voiceEnabled: true,
    activeMode: 'jalmarg',    // 'jalmarg' (AI coupled) or 'google' (blind GPS)
    vehicleType: 'car',       // 'bike' (15cm), 'car' (25cm), 'ambulance' (60cm)

    // Vehicle Clearance Thresholds (Meters)
    clearanceThresholds: {
      bike: 0.15,       // 15 cm exhaust / wading limit
      car: 0.25,        // 25 cm sedan air-intake limit
      ambulance: 0.60   // 60 cm high-clearance emergency truck
    },

    // 500-Liter Stormwater Drain Catch-pit Physics
    sensor: {
      maxCapacity: 500,     // Liters
      alertThreshold: 450,  // 90% Threshold (Surcharge triggers warning)
      baseVolume: 120,      // Dry baseline
      currentVolume: 120,   // Liters
      waterDepthMeters: 0.0,
      status: 'green'       // 'green', 'orange', 'red'
    },

    // Macro Reservoir Data (Chennai 6 Units)
    reservoirs: {
      totalCapacity: 13222, // MCFT
      currentStorage: 5210, // MCFT (39.4% base)
      outflowRate: 150      // cusecs
    },

    rerouteActive: false
  };

  // =========================================================================
  // 3. INITIALIZE LEAFLET MAP & TILE SWITCHING (100% UNWATERMARKED)
  // =========================================================================

  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView(CHENNAI_DATA.center, CHENNAI_DATA.zoom);

  // Zoom control top-right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Defined High-Resolution Unwatermarked Tile Layers (100% compatible with file:// and web servers)
  const tileLayers = {
    osm: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }),
    esriSat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri'
    }),
    dark: L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri'
    })
  };

  // Start with Esri World Streets (Exact Chennai roads, landmarks, zero watermark, no 403 file:// blocks)
  let currentTileLayer = tileLayers.osm.addTo(map);

  // Layer Switcher Buttons
  const btnLayerOsm = document.getElementById('layer-osm');
  const btnLayerSat = document.getElementById('layer-esri-sat');
  const btnLayerDark = document.getElementById('layer-dark');

  function setTileLayer(name, activeBtn) {
    map.removeLayer(currentTileLayer);
    currentTileLayer = tileLayers[name].addTo(map);
    [btnLayerOsm, btnLayerSat, btnLayerDark].forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  btnLayerOsm.addEventListener('click', () => setTileLayer('osm', btnLayerOsm));
  btnLayerSat.addEventListener('click', () => setTileLayer('esriSat', btnLayerSat));
  btnLayerDark.addEventListener('click', () => setTileLayer('dark', btnLayerDark));

  // Feature Layers
  const gatewayLayer = L.layerGroup().addTo(map);
  const canalLayer = L.layerGroup().addTo(map);
  const hotspotLayer = L.layerGroup().addTo(map);
  const routeLayer = L.layerGroup().addTo(map);

  // Render Buckingham Canal Spine (Dotted Teal)
  L.polyline(CHENNAI_DATA.buckinghamCanal, {
    color: '#0d9488',
    weight: 3.5,
    dashArray: '6, 8',
    opacity: 0.85
  }).bindPopup('<strong>Buckingham Canal (Interceptor Spine)</strong><br>Links Kosasthalaiyar, Cooum & Adyar basins with sea backwaters.').addTo(canalLayer);

  // Render 4 Sea Exit Gateways
  CHENNAI_DATA.gateways.forEach(gw => {
    const marker = L.circleMarker(gw.coords, {
      radius: 9,
      fillColor: '#0d9488',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 0.95
    }).addTo(gatewayLayer);

    marker.bindPopup(`
      <div style="font-family: sans-serif; min-width: 190px;">
        <h4 style="margin:0 0 4px 0; color:#0f766e;">${gw.name}</h4>
        <p style="margin:0 0 4px 0; font-size:11px; color:#334155;"><strong>Basin:</strong> ${gw.basin}</p>
        <p style="margin:0; font-size:11px; color:#64748b;">${gw.desc}</p>
      </div>
    `);
  });

  // Hotspot Markers Dictionary
  const hotspotMarkers = {};

  function renderHotspotMarkers() {
    hotspotLayer.clearLayers();

    CHENNAI_DATA.hotspots.forEach(hp => {
      let pinColor = '#10b981';
      if (hp.status === 'orange') pinColor = '#f59e0b';
      if (hp.status === 'red') pinColor = '#ef4444';

      const customIcon = L.divIcon({
        className: 'custom-node-icon',
        html: `
          <div style="
            width: 22px; height: 22px; 
            border-radius: 50%; 
            background: ${pinColor}; 
            border: 2px solid #ffffff; 
            box-shadow: 0 0 10px ${pinColor}; 
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 10px; font-weight: bold;
          ">
            ${hp.status === 'red' ? '!' : '✓'}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker(hp.coords, { icon: customIcon }).addTo(hotspotLayer);
      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 210px; color:#0f172a;">
          <h4 style="margin:0 0 4px 0;">${hp.name}</h4>
          <span style="display:inline-block; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:bold; background:${pinColor}22; color:${pinColor}; border:1px solid ${pinColor};">
            STATUS: ${hp.status.toUpperCase()}
          </span>
          <p style="margin:6px 0 2px 0; font-size:11px;"><strong>Water Depth:</strong> ${(hp.currentDepth * 100).toFixed(0)} cm</p>
          <p style="margin:0; font-size:10px; color:#475569;">${hp.vulnerability}</p>
        </div>
      `);

      hotspotMarkers[hp.id] = marker;
    });
  }

  // =========================================================================
  // 4. DYNAMIC ROUTE RENDERING & GOOGLE MAPS COMPARISON
  // =========================================================================

  let primaryRouteLine = null;
  let alternateRouteLine = null;
  let originMarker = null;
  let destMarker = null;

  function updateRouteDisplay() {
    routeLayer.clearLayers();

    const corr = CHENNAI_DATA.corridors[state.currentCorridor];

    // Origin Marker (Green Pin)
    originMarker = L.circleMarker(corr.origin, {
      radius: 7,
      fillColor: '#10b981',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1
    }).bindPopup(`<strong>Origin:</strong> ${corr.name.split('➔')[0]}`).addTo(routeLayer);

    // Destination Marker (Purple Pin)
    destMarker = L.circleMarker(corr.destination, {
      radius: 7,
      fillColor: '#8b5cf6',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1
    }).bindPopup(`<strong>Destination:</strong> ${corr.name.split('➔')[1]}`).addTo(routeLayer);

    // CHECK VEHICLE CLEARANCE FOR REROUTING:
    // If water depth exceeds vehicle's threshold, it must trigger REROUTE!
    const limit = state.clearanceThresholds[state.vehicleType];
    const waterDepth = state.sensor.waterDepthMeters;
    const isVehicleImpassable = waterDepth > limit;

    // Is route flooded for this vehicle?
    const isFlooded = (state.sensor.status === 'red' || isVehicleImpassable) && state.sensor.status !== 'green';

    // -------------------------------------------------------------
    // IF IN GOOGLE MAPS MODE:
    // Google Maps is blind to water depth! It always keeps the direct subway route!
    // -------------------------------------------------------------
    if (state.activeMode === 'google') {
      state.rerouteActive = false;
      document.getElementById('google-maps-banner').classList.remove('hidden');

      // In Google Maps, traffic shows green/yellow despite deep water!
      primaryRouteLine = L.polyline(corr.primaryPath, {
        color: state.sensor.status === 'red' ? '#eab308' : '#10b981', // Yellow or Green
        weight: 6,
        opacity: 0.95
      }).addTo(routeLayer);

      primaryRouteLine.bindPopup(`
        <div style="font-family:sans-serif; min-width:200px; color:#0f172a;">
          <h4 style="color:#eab308; margin:0 0 4px 0;">Google Maps Route (Blind to Flood)</h4>
          <p style="margin:0; font-size:11px;">Direct subway route active. <strong>Warning:</strong> ${(waterDepth * 100).toFixed(0)} cm water present inside subway!</p>
        </div>
      `).openPopup();

      map.flyToBounds(primaryRouteLine.getBounds(), { padding: [60, 60], duration: 0.6 });
      updateNavigationBanner(false, waterDepth);
      return;
    }

    // -------------------------------------------------------------
    // FLOODCAST AI MODE:
    // Hydrological nowcasting couples drainage surcharge with proactive bypass!
    // -------------------------------------------------------------
    document.getElementById('google-maps-banner').classList.add('hidden');

    let primaryColor = '#10b981';
    let primaryClass = 'route-glow-green';

    if (state.sensor.status === 'orange') {
      primaryColor = '#f59e0b';
      primaryClass = 'route-glow-orange';
    } else if (isFlooded) {
      primaryColor = '#ef4444';
      primaryClass = 'route-glow-red';
    }

    primaryRouteLine = L.polyline(corr.primaryPath, {
      color: primaryColor,
      weight: 6,
      opacity: isFlooded ? 0.45 : 0.95,
      className: primaryClass
    }).addTo(routeLayer);

    // If flooded for this vehicle: Snap to Safe Elevated Flyover!
    if (isFlooded) {
      state.rerouteActive = true;

      alternateRouteLine = L.polyline(corr.alternatePath, {
        color: '#f59e0b',
        weight: 6,
        dashArray: '8, 8',
        opacity: 1,
        className: 'route-glow-amber'
      }).addTo(routeLayer);

      alternateRouteLine.bindPopup(`
        <div style="font-family:sans-serif; min-width:210px; color:#0f172a;">
          <h4 style="color:#b45309; margin:0 0 4px 0;">🛡️ PROACTIVE HIGH-GROUND REROUTE</h4>
          <p style="margin:0; font-size:11px;">Subway water depth (${(waterDepth * 100).toFixed(0)} cm) exceeds safe vehicle limit. Diverted via <strong>${state.currentCorridor === 'south' ? 'Kathipara / Alandur Flyover' : 'Basin Bridge Murasoli Maran Flyover'}</strong>.</p>
        </div>
      `).openPopup();

      map.flyToBounds(alternateRouteLine.getBounds(), { padding: [60, 60], duration: 0.8 });
    } else {
      state.rerouteActive = false;
      map.flyToBounds(primaryRouteLine.getBounds(), { padding: [60, 60], duration: 0.8 });
    }

    updateNavigationBanner(isFlooded, waterDepth);
  }

  // =========================================================================
  // 5. NAVIGATION BANNER & SPEECH SYNTHESIS ALERTS
  // =========================================================================

  let lastSpokenStatus = 'green';

  function updateNavigationBanner(isFlooded, depthMeters) {
    const corr = CHENNAI_DATA.corridors[state.currentCorridor];
    const banner = document.getElementById('nav-banner');
    const routeTitle = document.getElementById('nav-route-name');
    const statusPill = document.getElementById('nav-status-pill');
    const instruction = document.getElementById('nav-instruction-text');
    const eta = document.getElementById('nav-eta');
    const depthText = document.getElementById('nav-water-depth');
    const leadTime = document.getElementById('nav-lead-time');
    const avatar = document.getElementById('nav-avatar-icon');

    // Update vehicle icon
    if (state.vehicleType === 'bike') avatar.textContent = '🛵';
    else if (state.vehicleType === 'car') avatar.textContent = '🚗';
    else avatar.textContent = '🚑';

    routeTitle.textContent = corr.name.toUpperCase();
    depthText.innerHTML = `💧 Water: ${(depthMeters * 100).toFixed(0)} cm`;

    // Calculate Dynamic Time to Submerge
    let submergeMins = 0;
    if (state.rainIntensity > 0) {
      const remainingVolume = Math.max(0, 450 - state.sensor.currentVolume);
      submergeMins = Math.max(8, Math.round(remainingVolume / (state.rainIntensity * 0.15)));
    }

    // Google Maps mode banner state
    if (state.activeMode === 'google') {
      banner.classList.add('rerouted');
      statusPill.className = 'nav-status-badge orange';
      statusPill.textContent = 'GOOGLE MAPS: BLIND GPS ROUTE';
      instruction.innerHTML = `⚠️ <strong>Driving into subway.</strong> Google Maps detects no traffic stoppage, unaware of <strong>${(depthMeters * 100).toFixed(0)} cm flood water</strong> ahead!`;
      eta.innerHTML = '⏱️ ETA: 8 mins (Deceptive)';
      leadTime.innerHTML = '⚠️ Engine Stall Imminent';
      return;
    }

    // Jal-Marg AI Normal State
    if (!isFlooded && state.sensor.status === 'green') {
      banner.classList.remove('rerouted');
      statusPill.className = 'nav-status-badge green';
      statusPill.textContent = 'DIRECT ROUTE • SUBWAY DRY';
      instruction.innerHTML = `Proceed straight via <strong>${state.currentCorridor === 'south' ? 'Thillai Ganga Nagar Subway' : 'Ganesapuram Subway'}</strong>. Drainage clear.`;
      eta.innerHTML = '⏱️ ETA: 8 mins';
      leadTime.innerHTML = '⏳ Lead Time: Safe (>3h)';
      lastSpokenStatus = 'green';
    } 
    // Jal-Marg Warning State
    else if (!isFlooded && state.sensor.status === 'orange') {
      banner.classList.remove('rerouted');
      statusPill.className = 'nav-status-badge orange';
      statusPill.textContent = 'CAUTION • ADVISORY';
      instruction.innerHTML = `Water accumulation (15 cm) at <strong>${state.currentCorridor === 'south' ? 'Thillai Ganga Nagar' : 'Ganesapuram'} Subway</strong>. Reduce speed.`;
      eta.innerHTML = '⏱️ ETA: 12 mins';
      leadTime.innerHTML = `⏳ Est. Closure: ${submergeMins} mins`;

      if (lastSpokenStatus !== 'orange') {
        speakAlert(`Advisory: Rain accumulation started. Estimated ${submergeMins} minutes before subway closure.`);
        lastSpokenStatus = 'orange';
      }
    } 
    // Jal-Marg Proactive Reroute State
    else {
      banner.classList.add('rerouted');
      statusPill.className = 'nav-status-badge red';
      statusPill.textContent = '⛔ SUBWAY FLOODED • DETOUR';
      instruction.innerHTML = `🚨 <strong>SUBWAY INUNDATED (${(depthMeters * 100).toFixed(0)} cm).</strong> Dynamically rerouted via <strong>${state.currentCorridor === 'south' ? 'Kathipara / Alandur Elevated Overpass' : 'Basin Bridge Murasoli Maran Flyover'}</strong>.`;
      eta.innerHTML = '⏱️ ETA: 11 mins (+3m bypass)';
      leadTime.innerHTML = '🛡️ High-Ground Safe';

      if (lastSpokenStatus !== 'red') {
        triggerAudioToast(`PROACTIVE REROUTE: Subway water critical! Snapped to elevated overpass.`);
        speakAlert(`Warning: Subway is flooded. Rerouting your trip via the elevated flyover.`);
        lastSpokenStatus = 'red';
      }
    }
  }

  function triggerAudioToast(message) {
    const toast = document.getElementById('audio-toast');
    const msg = document.getElementById('toast-msg');
    msg.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4500);
  }

  function speakAlert(text) {
    if (!state.voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // =========================================================================
  // 6. HYDROLOGICAL COUPLING ENGINE & 500L CATCH-PIT PHYSICS
  // =========================================================================

  function calculateHydrology() {
    const I = state.rainIntensity;  // mm/hr
    const T = state.rainDuration;   // Hours
    const baseline = 120;           // Liters baseline in dry condition

    // Urban SWMM Surcharge Coupling Math:
    // Volume = Baseline + (Rainfall * Duration factor * Runoff Coeff) - Gravity Discharge
    const runoffCoefficient = 0.85; // Chennai paved impervious urban surface
    const gravityDischargeRate = 20; // L/hr baseline canal discharge

    let netWater = (I * Math.min(T, 4) * 4.2 * runoffCoefficient) - (T > 0 ? gravityDischargeRate : 0);
    let volume = Math.min(500, Math.max(120, baseline + netWater));

    state.sensor.currentVolume = Math.round(volume);
    const fillPercent = (volume / state.sensor.maxCapacity) * 100;

    // Realistic water depth inside depressed subway underpass (Meters)
    if (fillPercent < 60) {
      state.sensor.status = 'green';
      state.sensor.waterDepthMeters = 0.0;
    } else if (fillPercent < 85) {
      state.sensor.status = 'orange';
      state.sensor.waterDepthMeters = 0.16; // 16 cm (stops 2-wheelers, cars crawl)
    } else {
      state.sensor.status = 'red';
      state.sensor.waterDepthMeters = 0.42; // 42 cm (severe flood, stalls all sedans & hatchbacks)
    }

    // Update Hotspots State
    CHENNAI_DATA.hotspots.forEach(hp => {
      if (hp.id === 'subway-south' || hp.id === 'subway-north') {
        hp.status = state.sensor.status;
        hp.currentDepth = state.sensor.waterDepthMeters;
      } else if (hp.id === 'velachery-lake') {
        hp.status = fillPercent > 60 ? (fillPercent > 80 ? 'red' : 'orange') : 'green';
        hp.currentDepth = fillPercent > 80 ? 0.38 : 0.14;
      } else {
        hp.status = fillPercent > 75 ? (fillPercent > 90 ? 'red' : 'orange') : 'green';
        hp.currentDepth = fillPercent > 90 ? 0.30 : 0.10;
      }
    });

    // Update Macro Reservoirs
    if (state.rainDuration >= 24 && state.rainIntensity >= 60) {
      state.reservoirs.currentStorage = Math.min(13222, 5210 + (state.rainDuration * 160));
      state.reservoirs.outflowRate = 8500;
    } else {
      state.reservoirs.currentStorage = 5210 + (state.rainIntensity * 15);
      state.reservoirs.outflowRate = 250;
    }

    updateUI();
  }

  // =========================================================================
  // 7. UI SYNCHRONIZATION
  // =========================================================================

  function updateUI() {
    const vol = state.sensor.currentVolume;
    const max = state.sensor.maxCapacity;
    const pct = Math.round((vol / max) * 100);

    // 1. Top HUD Badges
    const radarDesc = state.rainIntensity === 0 ? '0 mm/hr (Clear)' : `${state.rainIntensity} mm/hr`;
    document.getElementById('disp-radar').textContent = radarDesc;
    document.getElementById('disp-drain-surcharge').textContent = `${pct}% (${vol}L)`;
    
    const drainDot = document.getElementById('chip-drain-dot');
    drainDot.className = `chip-dot ${state.sensor.status}`;

    const resPct = ((state.reservoirs.currentStorage / state.reservoirs.totalCapacity) * 100).toFixed(1);
    document.getElementById('disp-reservoir').textContent = `${resPct}% (${state.reservoirs.currentStorage.toLocaleString()} MCFT)`;

    // 2. Left Controller Surcharge Bar
    const fillBar = document.getElementById('surcharge-fill-bar');
    const fillText = document.getElementById('gauge-fill-text');
    const depthDisp = document.getElementById('sensor-water-depth');
    const drainStatus = document.getElementById('drain-status-text');
    const countdown = document.getElementById('countdown-submerge');

    fillBar.style.width = `${pct}%`;
    fillBar.className = `progress-bar-fill ${state.sensor.status}`;
    fillText.textContent = `${vol} L / 500 L (${pct}%)`;
    depthDisp.textContent = `${(state.sensor.waterDepthMeters * 100).toFixed(0)} cm`;

    if (state.sensor.status === 'green') {
      drainStatus.className = 'm-val safe';
      drainStatus.textContent = 'NORMAL FLOW';
      countdown.textContent = 'SAFE (>3h)';
    } else if (state.sensor.status === 'orange') {
      drainStatus.className = 'm-val warn';
      drainStatus.textContent = 'SURCHARGE 76%';
      const submergeMins = Math.max(8, Math.round((450 - vol) / (state.rainIntensity * 0.15)));
      countdown.textContent = `${submergeMins} MINS`;
    } else {
      drainStatus.className = 'm-val danger';
      drainStatus.textContent = 'OVERFLOW (95%)';
      countdown.textContent = 'SUBMERGED';
    }

    // Sliders
    document.getElementById('rain-rate-disp').textContent = `${state.rainIntensity} mm/hr`;
    document.getElementById('rain-hours-disp').textContent = `${state.rainDuration} ${state.rainDuration === 1 ? 'Hour' : 'Hours'}`;

    // 3. Drawer Hotspots & Gateways
    renderHotspotsDrawer();
    updateGatewaysFlow();

    // 4. Map Overlays & Route Lines
    renderHotspotMarkers();
    updateRouteDisplay();

    // 5. Update 2D Map Live Rain Canvas
    updateMapRain(state.rainIntensity);

    // 6. Update 3D Digital Twin Simulation
    if (twinSim && typeof twinSim.updateWaterAndRain === 'function') {
      twinSim.updateWaterAndRain(state.sensor.waterDepthMeters, state.rainIntensity, state.sensor.status, vol);
    }
  }

  function updateGatewaysFlow() {
    const flowEnnore = document.getElementById('flow-ennore');
    const flowCooum = document.getElementById('flow-cooum');
    const flowAdyar = document.getElementById('flow-adyar');
    const flowKovalam = document.getElementById('flow-kovalam');

    if (!flowEnnore) return;

    if (state.sensor.status === 'green') {
      flowEnnore.textContent = 'Normal Outflow'; flowEnnore.style.color = '#10b981';
      flowCooum.textContent = 'Normal Outflow'; flowCooum.style.color = '#10b981';
      flowAdyar.textContent = 'Normal Outflow'; flowAdyar.style.color = '#10b981';
      flowKovalam.textContent = 'Normal Outflow'; flowKovalam.style.color = '#10b981';
    } else if (state.sensor.status === 'orange') {
      flowEnnore.textContent = 'Rising Flow'; flowEnnore.style.color = '#f59e0b';
      flowCooum.textContent = 'High Runoff'; flowCooum.style.color = '#f59e0b';
      flowAdyar.textContent = 'Spill Inflow'; flowAdyar.style.color = '#f59e0b';
      flowKovalam.textContent = 'Swelling'; flowKovalam.style.color = '#f59e0b';
    } else {
      flowEnnore.textContent = 'High Tide Lock'; flowEnnore.style.color = '#ef4444';
      flowCooum.textContent = 'Near Crest Level'; flowCooum.style.color = '#ef4444';
      flowAdyar.textContent = '8,500 Cusecs Surplus'; flowAdyar.style.color = '#ef4444';
      flowKovalam.textContent = 'Tidal Influx Backflow'; flowKovalam.style.color = '#ef4444';
    }
  }

  function renderHotspotsDrawer() {
    const list = document.getElementById('hotspots-list');
    if (!list) return;
    list.innerHTML = '';

    CHENNAI_DATA.hotspots.forEach(hp => {
      const card = document.createElement('div');
      card.className = 'hotspot-card';
      card.innerHTML = `
        <div style="display:flex; flex-direction:column;">
          <strong style="color:#ffffff;">${hp.name}</strong>
          <small style="color:#94a3b8; font-size:10px;">${hp.region} • ${(hp.currentDepth * 100).toFixed(0)} cm water</small>
        </div>
        <span class="hotspot-status-dot ${hp.status}"></span>
      `;
      card.addEventListener('click', () => {
        map.flyTo(hp.coords, 14, { duration: 0.6 });
        if (hotspotMarkers[hp.id]) {
          hotspotMarkers[hp.id].openPopup();
        }
      });
      list.appendChild(card);
    });
  }

  // =========================================================================
  // 8. LOGS & CIVIC ACTION LOGIC
  // =========================================================================

  function addLog(type, text) {
    const terminal = document.getElementById('terminal-logs');
    if (!terminal) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    entry.textContent = `[${timeStr}] ${text}`;
    terminal.appendChild(entry);
    terminal.scrollTop = terminal.scrollHeight;
  }

  // =========================================================================
  // 9. EVENT LISTENERS & SIH PRESETS
  // =========================================================================

  // Sliders
  const rainSlider = document.getElementById('rain-slider');
  const hoursSlider = document.getElementById('hours-slider');

  rainSlider.addEventListener('input', (e) => {
    state.rainIntensity = parseInt(e.target.value);
    calculateHydrology();
    addLog('info', `IMD Doppler Radar: rainfall intensity updated to ${state.rainIntensity} mm/hr.`);
  });

  hoursSlider.addEventListener('input', (e) => {
    state.rainDuration = parseInt(e.target.value);
    calculateHydrology();
    addLog('info', `Rainfall duration accumulator updated to ${state.rainDuration} hours.`);
  });

  // Presets & Unified Scenario Controller
  const btnClear = document.getElementById('preset-clear');
  const btnRain2h = document.getElementById('preset-rain2h');
  const btnDeluge = document.getElementById('preset-deluge');

  function clearActivePresets() {
    [btnClear, btnRain2h, btnDeluge].forEach(b => { if (b) b.classList.remove('active'); });
  }

  function applyScenario(preset) {
    clearActivePresets();
    const twinBtnClear = document.getElementById('twin-btn-clear');
    const twinBtnRain = document.getElementById('twin-btn-rain');
    const twinBtnDeluge = document.getElementById('twin-btn-deluge');
    const twinRainSlider = document.getElementById('twin-rain-slider');
    const twinRainVal = document.getElementById('twin-rain-val');

    [twinBtnClear, twinBtnRain, twinBtnDeluge].forEach(b => { if (b) b.classList.remove('active'); });

    if (preset === 'clear') {
      if (btnClear) btnClear.classList.add('active');
      if (twinBtnClear) twinBtnClear.classList.add('active');
      state.rainIntensity = 0;
      state.rainDuration = 0;
      if (rainSlider) rainSlider.value = 0;
      if (hoursSlider) hoursSlider.value = 0;
      if (twinRainSlider) twinRainSlider.value = 0;
      if (twinRainVal) twinRainVal.textContent = '0 mm/hr';
      calculateHydrology();
      addLog('normal', 'SCENARIO 1: Dry conditions. Subways clear. Direct navigation route open.');
    } else if (preset === 'rain2h') {
      if (btnRain2h) btnRain2h.classList.add('active');
      if (twinBtnRain) twinBtnRain.classList.add('active');
      state.rainIntensity = 45;
      state.rainDuration = 2;
      if (rainSlider) rainSlider.value = 45;
      if (hoursSlider) hoursSlider.value = 2;
      if (twinRainSlider) twinRainSlider.value = 45;
      if (twinRainVal) twinRainVal.textContent = '45 mm/hr';
      calculateHydrology();
      addLog('warning', 'SCENARIO 2: 2h Continuous rain (45 mm/hr). Drain surcharge @ 76%. Advisory issued.');
    } else if (preset === 'deluge') {
      if (btnDeluge) btnDeluge.classList.add('active');
      if (twinBtnDeluge) twinBtnDeluge.classList.add('active');
      state.rainIntensity = 110;
      state.rainDuration = 48;
      if (rainSlider) rainSlider.value = 110;
      if (hoursSlider) hoursSlider.value = 48;
      if (twinRainSlider) twinRainSlider.value = 110;
      if (twinRainVal) twinRainVal.textContent = '110 mm/hr';
      calculateHydrology();
      addLog('danger', 'SCENARIO 3: 2-Day Deluge (110 mm/hr). Drain at 95% surcharge. Automated boom barrier deployed & dynamic flyover detour activated.');
    }
  }

  if (btnClear) btnClear.addEventListener('click', () => applyScenario('clear'));
  if (btnRain2h) btnRain2h.addEventListener('click', () => applyScenario('rain2h'));
  if (btnDeluge) btnDeluge.addEventListener('click', () => applyScenario('deluge'));

  // Vehicle Profile Selector
  const vehBtns = document.querySelectorAll('.btn-veh');
  vehBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      vehBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.vehicleType = btn.getAttribute('data-vehicle');
      addLog('info', `Vehicle profile changed to: ${state.vehicleType.toUpperCase()} (Wading limit: ${(state.clearanceThresholds[state.vehicleType] * 100)} cm)`);
      updateRouteDisplay();
    });
  });

  // Google Maps Mode vs FloodCast AI Toggle
  const btnModeJalmarg = document.getElementById('btn-mode-jalmarg');
  const btnModeGoogle = document.getElementById('btn-mode-google');

  btnModeJalmarg.addEventListener('click', () => {
    state.activeMode = 'jalmarg';
    btnModeJalmarg.classList.add('active');
    btnModeGoogle.classList.remove('active');
    addLog('normal', 'Switched to FLOODCAST AI Mode: Hydro-aware coupled predictive navigation active.');
    updateRouteDisplay();
  });

  btnModeGoogle.addEventListener('click', () => {
    state.activeMode = 'google';
    btnModeGoogle.classList.add('active');
    btnModeJalmarg.classList.remove('active');
    addLog('warning', 'Switched to GOOGLE MAPS Mode: Pure GPS speed routing (blind to 40cm water depth!).');
    updateRouteDisplay();
  });

  // Corridor Switcher (South Chennai vs North Chennai)
  const switchBtn = document.getElementById('switch-corridor');
  const corridorName = document.getElementById('corridor-name');

  switchBtn.addEventListener('click', () => {
    if (state.currentCorridor === 'south') {
      state.currentCorridor = 'north';
      corridorName.textContent = 'North Chennai';
      addLog('info', 'Active Corridor: North Chennai (Perambur ➔ Central via Ganesapuram Subway)');
    } else {
      state.currentCorridor = 'south';
      corridorName.textContent = 'South Chennai';
      addLog('info', 'Active Corridor: South Chennai (Nanganallur ➔ Guindy via Thillai Ganga Nagar Subway)');
    }
    updateRouteDisplay();
  });

  // Voice Toggle
  const voiceToggle = document.getElementById('voice-toggle');
  const voiceIcon = document.getElementById('voice-icon');

  voiceToggle.addEventListener('click', () => {
    state.voiceEnabled = !state.voiceEnabled;
    voiceIcon.textContent = state.voiceEnabled ? '🔊' : '🔇';
    voiceToggle.classList.toggle('active', state.voiceEnabled);
    addLog('info', `Audio voice alerts: ${state.voiceEnabled ? 'ON' : 'MUTED'}`);
  });

  // Drawer Toggles (ICCC Console)
  const icccDrawer = document.getElementById('iccc-drawer');
  const btnToggleIccc = document.getElementById('btn-toggle-iccc');
  const btnCloseIccc = document.getElementById('btn-close-iccc');

  btnToggleIccc.addEventListener('click', () => {
    icccDrawer.classList.toggle('open');
  });

  btnCloseIccc.addEventListener('click', () => {
    icccDrawer.classList.remove('open');
  });

  // Pitch Modal removed - civic view clean

  // Civic Emergency Actions in Drawer
  document.getElementById('btn-dispatch-pump').addEventListener('click', () => {
    addLog('system', 'GCC ACTION: 100HP trailer-mounted dewatering pump deployed to subway sump.');
    triggerAudioToast('100HP de-watering pump dispatched by GCC ICCC.');
  });

  document.getElementById('btn-close-subway').addEventListener('click', () => {
    addLog('danger', 'GCC OVERRIDE: Automated boom barrier lowered at subway entrance.');
    triggerAudioToast('Automated subway safety boom barrier lowered.');
  });

  document.getElementById('btn-sms-alert').addEventListener('click', () => {
    addLog('system', 'BROADCAST: Emergency flood alert SMS dispatched to 14,200 local commuters.');
    triggerAudioToast('Emergency SMS sent to 14,200 ward residents.');
  });

  document.getElementById('btn-clear-actions').addEventListener('click', () => {
    addLog('normal', 'SYSTEM RESET: Emergency override flags cleared. Standing by.');
  });

  // =========================================================================
  // 9. 2D MAP LIVE RAINFALL WEATHER OVERLAY
  // =========================================================================
  const rainCanvas = document.getElementById('map-rain-canvas');
  let rainCtx = null;
  const rainDrops = [];
  const MAX_RAIN_DROPS = 180;

  function initMapRainCanvas() {
    if (!rainCanvas) return;
    rainCtx = rainCanvas.getContext('2d');
    resizeRainCanvas();
    window.addEventListener('resize', resizeRainCanvas);

    for (let i = 0; i < MAX_RAIN_DROPS; i++) {
      rainDrops.push({
        x: Math.random() * (rainCanvas.width || 800),
        y: Math.random() * (rainCanvas.height || 600),
        len: 12 + Math.random() * 16,
        speed: 8 + Math.random() * 8
      });
    }

    animateRainCanvas();
  }

  function resizeRainCanvas() {
    if (!rainCanvas) return;
    rainCanvas.width = rainCanvas.offsetWidth;
    rainCanvas.height = rainCanvas.offsetHeight;
  }

  function animateRainCanvas() {
    if (!rainCtx || !rainCanvas) return;
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);

    if (state.rainIntensity > 0) {
      const activeCount = Math.min(MAX_RAIN_DROPS, Math.round((state.rainIntensity / 120) * MAX_RAIN_DROPS));
      rainCtx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      rainCtx.lineWidth = 1.3;
      rainCtx.beginPath();

      for (let i = 0; i < activeCount; i++) {
        const d = rainDrops[i];
        rainCtx.moveTo(d.x, d.y);
        rainCtx.lineTo(d.x - 3, d.y + d.len);

        d.y += d.speed * (0.6 + state.rainIntensity / 90);
        d.x -= 1.4;

        if (d.y > rainCanvas.height) {
          d.y = -20;
          d.x = Math.random() * (rainCanvas.width + 120);
        }
      }
      rainCtx.stroke();
    }

    requestAnimationFrame(animateRainCanvas);
  }

  function updateMapRain(intensity) {
    // Dynamic rain canvas picks up state.rainIntensity automatically
  }

  // =========================================================================
  // 10. 3D DIGITAL TWIN SUBWAY & HYDRAULIC INUNDATION ENGINE (THREE.JS)
  // =========================================================================
  let twinSim = null;

  function init3DTwinSimulation() {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js library is loading or offline');
      return;
    }

    const container = document.getElementById('twin-canvas-container');
    if (!container) return;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.012);

    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 1000);
    // Unobstructed 3/4 Isometric Perspective - frames cutting, floodwater, barrier, train and flyover
    camera.position.set(-20, 14, 25);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // ORBIT CONTROLS
    let controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI / 2.05;
      controls.minDistance = 8;
      controls.maxDistance = 75;
      controls.target.set(1.0, -0.6, 2);
      controls.update();
    }

    // LIGHTING SETUP
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
    sunLight.position.set(25, 40, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fillLight.position.set(-20, 25, -20);
    scene.add(fillLight);

    // Subway Underpass Floodlights (Illuminating the flooded road beneath the bridge)
    const subwayLight1 = new THREE.PointLight(0xfef08a, 2.0, 22);
    subwayLight1.position.set(-2.5, 2.8, 0);
    scene.add(subwayLight1);

    const subwayLight2 = new THREE.PointLight(0xfef08a, 2.0, 22);
    subwayLight2.position.set(2.5, 2.8, 0);
    scene.add(subwayLight2);

    // Portal Warning Beacons on entrance portal
    const warningBeaconL = new THREE.PointLight(0x10b981, 2.2, 14);
    warningBeaconL.position.set(-5.6, 2.2, 13);
    scene.add(warningBeaconL);

    const warningBeaconR = new THREE.PointLight(0x10b981, 2.2, 14);
    warningBeaconR.position.set(5.6, 2.2, 13);
    scene.add(warningBeaconR);

    // -------------------------------------------------------------
    // 3D GEOMETRY CONSTRUCTION (OPEN CUTTING - ROAD IS 100% VISIBLE)
    // -------------------------------------------------------------

    // 1. Terrain Ground Banks (Separated to leave a wide open cutting for the road)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

    // Left Ground Bank
    const groundLeft = new THREE.Mesh(new THREE.PlaneGeometry(55, 90), groundMat);
    groundLeft.rotation.x = -Math.PI / 2;
    groundLeft.position.set(-33.2, 0.5, 0);
    groundLeft.receiveShadow = true;
    scene.add(groundLeft);

    // Right Ground Bank
    const groundRight = new THREE.Mesh(new THREE.PlaneGeometry(55, 90), groundMat);
    groundRight.rotation.x = -Math.PI / 2;
    groundRight.position.set(33.2, 0.5, 0);
    groundRight.receiveShadow = true;
    scene.add(groundRight);

    // 2. Depressed Subway Roadway (Asphalt Surface inside cutting)
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });

    // Level bottom section of underpass (deepest part where water ponds)
    const roadFloor = new THREE.Mesh(new THREE.PlaneGeometry(10.6, 22), asphaltMat);
    roadFloor.rotation.x = -Math.PI / 2;
    roadFloor.position.set(0, -1.6, 0);
    roadFloor.receiveShadow = true;
    scene.add(roadFloor);

    // South Incline Ramp (slopes from y = 0.5 at z = 24 down to y = -1.6 at z = 11)
    const rampSouth = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.4, 15.5), asphaltMat);
    rampSouth.position.set(0, -0.55, 18.2);
    rampSouth.rotation.x = -0.145;
    rampSouth.receiveShadow = true;
    scene.add(rampSouth);

    // North Incline Ramp (slopes from y = -1.6 at z = -11 up to y = 0.5 at z = -24)
    const rampNorth = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.4, 15.5), asphaltMat);
    rampNorth.position.set(0, -0.55, -18.2);
    rampNorth.rotation.x = 0.145;
    rampNorth.receiveShadow = true;
    scene.add(rampNorth);

    // Road Markings (Yellow center divider line)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 21.5), lineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, -1.59, 0);
    scene.add(centerLine);

    // 3. Concrete Retaining Walls (Flanking the underpass)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.8, 48), wallMat);
    wallLeft.position.set(-5.7, -0.2, 0);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.8, 48), wallMat);
    wallRight.position.set(5.7, -0.2, 0);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    scene.add(wallRight);

    // 4. Elevated Flyover Bypass Viaduct (Kathipara Grade Separator Reroute)
    // Elevated above ground on the right side - demonstrates the safe high-ground alternative!
    const flyoverGroup = new THREE.Group();
    const flyoverDeckMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });

    const flyoverDeck = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.6, 52), flyoverDeckMat);
    flyoverDeck.position.set(13.5, 3.8, 0);
    flyoverDeck.castShadow = true;
    flyoverGroup.add(flyoverDeck);

    // Flyover center divider
    const flyoverLine = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 50), lineMat);
    flyoverLine.rotation.x = -Math.PI / 2;
    flyoverLine.position.set(13.5, 4.11, 0);
    flyoverGroup.add(flyoverLine);

    // Flyover guardrails
    const railMatAmber = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.4 });
    const fRailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 52), railMatAmber);
    fRailL.position.set(10.2, 4.3, 0);
    flyoverGroup.add(fRailL);

    const fRailR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 52), railMatAmber);
    fRailR.position.set(16.8, 4.3, 0);
    flyoverGroup.add(fRailR);

    // Cylindrical concrete piers supporting the flyover
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    [-18, -6, 6, 18].forEach(pz => {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 3.6, 16), pierMat);
      pier.position.set(13.5, 1.8, pz);
      pier.castShadow = true;
      flyoverGroup.add(pier);
    });

    scene.add(flyoverGroup);

    // 5. Automated Safety Boom Barrier at Subway Entrance (z = 13.5)
    const barrierGroup = new THREE.Group();
    const barrierPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 1.8, 12),
      new THREE.MeshStandardMaterial({ color: 0xd97706 })
    );
    barrierPost.position.set(5.1, 0.2, 13.5);
    barrierGroup.add(barrierPost);

    const barrierArmPivot = new THREE.Group();
    barrierArmPivot.position.set(5.0, 0.9, 13.5);

    const barrierArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.22, 9.6),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
    );
    barrierArm.position.set(-4.8, 0, 0);
    barrierArm.rotation.y = Math.PI / 2;
    barrierArmPivot.add(barrierArm);
    barrierGroup.add(barrierArmPivot);
    scene.add(barrierGroup);

    // 6. Overhead Railway Bridge (Slender 3.8m deck with open steel truss railings)
    const bridgeGroup = new THREE.Group();

    const bridgeDeck = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.4, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    bridgeDeck.position.set(0, 3.5, 0);
    bridgeDeck.castShadow = true;
    bridgeGroup.add(bridgeDeck);

    // Open Steel Truss Safety Railings
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
    [-1.85, 1.85].forEach(zPos => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(25, 0.3, 0.15), trussMat);
      g.position.set(0, 4.4, zPos);
      bridgeGroup.add(g);
      for (let x = -11; x <= 11; x += 2.5) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), trussMat);
        post.position.set(x, 4.0, zPos);
        bridgeGroup.add(post);
      }
    });

    // Dual Railway Tracks
    const steelRailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    [-1.1, -0.4, 0.4, 1.1].forEach(rz => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(32, 0.1, 0.1), steelRailMat);
      rail.position.set(0, 3.75, rz);
      bridgeGroup.add(rail);
    });

    // Railway wooden ties
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.9 });
    for (let x = -15; x <= 15; x += 1.0) {
      const tie1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 1.2), tieMat);
      tie1.position.set(x, 3.7, -0.75);
      bridgeGroup.add(tie1);

      const tie2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 1.2), tieMat);
      tie2.position.set(x, 3.7, 0.75);
      bridgeGroup.add(tie2);
    }

    // Indian Railways Clearance Warning Signboard
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, 0.6, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xd97706 })
    );
    signBoard.position.set(0, 3.25, 1.95);
    bridgeGroup.add(signBoard);

    scene.add(bridgeGroup);

    // 7. Animated Indian Railways Train (WAP-7 Electric Loco + Coaches)
    const trainGroup = new THREE.Group();

    // Electric Locomotive
    const loco = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 2.2, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.5, roughness: 0.3 })
    );
    loco.position.set(6.5, 4.9, 0.75);
    trainGroup.add(loco);

    // Locomotive Headlight Beam
    const locoHeadlight = new THREE.PointLight(0xffedd5, 2.5, 20);
    locoHeadlight.position.set(10.0, 5.0, 0.75);
    trainGroup.add(locoHeadlight);

    // Passenger Coaches
    [-0.8, -8.2].forEach(cx => {
      const coach = new THREE.Mesh(
        new THREE.BoxGeometry(7.0, 2.1, 1.7),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.4, roughness: 0.4 })
      );
      coach.position.set(cx, 4.85, 0.75);
      trainGroup.add(coach);
    });

    trainGroup.position.set(-35, 0, 0);
    scene.add(trainGroup);

    // 8. Underground Stormwater Drain (SWD) Micro-Sump Cutaway (500L IoT coupling)
    const sumpGroup = new THREE.Group();

    // Transparent acrylic sump tank
    const sumpBox = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 2.5, 5.5),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, transparent: true, opacity: 0.6, roughness: 0.5 })
    );
    sumpBox.position.set(0, -3.2, 0);
    sumpGroup.add(sumpBox);

    // Sump Water Mesh
    const sumpWaterGeo = new THREE.BoxGeometry(5.3, 1, 5.3);
    const sumpWaterMesh = new THREE.Mesh(
      sumpWaterGeo,
      new THREE.MeshStandardMaterial({ color: 0x059669, transparent: true, opacity: 0.8, roughness: 0.1 })
    );
    sumpWaterMesh.position.set(0, -4.1, 0);
    sumpGroup.add(sumpWaterMesh);

    // Centrifugal Pump Housing
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6, roughness: 0.3 });
    const pumpHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.1, 16), pumpMat);
    pumpHousing.position.set(1.5, -3.1, 0);
    sumpGroup.add(pumpHousing);

    // Spinning Impeller
    const impeller = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.1, 0.7),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    impeller.position.set(1.5, -3.6, 0);
    sumpGroup.add(impeller);

    // Discharge Pipe
    const dischargePipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 })
    );
    dischargePipe.rotation.z = Math.PI / 2;
    dischargePipe.position.set(7.8, -2.9, 0);
    sumpGroup.add(dischargePipe);

    scene.add(sumpGroup);

    // 9. Surface Flood Water Inundation Mesh (Inside Underpass)
    const floodWaterGeo = new THREE.BoxGeometry(10.5, 1, 22);
    const floodWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.82,
      roughness: 0.08,
      metalness: 0.25
    });
    const floodWaterMesh = new THREE.Mesh(floodWaterGeo, floodWaterMat);
    floodWaterMesh.position.set(0, -1.6, 0);
    floodWaterMesh.scale.set(1, 0.01, 1);
    scene.add(floodWaterMesh);

    // 10. Calibrated Depth Measuring Ruler (Metric Gauging Pole)
    const rulerGroup = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3.0, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    pole.position.set(4.8, -0.3, 1.5);
    rulerGroup.add(pole);

    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    b1.position.set(4.8, -1.4, 1.5); // 15cm Green (Safe)
    rulerGroup.add(b1);

    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 12), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    b2.position.set(4.8, -1.2, 1.5); // 25cm Amber (Caution)
    rulerGroup.add(b2);

    const b3 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    b3.position.set(4.8, -0.85, 1.5); // 45cm Red (Flooded)
    rulerGroup.add(b3);

    scene.add(rulerGroup);

    // 11. ANIMATED VEHICLES FLEET
    const vehiclesGroup = new THREE.Group();
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);

    // VEHICLE A: Approaching Moving White Sedan
    const movingCar = new THREE.Group();
    const car1Body = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.7, 4.2),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.4 })
    );
    car1Body.position.set(0, 0.55, 0);
    movingCar.add(car1Body);

    const car1Cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 })
    );
    car1Cabin.position.set(0, 1.15, -0.2);
    movingCar.add(car1Cabin);

    [[-1.0, 1.3], [1.0, 1.3], [-1.0, -1.3], [1.0, -1.3]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.35, wz);
      movingCar.add(w);
    });

    // Headlights
    const carHeadlight = new THREE.PointLight(0xffedd5, 1.6, 14);
    carHeadlight.position.set(0, 0.6, -2.2);
    movingCar.add(carHeadlight);

    // Amber Turn Signal Blinker
    const carBlinkerR = new THREE.PointLight(0xf59e0b, 0, 8);
    carBlinkerR.position.set(1.0, 0.6, -2.1);
    movingCar.add(carBlinkerR);

    movingCar.position.set(-2.0, 0.3, 25);
    vehiclesGroup.add(movingCar);

    // VEHICLE B: Stranded Blue Sedan (Directly visible in puddle in front of bridge)
    const strandedCar = new THREE.Group();
    const car2Body = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.7, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.5, roughness: 0.3 })
    );
    car2Body.position.set(0, 0.55, 0);
    strandedCar.add(car2Body);

    const car2Cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x172554, roughness: 0.2 })
    );
    car2Cabin.position.set(0, 1.15, -0.2);
    strandedCar.add(car2Cabin);

    [[-1.0, 1.3], [1.0, 1.3], [-1.0, -1.3], [1.0, -1.3]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.35, wz);
      strandedCar.add(w);
    });

    // Stranded Hazard Flashers (Flashing Amber)
    const strandedHazardL = new THREE.PointLight(0xf59e0b, 0, 8);
    strandedHazardL.position.set(-1.0, 0.6, 2.1);
    strandedCar.add(strandedHazardL);

    const strandedHazardR = new THREE.PointLight(0xf59e0b, 0, 8);
    strandedHazardR.position.set(1.0, 0.6, 2.1);
    strandedCar.add(strandedHazardR);

    strandedCar.position.set(-2.2, -1.55, 4.0); // Placed at z = 4.0 in full view
    vehiclesGroup.add(strandedCar);

    // VEHICLE C: Emergency Rescue Ambulance (Traveling on safe elevated flyover bypass)
    const ambGroup = new THREE.Group();
    const ambBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.6, 5.0),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
    );
    ambBody.position.set(0, 1.1, 0);
    ambGroup.add(ambBody);

    const redCross = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    redCross.position.set(1.12, 1.2, 0);
    ambGroup.add(redCross);

    [[-1.1, 1.6], [1.1, 1.6], [-1.1, -1.6], [1.1, -1.6]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.28, 16), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.45, wz);
      ambGroup.add(w);
    });

    // Flashing Emergency Strobe Lights (Red / Blue)
    const ambStrobeL = new THREE.PointLight(0xef4444, 2.5, 12);
    ambStrobeL.position.set(-0.6, 2.1, 0.6);
    ambGroup.add(ambStrobeL);

    const ambStrobeR = new THREE.PointLight(0x3b82f6, 2.5, 12);
    ambStrobeR.position.set(0.6, 2.1, 0.6);
    ambGroup.add(ambStrobeR);

    ambGroup.position.set(13.5, 4.1, 5); // On elevated bypass flyover!
    vehiclesGroup.add(ambGroup);

    scene.add(vehiclesGroup);

    // 12. REALISTIC 3D RAIN LINE STREAKS
    const RAIN_STREAK_COUNT = 1200;
    const rainPositions = new Float32Array(RAIN_STREAK_COUNT * 6);

    for (let i = 0; i < RAIN_STREAK_COUNT; i++) {
      const rx = (Math.random() - 0.5) * 65;
      const ry = Math.random() * 26 + 1;
      const rz = (Math.random() - 0.5) * 65;

      rainPositions[i * 6] = rx;
      rainPositions[i * 6 + 1] = ry;
      rainPositions[i * 6 + 2] = rz;

      rainPositions[i * 6 + 3] = rx - 0.22;
      rainPositions[i * 6 + 4] = ry - 1.8;
      rainPositions[i * 6 + 5] = rz - 0.15;
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    const rainMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0,
      linewidth: 1.5
    });

    const rainMesh = new THREE.LineSegments(rainGeo, rainMat);
    scene.add(rainMesh);

    // Expanding Surface Water Splashes
    const splashRings = [];
    const splashGeo = new THREE.RingGeometry(0.1, 0.35, 16);
    const splashMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0, side: THREE.DoubleSide });

    for (let s = 0; s < 18; s++) {
      const ring = new THREE.Mesh(splashGeo, splashMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.visible = false;
      scene.add(ring);
      splashRings.push({ mesh: ring, age: Math.floor(Math.random() * 24) });
    }

    // Dynamic Variables
    let currentWaterDepth = 0;
    let targetWaterDepth = 0;
    let rainIntensity = 0;
    let isPumpRunning = false;
    let movingCarZ = 25;
    let movingCarSpeed = 0.16;

    // ANIMATION RENDER LOOP
    let animId = null;
    function animate() {
      animId = requestAnimationFrame(animate);

      if (controls) controls.update();

      const time = Date.now() * 0.003;

      // Smooth hydraulic water depth interpolation
      currentWaterDepth += (targetWaterDepth - currentWaterDepth) * 0.045;

      // Surface flood water height and ripple effect
      const depthYScale = Math.max(0.01, currentWaterDepth * 2.8);
      floodWaterMesh.scale.y = depthYScale;
      floodWaterMesh.position.y = -1.6 + (depthYScale / 2);
      floodWaterMesh.position.z = Math.sin(time * 0.8) * 0.05;

      // Sump water level
      sumpWaterMesh.scale.y = Math.min(2.3, 0.4 + (currentWaterDepth * 2.5));
      sumpWaterMesh.position.y = -4.3 + (sumpWaterMesh.scale.y / 2);

      // Centrifugal pump impeller rotation
      if (isPumpRunning) {
        impeller.rotation.y += 0.5;
        if (targetWaterDepth > 0) {
          targetWaterDepth = Math.max(0, targetWaterDepth - 0.006);
        }
      }

      // 1. ANIMATE INDIAN RAILWAYS TRAIN ACROSS BRIDGE
      trainGroup.position.x += 0.14;
      if (trainGroup.position.x > 45) {
        trainGroup.position.x = -45;
      }

      // 2. ANIMATE MOVING TRAFFIC & DYNAMIC REROUTING
      if (currentWaterDepth < 0.25) {
        // DRY / PASSABLE: Automated barrier is UP! Car drives through subway
        barrierArmPivot.rotation.z = Math.PI / 2.3;
        carBlinkerR.intensity = 0;

        movingCarZ -= movingCarSpeed;
        if (movingCarZ < -26) {
          movingCarZ = 26; // Loop back around
        }

        // Calculate elevation matching the road ramp slopes
        let carY = -1.55;
        if (movingCarZ > 11) carY = -1.55 + (movingCarZ - 11) * 0.145;
        else if (movingCarZ < -11) carY = -1.55 + (-11 - movingCarZ) * 0.145;

        movingCar.position.set(-2.0, carY, movingCarZ);
        movingCar.rotation.y = 0;
      } else {
        // FLOODED (>25cm): Automated barrier is DOWN! Car STOPS and diverts to flyover
        barrierArmPivot.rotation.z = 0;

        if (movingCarZ > 14.5) {
          movingCarZ -= movingCarSpeed;
          movingCar.position.set(-2.0, -1.55 + (movingCarZ - 11) * 0.145, movingCarZ);
          movingCar.rotation.y = 0;
        } else {
          // Stopped before the barrier: right amber turn signal flashes and car veers towards flyover
          const blink = Math.sin(time * 10) > 0;
          carBlinkerR.intensity = blink ? 2.5 : 0;
          movingCar.rotation.y = 0.38;
        }
      }

      // 3. ANIMATE STRANDED BLUE CAR IN FLOODWATER
      if (currentWaterDepth >= 0.15) {
        const blink = Math.sin(time * 8) > 0;
        strandedHazardL.intensity = blink ? 2.8 : 0;
        strandedHazardR.intensity = blink ? 2.8 : 0;
        strandedCar.position.y = -1.55 + Math.min(0.25, currentWaterDepth * 0.35) + Math.sin(time * 3) * 0.015;
      } else {
        strandedHazardL.intensity = 0;
        strandedHazardR.intensity = 0;
        strandedCar.position.y = -1.55;
      }

      // 4. ANIMATE AMBULANCE EMERGENCY STROBES
      const strobe = Math.sin(time * 14);
      ambStrobeL.intensity = strobe > 0 ? 3.0 : 0.2;
      ambStrobeR.intensity = strobe <= 0 ? 3.0 : 0.2;

      // 5. ANIMATE 3D RAIN STREAKS & SPLASHES
      if (rainIntensity > 0) {
        rainMat.opacity = Math.min(0.85, 0.3 + (rainIntensity / 100) * 0.55);
        const pos = rainGeo.attributes.position.array;
        const fallSpeed = 0.5 + (rainIntensity / 80) * 0.7;

        for (let i = 0; i < RAIN_STREAK_COUNT; i++) {
          const idx = i * 6;
          pos[idx + 1] -= fallSpeed;
          pos[idx + 4] -= fallSpeed;

          if (pos[idx + 1] < -1.8) {
            const rx = (Math.random() - 0.5) * 65;
            const ry = 26 + Math.random() * 4;
            const rz = (Math.random() - 0.5) * 65;
            pos[idx] = rx;
            pos[idx + 1] = ry;
            pos[idx + 2] = rz;
            pos[idx + 3] = rx - 0.22;
            pos[idx + 4] = ry - 1.8;
            pos[idx + 5] = rz - 0.15;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;

        // Animate splash rings
        splashRings.forEach(sr => {
          sr.age += 1;
          if (sr.age > 22) {
            sr.age = 0;
            sr.mesh.position.set((Math.random() - 0.5) * 8.5, -1.58 + Math.max(0, currentWaterDepth * 2.8), (Math.random() - 0.5) * 18);
            sr.mesh.scale.set(0.2, 0.2, 0.2);
            sr.mesh.visible = true;
          } else {
            const factor = sr.age / 22;
            sr.mesh.scale.set(1 + factor * 2.6, 1 + factor * 2.6, 1);
            sr.mesh.material.opacity = Math.max(0, 0.7 * (1 - factor));
          }
        });
      } else {
        rainMat.opacity = 0;
        splashRings.forEach(sr => { sr.mesh.visible = false; });
      }

      // 6. PORTAL WARNING BEACONS (Green -> Amber -> Flashing Red)
      if (currentWaterDepth >= 0.25) {
        const flash = Math.sin(time * 12) > 0;
        warningBeaconL.color.setHex(flash ? 0xef4444 : 0x450a0a);
        warningBeaconR.color.setHex(flash ? 0xef4444 : 0x450a0a);
        warningBeaconL.intensity = flash ? 3.5 : 0.2;
        warningBeaconR.intensity = flash ? 3.5 : 0.2;
      } else if (currentWaterDepth >= 0.15) {
        warningBeaconL.color.setHex(0xf59e0b);
        warningBeaconR.color.setHex(0xf59e0b);
        warningBeaconL.intensity = 1.8;
        warningBeaconR.intensity = 1.8;
      } else {
        warningBeaconL.color.setHex(0x10b981);
        warningBeaconR.color.setHex(0x10b981);
        warningBeaconL.intensity = 1.2;
        warningBeaconR.intensity = 1.2;
      }

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onResize);

    // TWIN SIM INTERFACE
    twinSim = {
      updateWaterAndRain(depthMeters, rainRate, status, volumeL) {
        targetWaterDepth = depthMeters;
        rainIntensity = rainRate;

        const depthVal = document.getElementById('twin-depth-val');
        const statusBadge = document.getElementById('twin-status-badge');
        const rainBadge = document.getElementById('twin-disp-rain');

        if (depthVal) depthVal.textContent = `${(depthMeters * 100).toFixed(0)}`;
        if (rainBadge) rainBadge.textContent = `${rainRate} mm/hr`;

        if (statusBadge) {
          if (status === 'green') {
            statusBadge.textContent = 'PASSABLE (<10cm)';
            statusBadge.className = 'gauge-status safe';
          } else if (status === 'orange') {
            statusBadge.textContent = 'CAUTION (16cm)';
            statusBadge.className = 'gauge-status warning';
          } else {
            statusBadge.textContent = 'SUBWAY FLOODED';
            statusBadge.className = 'gauge-status danger';
          }
        }

        // Update Vehicle Clearance Badges in 3D HUD
        const statBike = document.getElementById('tv-stat-bike');
        const statCar = document.getElementById('tv-stat-car');
        const statAmb = document.getElementById('tv-stat-amb');

        if (statBike) {
          if (depthMeters >= 0.15) {
            statBike.textContent = 'Stalled (>15cm)'; statBike.className = 'tv-stat danger';
          } else {
            statBike.textContent = 'Safe (<15cm)'; statBike.className = 'tv-stat safe';
          }
        }

        if (statCar) {
          if (depthMeters >= 0.25) {
            statCar.textContent = 'Intake Submerged (>25cm)'; statCar.className = 'tv-stat danger';
          } else if (depthMeters >= 0.15) {
            statCar.textContent = 'Advisory Crawl (15cm)'; statCar.className = 'tv-stat warn';
          } else {
            statCar.textContent = 'Safe (<25cm)'; statCar.className = 'tv-stat safe';
          }
        }

        if (statAmb) {
          if (depthMeters >= 0.60) {
            statAmb.textContent = 'Critical (>60cm)'; statAmb.className = 'tv-stat danger';
          } else if (depthMeters >= 0.45) {
            statAmb.textContent = 'Extreme (45cm)'; statAmb.className = 'tv-stat warn';
          } else {
            statAmb.textContent = 'Safe (<45cm)'; statAmb.className = 'tv-stat safe';
          }
        }
      },

      setCameraView(type) {
        if (!controls) return;
        if (type === 'orbit') {
          camera.position.set(-20, 14, 25);
          controls.target.set(1.0, -0.6, 2);
        } else if (type === 'driver') {
          // Driver's eye level behind steering wheel
          camera.position.set(-2.0, -0.2, 8);
          controls.target.set(-2.0, -1.0, -12);
        } else if (type === 'cutaway') {
          // Profile cutaway showing road dip, floodwater and underground sump
          camera.position.set(24, -0.2, 0);
          controls.target.set(0, -2.2, 0);
        }
        controls.update();
      },

      resetCamera() {
        if (!controls) return;
        camera.position.set(-20, 14, 25);
        controls.target.set(1.0, -0.6, 2);
        controls.update();
      },

      togglePump() {
        isPumpRunning = !isPumpRunning;
        const btn = document.getElementById('btn-twin-pump');
        const stateTxt = document.getElementById('twin-pump-state');
        if (btn && stateTxt) {
          btn.classList.toggle('running', isPumpRunning);
          stateTxt.textContent = isPumpRunning ? 'RUNNING (DISCHARGING 3,800 LPM)' : 'STANDBY';
        }
      },

      resize() {
        onResize();
      }
    };
  }

  // =========================================================================
  // 11. 3D DIGITAL TWIN MODAL WIRING & INTERACTIVITY
  // =========================================================================
  const twinModal = document.getElementById('twin-modal');
  const btnToggle3D = document.getElementById('btn-toggle-3d');
  const btnOpen3DHud = document.getElementById('btn-open-3d-hud');
  const btnClose3D = document.getElementById('btn-close-3d');

  function open3DModal() {
    if (!twinModal) return;
    twinModal.classList.remove('hidden');

    const subwayName = document.getElementById('twin-subway-name');
    if (subwayName) {
      subwayName.textContent = state.currentCorridor === 'south'
        ? 'Thillai Ganga Nagar Subway (South Chennai - Zone 12)'
        : 'Ganesapuram Subway (North Chennai - Vyasarpadi)';
    }

    // Sync 3D scenario buttons and slider with current state
    const twinBtnClear = document.getElementById('twin-btn-clear');
    const twinBtnRain = document.getElementById('twin-btn-rain');
    const twinBtnDeluge = document.getElementById('twin-btn-deluge');
    const twinRainSlider = document.getElementById('twin-rain-slider');
    const twinRainVal = document.getElementById('twin-rain-val');

    if (twinRainSlider) twinRainSlider.value = state.rainIntensity;
    if (twinRainVal) twinRainVal.textContent = `${state.rainIntensity} mm/hr`;

    [twinBtnClear, twinBtnRain, twinBtnDeluge].forEach(b => { if (b) b.classList.remove('active'); });
    if (state.rainIntensity === 0 && twinBtnClear) twinBtnClear.classList.add('active');
    else if (state.rainIntensity <= 60 && twinBtnRain) twinBtnRain.classList.add('active');
    else if (twinBtnDeluge) twinBtnDeluge.classList.add('active');

    setTimeout(() => {
      if (!twinSim) {
        init3DTwinSimulation();
      }
      if (twinSim) {
        twinSim.resetCamera();
        twinSim.resize();
        twinSim.updateWaterAndRain(state.sensor.waterDepthMeters, state.rainIntensity, state.sensor.status, state.sensor.currentVolume);
      }
    }, 60);
  }

  function close3DModal() {
    if (twinModal) twinModal.classList.add('hidden');
  }

  if (btnToggle3D) btnToggle3D.addEventListener('click', open3DModal);
  if (btnOpen3DHud) btnOpen3DHud.addEventListener('click', open3DModal);
  if (btnClose3D) btnClose3D.addEventListener('click', close3DModal);

  // Close on backdrop click
  if (twinModal) {
    twinModal.addEventListener('click', (e) => {
      if (e.target === twinModal) close3DModal();
    });
  }

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && twinModal && !twinModal.classList.contains('hidden')) {
      close3DModal();
    }
  });

  // Camera Presets
  const camOrbit = document.getElementById('cam-orbit');
  const camDriver = document.getElementById('cam-driver');
  const camCutaway = document.getElementById('cam-cutaway');

  function setCamActive(activeBtn, view) {
    [camOrbit, camDriver, camCutaway].forEach(b => { if (b) b.classList.remove('active'); });
    if (activeBtn) activeBtn.classList.add('active');
    if (twinSim) twinSim.setCameraView(view);
  }

  if (camOrbit) camOrbit.addEventListener('click', () => setCamActive(camOrbit, 'orbit'));
  if (camDriver) camDriver.addEventListener('click', () => setCamActive(camDriver, 'driver'));
  if (camCutaway) camCutaway.addEventListener('click', () => setCamActive(camCutaway, 'cutaway'));

  // 3D Studio Scenario Buttons - Now wired to unified applyScenario!
  const twinBtnClear = document.getElementById('twin-btn-clear');
  const twinBtnRain = document.getElementById('twin-btn-rain');
  const twinBtnDeluge = document.getElementById('twin-btn-deluge');

  if (twinBtnClear) twinBtnClear.addEventListener('click', () => applyScenario('clear'));
  if (twinBtnRain) twinBtnRain.addEventListener('click', () => applyScenario('rain2h'));
  if (twinBtnDeluge) twinBtnDeluge.addEventListener('click', () => applyScenario('deluge'));

  // 3D Studio Pump Trigger
  const btnTwinPump = document.getElementById('btn-twin-pump');
  if (btnTwinPump) {
    btnTwinPump.addEventListener('click', () => {
      if (twinSim) twinSim.togglePump();
    });
  }

  // 3D Studio Rain Slider
  const twinRainSlider = document.getElementById('twin-rain-slider');
  if (twinRainSlider) {
    twinRainSlider.addEventListener('input', (e) => {
      state.rainIntensity = parseInt(e.target.value, 10);
      const rainSlider = document.getElementById('rain-slider');
      if (rainSlider) rainSlider.value = state.rainIntensity;
      const twinRainVal = document.getElementById('twin-rain-val');
      if (twinRainVal) twinRainVal.textContent = `${state.rainIntensity} mm/hr`;
      calculateHydrology();
    });
  }

  // Initial Execution
  initMapRainCanvas();
  calculateHydrology();
  addLog('system', 'FloodCast AI engine initialized. MoES SIH-26085 prototype active.');
});
