/**
 * CHENNAI JAL-MARG: EXECUTIVE COMPACT ENGINE (SIH 2026 - MoES SIH-26085)
 * Urban Flood Nowcasting, Drainage-Rainfall Coupling & Dynamic Traffic Rerouting
 * Zero Watermarks • OpenStreetMap / Esri Tile Layers • Vehicle Clearance Matrix
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
    // JAL-MARG AI MODE:
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

  // Presets
  const btnClear = document.getElementById('preset-clear');
  const btnRain2h = document.getElementById('preset-rain2h');
  const btnDeluge = document.getElementById('preset-deluge');

  function clearActivePresets() {
    [btnClear, btnRain2h, btnDeluge].forEach(b => b.classList.remove('active'));
  }

  btnClear.addEventListener('click', () => {
    clearActivePresets();
    btnClear.classList.add('active');
    state.rainIntensity = 0;
    state.rainDuration = 0;
    rainSlider.value = 0;
    hoursSlider.value = 0;
    calculateHydrology();
    addLog('normal', 'SCENARIO 1: Dry conditions. Subways clear. Direct navigation route open.');
  });

  btnRain2h.addEventListener('click', () => {
    clearActivePresets();
    btnRain2h.classList.add('active');
    state.rainIntensity = 45;
    state.rainDuration = 2;
    rainSlider.value = 45;
    hoursSlider.value = 2;
    calculateHydrology();
    addLog('warning', 'SCENARIO 2: 2h Continuous rain (45 mm/hr). Drain surcharge @ 76%. Advisory issued.');
  });

  btnDeluge.addEventListener('click', () => {
    clearActivePresets();
    btnDeluge.classList.add('active');
    state.rainIntensity = 110;
    state.rainDuration = 48;
    rainSlider.value = 110;
    hoursSlider.value = 48;
    calculateHydrology();
    addLog('danger', 'SCENARIO 3: 2-Day Deluge (110 mm/hr). Drain at 95% surcharge. Automated boom barrier deployed & dynamic flyover detour activated.');
  });

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

  // Google Maps Mode vs Jal-Marg AI Toggle
  const btnModeJalmarg = document.getElementById('btn-mode-jalmarg');
  const btnModeGoogle = document.getElementById('btn-mode-google');

  btnModeJalmarg.addEventListener('click', () => {
    state.activeMode = 'jalmarg';
    btnModeJalmarg.classList.add('active');
    btnModeGoogle.classList.remove('active');
    addLog('normal', 'Switched to JAL-MARG AI Mode: Hydro-aware coupled predictive navigation active.');
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
    scene.background = new THREE.Color(0x0a101d); // Deep moody atmospheric backdrop
    scene.fog = new THREE.FogExp2(0x0a101d, 0.018);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(24, 18, 28);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // ORBIT CONTROLS
    let controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2.05;
      controls.minDistance = 6;
      controls.maxDistance = 85;
      controls.target.set(0, 0, 0);
    }

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(22, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Subway Underpass Floodlights (Illuminating the flooded road)
    const subwayLight1 = new THREE.PointLight(0xfef08a, 1.6, 25);
    subwayLight1.position.set(-3, 3.2, 0);
    scene.add(subwayLight1);

    const subwayLight2 = new THREE.PointLight(0xfef08a, 1.6, 25);
    subwayLight2.position.set(3, 3.2, 0);
    scene.add(subwayLight2);

    // Warning Strobe Beacons on Portal
    const warningBeaconL = new THREE.PointLight(0x10b981, 2, 15);
    warningBeaconL.position.set(-5.5, 3.8, 4.2);
    scene.add(warningBeaconL);

    const warningBeaconR = new THREE.PointLight(0x10b981, 2, 15);
    warningBeaconR.position.set(5.5, 3.8, 4.2);
    scene.add(warningBeaconR);

    // -------------------------------------------------------------
    // 3D GEOMETRY CONSTRUCTION
    // -------------------------------------------------------------

    // 1. Terrain Ground Base (Surrounding Ground Level at Y = 1.0)
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 1.0;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Depressed Subway Roadway
    const floorGeo = new THREE.BoxGeometry(11, 0.5, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const subwayFloor = new THREE.Mesh(floorGeo, floorMat);
    subwayFloor.position.set(0, -1.8, 0);
    subwayFloor.receiveShadow = true;
    scene.add(subwayFloor);

    // South Incline Ramp
    const rampSouthGeo = new THREE.BoxGeometry(11, 0.5, 26);
    const rampSouth = new THREE.Mesh(rampSouthGeo, floorMat);
    rampSouth.position.set(0, -0.4, 27);
    rampSouth.rotation.x = -0.11;
    rampSouth.receiveShadow = true;
    scene.add(rampSouth);

    // North Incline Ramp
    const rampNorthGeo = new THREE.BoxGeometry(11, 0.5, 26);
    const rampNorth = new THREE.Mesh(rampNorthGeo, floorMat);
    rampNorth.position.set(0, -0.4, -27);
    rampNorth.rotation.x = 0.11;
    rampNorth.receiveShadow = true;
    scene.add(rampNorth);

    // Road Markings (Yellow center line)
    const dividerGeo = new THREE.PlaneGeometry(0.35, 28);
    const dividerMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const divider = new THREE.Mesh(dividerGeo, dividerMat);
    divider.rotation.x = -Math.PI / 2;
    divider.position.set(0, -1.54, 0);
    scene.add(divider);

    // 3. Concrete Retaining Walls
    const wallGeo = new THREE.BoxGeometry(1, 4.0, 32);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });

    const wallLeft = new THREE.Mesh(wallGeo, wallMat);
    wallLeft.position.set(-5.6, 0.2, 0);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);

    const wallRight = new THREE.Mesh(wallGeo, wallMat);
    wallRight.position.set(5.6, 0.2, 0);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    scene.add(wallRight);

    // 4. Overhead Railway Embankment & Steel Bridge
    const bridgeGroup = new THREE.Group();

    // Heavy concrete bridge deck
    const deckGeo = new THREE.BoxGeometry(20, 1.2, 8);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const bridgeDeck = new THREE.Mesh(deckGeo, deckMat);
    bridgeDeck.position.set(0, 3.4, 0);
    bridgeDeck.castShadow = true;
    bridgeGroup.add(bridgeDeck);

    // Steel Girders
    const girderMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 });
    const girder1 = new THREE.Mesh(new THREE.BoxGeometry(13, 0.6, 0.5), girderMat);
    girder1.position.set(0, 2.6, -3.6);
    bridgeGroup.add(girder1);

    const girder2 = new THREE.Mesh(new THREE.BoxGeometry(13, 0.6, 0.5), girderMat);
    girder2.position.set(0, 2.6, 3.6);
    bridgeGroup.add(girder2);

    // Dual Railway Tracks
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    [-2.2, -1.2, 1.2, 2.2].forEach(offsetZ => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(30, 0.15, 0.15), railMat);
      rail.position.set(0, 4.15, offsetZ);
      bridgeGroup.add(rail);
    });

    // Railway wooden ties
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.9 });
    for (let x = -14; x <= 14; x += 1.2) {
      const tie1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 1.8), tieMat);
      tie1.position.set(x, 4.05, -1.7);
      bridgeGroup.add(tie1);

      const tie2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 1.8), tieMat);
      tie2.position.set(x, 4.05, 1.7);
      bridgeGroup.add(tie2);
    }

    // Clearance Height Sign
    const bannerGeo = new THREE.BoxGeometry(11, 0.8, 0.2);
    const bannerMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 3.4, 4.15);
    bridgeGroup.add(banner);

    scene.add(bridgeGroup);

    // 5. Underground Stormwater Drain (SWD) Sump Cutaway
    const sumpGroup = new THREE.Group();

    // Sump Chamber Pit (transparent front)
    const sumpBoxGeo = new THREE.BoxGeometry(6, 2.6, 6);
    const sumpMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.65,
      roughness: 0.5
    });
    const sumpBox = new THREE.Mesh(sumpBoxGeo, sumpMat);
    sumpBox.position.set(0, -3.4, 0);
    sumpGroup.add(sumpBox);

    // Sump Water Mesh
    const sumpWaterGeo = new THREE.BoxGeometry(5.8, 1, 5.8);
    const sumpWaterMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      transparent: true,
      opacity: 0.8,
      roughness: 0.1
    });
    const sumpWaterMesh = new THREE.Mesh(sumpWaterGeo, sumpWaterMat);
    sumpWaterMesh.position.set(0, -4.2, 0);
    sumpGroup.add(sumpWaterMesh);

    // 100HP Centrifugal Pump Housing
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6, roughness: 0.3 });
    const pumpHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 1.2, 16), pumpMat);
    pumpHousing.position.set(1.6, -3.2, 0);
    sumpGroup.add(pumpHousing);

    // Impeller
    const impellerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const impeller = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), impellerMat);
    impeller.position.set(1.6, -3.7, 0);
    sumpGroup.add(impeller);

    // Discharge Pipe
    const pipeGeo = new THREE.CylinderGeometry(0.25, 0.25, 14, 12);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5 });
    const dischargePipe = new THREE.Mesh(pipeGeo, pipeMat);
    dischargePipe.rotation.z = Math.PI / 2;
    dischargePipe.position.set(8, -3.0, 0);
    sumpGroup.add(dischargePipe);

    // Road Drainage Inlet Grate
    const grateGeo = new THREE.PlaneGeometry(2.5, 2.5);
    const grateMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, wireframe: true });
    const grate = new THREE.Mesh(grateGeo, grateMat);
    grate.rotation.x = -Math.PI / 2;
    grate.position.set(0, -1.54, 0);
    sumpGroup.add(grate);

    scene.add(sumpGroup);

    // 6. Surface Flood Water Mesh
    const floodWaterGeo = new THREE.BoxGeometry(10.8, 1, 28);
    const floodWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.78,
      roughness: 0.08,
      metalness: 0.2
    });
    const floodWaterMesh = new THREE.Mesh(floodWaterGeo, floodWaterMat);
    floodWaterMesh.position.set(0, -1.55, 0);
    floodWaterMesh.scale.set(1, 0.01, 1);
    scene.add(floodWaterMesh);

    // 7. Depth Measuring Ruler
    const rulerGroup = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(4.5, -0.2, -1.5);
    rulerGroup.add(pole);

    const bandMatGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const bandMatAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const bandMatRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), bandMatGreen);
    band1.position.set(4.5, -1.35, -1.5); // 15cm
    rulerGroup.add(band1);

    const band2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 12), bandMatAmber);
    band2.position.set(4.5, -1.2, -1.5); // 25cm
    rulerGroup.add(band2);

    const band3 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12), bandMatRed);
    band3.position.set(4.5, -0.9, -1.5); // 45cm
    rulerGroup.add(band3);

    scene.add(rulerGroup);

    // 8. 3D Vehicle Models
    const vehiclesGroup = new THREE.Group();

    // Car (Sedan)
    const carGroup = new THREE.Group();
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.7, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x4f46e5, metalness: 0.6, roughness: 0.3 })
    );
    carBody.position.set(0, 0.6, 0);
    carBody.castShadow = true;
    carGroup.add(carBody);

    const carRoof = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.2 })
    );
    carRoof.position.set(0, 1.2, -0.2);
    carRoof.castShadow = true;
    carGroup.add(carRoof);

    // Car wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
    [[-1.0, 1.3], [1.0, 1.3], [-1.0, -1.3], [1.0, -1.3]].forEach(([x, z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.35, z);
      w.castShadow = true;
      carGroup.add(w);
    });

    carGroup.position.set(-2.2, -1.55, 1.5);
    vehiclesGroup.add(carGroup);

    // 2-Wheeler Motorcycle
    const bikeGroup = new THREE.Group();
    const bikeFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.6, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
    );
    bikeFrame.position.set(0, 0.6, 0);
    bikeGroup.add(bikeFrame);

    const bikeWheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), wheelMat);
    bikeWheel1.rotation.z = Math.PI / 2;
    bikeWheel1.position.set(0, 0.3, 0.8);
    bikeGroup.add(bikeWheel1);

    const bikeWheel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), wheelMat);
    bikeWheel2.rotation.z = Math.PI / 2;
    bikeWheel2.position.set(0, 0.3, -0.8);
    bikeGroup.add(bikeWheel2);

    bikeGroup.position.set(2.4, -1.55, -2.0);
    vehiclesGroup.add(bikeGroup);

    scene.add(vehiclesGroup);

    // 9. 3D Rainfall Particle System
    const RAIN_COUNT = 1500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(RAIN_COUNT * 3);

    for (let i = 0; i < RAIN_COUNT * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 60;
      rainPositions[i + 1] = Math.random() * 30 + 1;
      rainPositions[i + 2] = (Math.random() - 0.5) * 60;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.2,
      transparent: true,
      opacity: 0.0
    });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    scene.add(rainSystem);

    // -------------------------------------------------------------
    // STATE & ANIMATION LOOP
    // -------------------------------------------------------------
    let targetWaterDepth = 0;
    let currentWaterDepth = 0;
    let rainIntensity = 0;
    let isPumpRunning = false;
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (controls) controls.update();

      // Smooth water level interpolation
      currentWaterDepth += (targetWaterDepth - currentWaterDepth) * 0.08;

      if (currentWaterDepth > 0.01) {
        floodWaterMesh.visible = true;
        const depthHeight = currentWaterDepth * 2.5; // Clear visual demonstration
        floodWaterMesh.scale.y = Math.max(0.01, depthHeight);
        floodWaterMesh.position.y = -1.55 + depthHeight / 2;
        floodWaterMesh.rotation.y = Math.sin(time * 0.5) * 0.005;
      } else {
        floodWaterMesh.visible = false;
      }

      // Sump water height
      const sumpPct = Math.min(1.0, (state.rainIntensity * state.rainDuration * 0.2 + 0.24));
      sumpWaterMesh.scale.y = Math.max(0.1, sumpPct * 2.2);
      sumpWaterMesh.position.y = -4.7 + (sumpWaterMesh.scale.y / 2);

      // Pump impeller rotation
      if (isPumpRunning) {
        impeller.rotation.y += 0.4;
        if (targetWaterDepth > 0) {
          targetWaterDepth = Math.max(0, targetWaterDepth - 0.004);
        }
      }

      // Rain Particles animation
      if (rainIntensity > 0) {
        rainMat.opacity = Math.min(0.85, 0.2 + (rainIntensity / 120) * 0.65);
        const positions = rainGeo.attributes.position.array;
        const fallSpeed = 0.4 + (rainIntensity / 100) * 0.6;

        for (let i = 1; i < RAIN_COUNT * 3; i += 3) {
          positions[i] -= fallSpeed;
          if (positions[i] < -1.8) {
            positions[i] = 28 + Math.random() * 5;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      } else {
        rainMat.opacity = 0;
      }

      // Beacon lights flash if flooded
      if (currentWaterDepth >= 0.25) {
        const flash = Math.sin(time * 12) > 0;
        warningBeaconL.color.setHex(flash ? 0xef4444 : 0x450a0a);
        warningBeaconR.color.setHex(flash ? 0xef4444 : 0x450a0a);
        warningBeaconL.intensity = flash ? 3 : 0.2;
        warningBeaconR.intensity = flash ? 3 : 0.2;
      } else if (currentWaterDepth >= 0.15) {
        warningBeaconL.color.setHex(0xf59e0b);
        warningBeaconR.color.setHex(0xf59e0b);
        warningBeaconL.intensity = 1.5;
        warningBeaconR.intensity = 1.5;
      } else {
        warningBeaconL.color.setHex(0x10b981);
        warningBeaconR.color.setHex(0x10b981);
        warningBeaconL.intensity = 1.0;
        warningBeaconR.intensity = 1.0;
      }

      renderer.render(scene, camera);
    }

    animate();

    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onResize);

    // CONTROLLER METHODS
    twinSim = {
      updateWaterAndRain(depthMeters, intensity, status, sumpVol) {
        targetWaterDepth = depthMeters;
        rainIntensity = intensity;

        const depthVal = document.getElementById('twin-depth-val');
        const statusBadge = document.getElementById('twin-status-badge');
        const rainDisp = document.getElementById('twin-rain-val');
        const rainSlider = document.getElementById('twin-rain-slider');

        if (depthVal) depthVal.textContent = (depthMeters * 100).toFixed(0);
        if (rainDisp) rainDisp.textContent = `${intensity} mm/hr`;
        if (rainSlider && document.activeElement !== rainSlider) rainSlider.value = intensity;

        if (statusBadge) {
          if (depthMeters <= 0.08) {
            statusBadge.className = 'gauge-status safe';
            statusBadge.textContent = 'PASSABLE (<10cm)';
          } else if (depthMeters <= 0.25) {
            statusBadge.className = 'gauge-status warning';
            statusBadge.textContent = 'CAUTION (10-25cm)';
          } else {
            statusBadge.className = 'gauge-status danger';
            statusBadge.textContent = '⛔ SUBWAY FLOODED';
          }
        }

        const statBike = document.getElementById('tv-stat-bike');
        const statCar = document.getElementById('tv-stat-car');
        const statAmb = document.getElementById('tv-stat-amb');

        if (statBike) {
          if (depthMeters >= 0.15) {
            statBike.className = 'tv-stat danger';
            statBike.textContent = 'Stalled (>15cm)';
          } else {
            statBike.className = 'tv-stat safe';
            statBike.textContent = 'Safe (<15cm)';
          }
        }

        if (statCar) {
          if (depthMeters >= 0.25) {
            statCar.className = 'tv-stat danger';
            statCar.textContent = 'Intake Submerged (>25cm)';
          } else {
            statCar.className = 'tv-stat safe';
            statCar.textContent = 'Safe (<25cm)';
          }
        }

        if (statAmb) {
          if (depthMeters >= 0.45) {
            statAmb.className = 'tv-stat danger';
            statAmb.textContent = 'Exhaust Blocked (>45cm)';
          } else {
            statAmb.className = 'tv-stat safe';
            statAmb.textContent = 'Safe (<45cm)';
          }
        }
      },

      setCameraView(type) {
        if (!controls) return;
        if (type === 'orbit') {
          camera.position.set(24, 18, 28);
          controls.target.set(0, 0, 0);
        } else if (type === 'driver') {
          camera.position.set(-2.2, -0.6, 6);
          controls.target.set(-2.2, -1.2, -8);
        } else if (type === 'cutaway') {
          camera.position.set(26, -1.0, 0);
          controls.target.set(0, -2.5, 0);
        }
        controls.update();
      },

      togglePump() {
        isPumpRunning = !isPumpRunning;
        const btn = document.getElementById('btn-twin-pump');
        const stateTxt = document.getElementById('twin-pump-state');
        if (btn && stateTxt) {
          btn.classList.toggle('running', isPumpRunning);
          stateTxt.textContent = isPumpRunning ? 'RUNNING (DISCHARGING)' : 'STANDBY';
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

    setTimeout(() => {
      if (!twinSim) {
        init3DTwinSimulation();
      }
      if (twinSim) {
        twinSim.resize();
        twinSim.updateWaterAndRain(state.sensor.waterDepthMeters, state.rainIntensity, state.sensor.status, 0);
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

  // 3D Studio Scenario Buttons
  const twinBtnClear = document.getElementById('twin-btn-clear');
  const twinBtnRain = document.getElementById('twin-btn-rain');
  const twinBtnDeluge = document.getElementById('twin-btn-deluge');

  function set3DScenarioActive(btn, preset) {
    [twinBtnClear, twinBtnRain, twinBtnDeluge].forEach(b => { if (b) b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    setScenarioPreset(preset);
  }

  if (twinBtnClear) twinBtnClear.addEventListener('click', () => set3DScenarioActive(twinBtnClear, 'clear'));
  if (twinBtnRain) twinBtnRain.addEventListener('click', () => set3DScenarioActive(twinBtnRain, 'rain2h'));
  if (twinBtnDeluge) twinBtnDeluge.addEventListener('click', () => set3DScenarioActive(twinBtnDeluge, 'deluge'));

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
      calculateHydrology();
    });
  }

  // Initial Execution
  initMapRainCanvas();
  calculateHydrology();
  addLog('system', 'Chennai Jal-Marg engine initialized. MoES SIH-26085 prototype active.');
});
