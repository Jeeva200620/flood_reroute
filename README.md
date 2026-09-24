# Chennai Jal-Marg (சென்னை மழை & வெள்ள வழித்தடம்)
### Real-Time IoT Urban Flood Prediction & Dynamic Traffic Rerouting System
**Developed for Smart India Hackathon (SIH 2026)**

---

## 🎯 Problem Statement
During intense northeast monsoon downpours in Chennai (like December 2015 or Cyclone Michaung 2023), conventional navigation apps (e.g. Google Maps) show traffic congestion in **Red**, but commuters have **no way of knowing whether the red line is slow traffic or a 3-foot deep death trap** in critical railway subways (like *Thillai Ganga Nagar Subway* in South Chennai or *Ganesapuram Subway* in North Chennai).

Furthermore, civic bodies like Greater Chennai Corporation (GCC) often react only *after* vehicles get drowned in subways or roads become waterlogged.

---

## 💡 The Solution: Chennai Jal-Marg
Chennai Jal-Marg bridges the gap between **civic stormwater drainage monitoring** and **consumer turn-by-turn navigation**:
1. **IoT Micro-Sump Network:** Ultrasonic depth transmitters monitor street drain catch-pits (calibrated to $500\text{L}$ volume).
2. **Predictive Surcharge Warning:** The moment a drain hits **450L (90% capacity)** or continuous rainfall exceeds 1–2 hours, the road color transitions to **Orange (Warning)** and then **Red (Flooded / Blocked)**.
3. **Dynamic Rerouting Engine:** Rather than letting vehicles enter a flooded subway, the route **dynamically snaps to elevated high-ground bypasses** (such as the *Alandur / Kathipara Grade Separator* in South Chennai or *Vyasarpadi Murasoli Maran Flyover* in North Chennai).
4. **Hydrological Macro Integration:** Accurately connects local road catchments to Chennai's **13,222 MCFT total reservoir system** (Chembarambakkam, Puzhal, Poondi) and the **4 Natural Sea Gateways** into the Bay of Bengal (*Ennore Creek, Cooum Mouth, Adyar Estuary, Kovalam/Muttukadu*).

---

## 🗺️ Visual Hazard Classification

| Road Color | Surface Water Depth | Drain Fill % | Civic & Navigation Meaning |
| :--- | :--- | :--- | :--- |
| 🟢 **Green** | $< 5\text{ cm}$ | $< 70\%$ ($< 350\text{L}$) | **Clear Flow:** Standard direct subway route active. |
| 🟠 **Orange** | $10 - 25\text{ cm}$ | $70\% - 89\%$ ($350\text{L} - 449\text{L}$) | **Warning:** 1–2 hours continuous rain; slow speeds, two-wheelers cautioned. |
| 🔴 **Red** | $> 30\text{ cm}$ | $\ge 90\%$ ($\ge 450\text{L}$) | **Severe Flood:** Subway submerged; automatic barrier close; **mandatory reroute**. |
| 🔷 **Cyan (Dashed)** | High Ground (Elevated) | N/A | **Safe Bypass Route:** Flyover / Overbridge alternate path. |

---

## 🎙️ 3-Minute SIH Winning Presentation Script

* **[0:00 - 0:45] The Hook:**
  > *"Respected Jury, during the 2015 floods and Cyclone Michaung in Chennai, dozens of cars and two-wheelers were stranded inside Thillai Ganga Nagar and Vyasarpadi subways because Google Maps showed heavy traffic in red, but couldn't tell drivers that 3 feet of water was waiting inside the subway underpass."*

* **[0:45 - 1:30] The Innovation:**
  > *"We built Chennai Jal-Marg. We deployed simulated IoT ultrasonic depth sensors across GCC stormwater drains. Every drain is modeled on volume. If a 500-liter drain crosses 450 liters (90%), or continuous rain exceeds 1 hour, our system calculates hydraulic surcharge 60 minutes before the road gets flooded."*

* **[1:30 - 2:30] The Live Demo (Perform this on screen):**
  > 1. *"Look at Preset 1: Under clear skies, the driver takes Thillai Ganga Nagar Subway directly (8 mins, Green line)."*
  > 2. *(Click Preset 2)* *"Now 2 hours of continuous rain starts. Sump volume reaches 385L (77%). The subway turns Orange with a waterlogging caution."*
  > 3. *(Click Preset 3 - 2-Day Deluge)* *"Now simulated 2-day continuous rain hits 110 mm/hr. The drain crosses 450L and reaches 475L! Listen to the voice alert — the subway turns Red, the barrier close signal is sent to the GCC ICCC terminal, and watch the route line: it instantly recalculates via the Kathipara Elevated Flyover!"*

* **[2:30 - 3:00] Scalability & Feasibility:**
  > *"Our solution uses OpenStreetMap and Leaflet—no costly Google Maps API billing surprises. It integrates with GCC’s 1,320 de-watering pump network and NCCR C-FLOWS data. This saves lives, protects vehicles, and prevents urban gridlock."*

---

## 🛠️ How to Run Locally

You can run this project locally using Python's built-in HTTP server or any lightweight local server:

```bash
# Navigate to the folder:
cd C:\Users\Jeeva\.gemini\antigravity-ide\scratch\chennai-flood-reroute

# Start local server:
python -m http.server 8000
```
Open your browser at `http://localhost:8000`.
# flood_reroute
