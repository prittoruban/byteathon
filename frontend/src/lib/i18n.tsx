"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ta";

export interface Translations {
  [key: string]: {
    en: string;
    ta: string;
  };
}

export const DICTIONARY: Translations = {
  // Brand & Navigation
  "app.brand": {
    en: "HARVEST ZERO",
    ta: "ஹார்வெஸ்ட் ஜீரோ",
  },
  "app.tagline": {
    en: "Perishable Cold Chain System",
    ta: "விளைபொருட்களுக்கான குளிர்பதன சங்கிலி அமைப்பு",
  },
  "app.hero_title": {
    en: "Multi-Echelon Agricultural Logistics & Arrhenius Spoilage Prevention",
    ta: "பல அடுக்கு விவசாய சரக்குப் போக்குவரத்து & அழுகல் இழப்பு தடுப்பு",
  },
  "app.hero_desc": {
    en: "Continuous Arrhenius kinetic modeling, satellite microclimate telemetry, and synchronized allocation across 5 supply chain actors.",
    ta: "தொடர்ச்சியான அர்ஹீனியஸ் அழுகல் கணிப்பு, செயற்கைக்கோள் தட்பவெப்ப கண்காணிப்பு மற்றும் 5 துறை ஒருங்கிணைப்பு அமைப்பு.",
  },
  "nav.switch_role": {
    en: "Switch Role",
    ta: "பங்கை மாற்றவும்",
  },
  "nav.switch_dashboard": {
    en: "Switch Dashboard",
    ta: "கட்டுப்பாட்டு மையத்தை மாற்றவும்",
  },
  "nav.sign_in": {
    en: "Sign In",
    ta: "உள்நுழைக",
  },
  "nav.sign_out": {
    en: "Sign Out",
    ta: "வெளியேறு",
  },
  "nav.dashboard": {
    en: "Dashboard",
    ta: "கட்டுப்பாட்டு மையம்",
  },
  "nav.refresh": {
    en: "Refresh",
    ta: "புதுப்பி",
  },
  "nav.refreshing": {
    en: "Refreshing...",
    ta: "புதுப்பிக்கிறது...",
  },
  "nav.active": {
    en: "Active",
    ta: "செயலில் உள்ளது",
  },
  "nav.table_view": {
    en: "Table View",
    ta: "அட்டவணைப் பார்வை",
  },
  "nav.map_view": {
    en: "Map View",
    ta: "வரைபடப் பார்வை",
  },
  "nav.scroll_hint": {
    en: "Scroll horizontally →",
    ta: "கிடைமட்டமாக நகர்த்தவும் →",
  },
  "nav.enter": {
    en: "Enter",
    ta: "நுழையவும்",
  },
  "nav.select_role_prompt": {
    en: "Select Role to Access Console",
    ta: "பயன்பாட்டு முனையத்தை அணுக பங்கைத் தேர்ந்தெடுக்கவும்",
  },

  // Role Names & Subtitles
  "role.farmer": {
    en: "Farmer",
    ta: "விவசாயி",
  },
  "role.farmer.title": {
    en: "Farmer Intake & Harvest",
    ta: "விவசாயி விளைபொருள் பதிவு",
  },
  "role.farmer.desc": {
    en: "Nashik Farmer Producer Node",
    ta: "விவசாயிகள் உற்பத்தியாளர் பிரிவு",
  },
  "role.buyer": {
    en: "Commercial Buyer",
    ta: "வணிக வாங்குபவர்",
  },
  "role.buyer.title": {
    en: "Buyer Procurement Pool",
    ta: "வணிக கொள்முதல் மையம்",
  },
  "role.buyer.desc": {
    en: "FreshMart Prime Retail & Hypermarkets",
    ta: "சில்லறை & மொத்த கொள்முதல் வர்த்தகம்",
  },
  "role.truck": {
    en: "Reefer Truck Fleet",
    ta: "குளிரூட்டப்பட்ட சரக்கு லாரி",
  },
  "role.truck.title": {
    en: "Reefer Transit Telemetry",
    ta: "சரக்கு போக்குவரத்து கண்காணிப்பு",
  },
  "role.truck.desc": {
    en: "Maharashtra Agro Logistics Fleet",
    ta: "விவசாய சரக்கு லாரி சேவை",
  },
  "role.cold_storage": {
    en: "Cold Storage Vault",
    ta: "குளிர்பதன கிடங்கு",
  },
  "role.cold_storage.title": {
    en: "Cold Vault Buffer Network",
    ta: "குளிர்பதன சேமிப்பு மையம்",
  },
  "role.cold_storage.desc": {
    en: "MahaAgro Vault 04 & APMC Hubs",
    ta: "விவசாய கிடங்கு & சேமிப்பு மையம்",
  },
  "role.fpo": {
    en: "FPO Coordinator",
    ta: "உழவர் உற்பத்தியாளர் அமைப்பு (FPO)",
  },
  "role.fpo.title": {
    en: "Cluster Mission Control",
    ta: "FPO கிளஸ்டர் கட்டுப்பாட்டு மையம்",
  },
  "role.fpo.desc": {
    en: "Nashik Farmer Producer Org",
    ta: "உழவர் உற்பத்தியாளர் நிறுவனம்",
  },

  // Subnav Tabs
  "tab.harvest_intake": {
    en: "Harvest Intake",
    ta: "அறுவடை பதிவு",
  },
  "tab.active_batches": {
    en: "Active Batches",
    ta: "விளைபொருள் தொகுப்புகள்",
  },
  "tab.procurement_pool": {
    en: "Procurement Pool",
    ta: "கொள்முதல் மையம்",
  },
  "tab.active_orders": {
    en: "Active Orders",
    ta: "தற்போதைய ஆணைகள்",
  },
  "tab.fleet_dispatch": {
    en: "Fleet Dispatch",
    ta: "வாகனப் பயணங்கள்",
  },
  "tab.transit_telemetry": {
    en: "Transit Telemetry",
    ta: "பயணக் கண்காணிப்பு",
  },
  "tab.vault_buffer": {
    en: "Vault Buffer",
    ta: "சேமிப்பு மையம்",
  },
  "tab.mission_control": {
    en: "Mission Control",
    ta: "முதன்மை மையம்",
  },

  // Farmer Page
  "farmer.title": {
    en: "Harvest Lot Intake",
    ta: "விளைபொருள் அறுவடை பதிவு",
  },
  "farmer.desc": {
    en: "Register harvest to evaluate Arrhenius degradation rate and receive coordinated dispatch plans.",
    ta: "அழுகல் வேகத்தை கணக்கிட்டு, ஒருங்கிணைந்த விநியோக திட்டங்களைப் பெற அறுவடையைப் பதிவு செய்யவும்.",
  },
  "farmer.new_intake": {
    en: "New Intake",
    ta: "புதிய பதிவு",
  },
  "farmer.crop": {
    en: "Crop",
    ta: "பயிர் வகை",
  },
  "farmer.optimum": {
    en: "Optimum",
    ta: "உகந்த வெப்பநிலை",
  },
  "farmer.quantity": {
    en: "Quantity (kg)",
    ta: "அளவு (கிலோ)",
  },
  "farmer.crates": {
    en: "crates",
    ta: "கூடைகள்",
  },
  "farmer.storage_condition": {
    en: "Current On-Farm Storage Condition",
    ta: "பண்ணையில் தற்போதைய சேமிப்பு நிலை",
  },
  "farmer.ambient": {
    en: "Ambient",
    ta: "சாதாரண சூழல்",
  },
  "farmer.ambient_desc": {
    en: "Field air (28–35°C)",
    ta: "திறந்தவெளி காற்று (28–35°C)",
  },
  "farmer.shaded": {
    en: "Covered Shed",
    ta: "நிழல் கொட்டகை",
  },
  "farmer.shaded_desc": {
    en: "Shaded (22–25°C)",
    ta: "நிழல் சூழல் (22–25°C)",
  },
  "farmer.precooled": {
    en: "Pre-cooled",
    ta: "முன்கூட்டியே குளிர்விக்கப்பட்டது",
  },
  "farmer.precooled_desc": {
    en: "Farm buffer (4–8°C)",
    ta: "குளிர் சேமிப்பு (4–8°C)",
  },
  "farmer.harvest_datetime": {
    en: "Harvest Date & Time",
    ta: "அறுவடை செய்த தேதி & நேரம்",
  },
  "farmer.farmland_address": {
    en: "Farmland Address / Village",
    ta: "விவசாய நில முகவரி / கிராமம்",
  },
  "farmer.address_placeholder": {
    en: "e.g. Survey No. 42, Deola Taluka, Nashik",
    ta: "எ.கா. புல எண் 42, கிராமம், தாலுகா",
  },
  "farmer.resolving_address": {
    en: "Resolving address...",
    ta: "முகவரியை கண்டறிகிறது...",
  },
  "farmer.gps_coordinates": {
    en: "GPS Coordinates",
    ta: "ஜிபிஎஸ் அமைவிடம் (GPS)",
  },
  "farmer.detect_gps": {
    en: "Detect GPS",
    ta: "ஜிபிஎஸ் கண்டறி",
  },
  "farmer.detecting": {
    en: "Detecting...",
    ta: "கண்டறிகிறது...",
  },
  "farmer.pin_map": {
    en: "Pin on Map",
    ta: "வரைபடத்தில் குறிக்கவும்",
  },
  "farmer.close_pin": {
    en: "Close Pin",
    ta: "வரைபடத்தை மூடு",
  },
  "farmer.satellite_pinpoint": {
    en: "Satellite Farmland Boundary Pinpoint",
    ta: "செயற்கைக்கோள் நில எல்லை குறிப்பான்",
  },
  "farmer.satellite_guide": {
    en: "Click anywhere on your field or drag the green pin to set the exact harvest pickup dock.",
    ta: "விளைபொருளை ஏற்ற வேண்டிய சரியான இடத்தை வரைபடத்தில் தேர்ந்தெடுக்கவும்.",
  },
  "farmer.search_land_placeholder": {
    en: "Search village, taluka, landmark (e.g. Pimpalgaon Baswant, Nashik)...",
    ta: "கிராமம், தாலுகா, அடையாள இடத்தை தேடவும்...",
  },
  "farmer.locate_land": {
    en: "Locate Land",
    ta: "நிலத்தைக் கண்டுபிடி",
  },
  "farmer.generate_plans": {
    en: "Generate Plans",
    ta: "திட்டங்களை உருவாக்கு",
  },
  "farmer.calc_freshness": {
    en: "① Calculating freshness clock...",
    ta: "① புத்துணர்ச்சி ஆயுளை கணக்கிடுகிறது...",
  },
  "farmer.matching_buyers": {
    en: "② Matching buyers & fleet...",
    ta: "② வாங்குபவர்கள் & வாகனங்களை இணைக்கிறது...",
  },
  "farmer.arrhenius_valuation": {
    en: "ARRHENIUS VALUATION",
    ta: "அர்ஹீனியஸ் மதிப்பு மதிப்பீடு",
  },
  "farmer.baseline_valuation_sub": {
    en: "Baseline farmgate valuation before kinetic shelf-life decay adjustments",
    ta: "அழுகல் இழப்பு மாற்றங்களுக்கு முந்தைய ஆரம்ப பண்ணை விலை",
  },
  "farmer.kinetic_model": {
    en: "KINETIC MODEL",
    ta: "இயக்க மாதிரி சமன்பாடு",
  },
  "farmer.kinetic_sub": {
    en: "Respiration rate computed dynamically from farm microclimate kinetics.",
    ta: "பண்ணை தட்பவெப்பநிலை மூலம் சுவாச வீதம் கணக்கிடப்படுகிறது.",
  },
  "farmer.hours_remaining": {
    en: "Hours Remaining",
    ta: "மணிகள் மீதமுள்ளன",
  },
  "farmer.decay_factor": {
    en: "Decay factor",
    ta: "அழுகல் காரணி",
  },
  "farmer.plans_generated": {
    en: "3 Coordinated Plans Generated",
    ta: "3 ஒருங்கிணைந்த திட்டங்கள் தயார்",
  },
  "farmer.plan_confirmed_banner": {
    en: "Plan confirmed. Notifications dispatched to commercial buyer and transportation fleet.",
    ta: "திட்டம் உறுதிப்படுத்தப்பட்டது. வணிக வாங்குபவருக்கும் சரக்கு லாரிக்கும் தகவல் அனுப்பப்பட்டது.",
  },
  "farmer.view_batches": {
    en: "View Batches",
    ta: "தொகுப்புகளைக் காண்க",
  },

  // Plan Cards
  "plan.recommended": {
    en: "RECOMMENDED",
    ta: "பரிந்துரைக்கப்படுகிறது",
  },
  "plan.confirm_dispatch": {
    en: "Confirm & Dispatch",
    ta: "உறுதிசெய்து அனுப்புக",
  },
  "plan.dispatching": {
    en: "Dispatching...",
    ta: "அனுப்பப்படுகிறது...",
  },
  "plan.confirmed": {
    en: "Plan Confirmed",
    ta: "திட்டம் உறுதிசெய்யப்பட்டது",
  },
  "plan.net_delta": {
    en: "Net Margin Delta",
    ta: "நிகர கூடுதல் லாபம்",
  },
  "plan.est_price": {
    en: "Estimated Price",
    ta: "மதிப்பிடப்பட்ட விலை",
  },
  "plan.shelf_life_delivery": {
    en: "Shelf Life at Delivery",
    ta: "விநியோகத்தின் போதான ஆயுள்",
  },
  "plan.buyer_destination": {
    en: "Buyer / Destination",
    ta: "வாங்குபவர் / சேருமிடம்",
  },
  "plan.transport_vehicle": {
    en: "Transport Fleet",
    ta: "சரக்கு வாகனம்",
  },
  "plan.storage_node": {
    en: "Storage Node",
    ta: "சேமிப்பு மையம்",
  },
  "plan.refrigerated": {
    en: "Refrigerated Reefer",
    ta: "குளிரூட்டப்பட்ட வாகனம்",
  },
  "plan.non_refrigerated": {
    en: "Ambient Cargo",
    ta: "சாதாரண சரக்கு வாகனம்",
  },

  // Farmer Batches
  "batches.title": {
    en: "Farmer Batches & Dispatches",
    ta: "விவசாயி விளைபொருள் தொகுப்புகள்",
  },
  "batches.sub": {
    en: "Track registered produce batches, active transit routes, and commercial buyer allocations.",
    ta: "பதிவுசெய்த விளைபொருள் தொகுப்புகள், பயண வழித்தடங்கள் மற்றும் வாங்குபவர் ஒதுக்கீட்டை கண்காணிக்கவும்.",
  },
  "batches.lot_ref": {
    en: "Lot Ref",
    ta: "தொகுப்பு எண்",
  },
  "batches.crop": {
    en: "Crop",
    ta: "பயிர்",
  },
  "batches.quantity": {
    en: "Quantity",
    ta: "அளவு",
  },
  "batches.harvested": {
    en: "Harvested",
    ta: "அறுவடை நாள்",
  },
  "batches.shelf_life": {
    en: "Shelf Life",
    ta: "ஆயுட்காலம்",
  },
  "batches.assigned_buyer": {
    en: "Assigned Buyer",
    ta: "வாங்குபவர்",
  },
  "batches.status": {
    en: "Status",
    ta: "நிலை",
  },
  "batches.action": {
    en: "Action",
    ta: "நடவடிக்கை",
  },
  "batches.no_batches": {
    en: "No batches registered yet. Register harvest from dashboard.",
    ta: "விளைபொருள் தொகுப்புகள் எதுவும் இல்லை. முகப்புப் பக்கத்தில் பதிவு செய்யவும்.",
  },

  // Buyer Dashboard
  "buyer.title": {
    en: "Buyer Procurement Pool",
    ta: "வணிக வாங்குபவர் கொள்முதல் மையம்",
  },
  "buyer.sub": {
    en: "Live marketplace of farmer-dispatched produce batches matching your purchasing criteria.",
    ta: "உங்கள் தேவைகளுக்கு ஏற்ப விவசாயிகள் அனுப்பிய நேரடி விளைபொருட்கள் பட்டியல்.",
  },
  "buyer.pool_lots": {
    en: "Incoming Farmer Dispatches",
    ta: "விவசாயிகள் அனுப்பிய புதிய தொகுப்புகள்",
  },
  "buyer.accept": {
    en: "Accept Purchase",
    ta: "கொள்முதலை ஏற்றுக்கொள்",
  },
  "buyer.accepted": {
    en: "Accepted",
    ta: "ஏற்றுக்கொள்ளப்பட்டது",
  },
  "buyer.price": {
    en: "Agreed Price",
    ta: "ஒப்பந்த விலை",
  },
  "buyer.cold_chain_status": {
    en: "Cold Chain Status",
    ta: "குளிர்பதன நிலை",
  },
  "buyer.active_purchases": {
    en: "Active Purchases",
    ta: "தற்போதைய கொள்முதல்கள்",
  },
  "buyer.delivered": {
    en: "Delivered",
    ta: "விநியோகிக்கப்பட்டது",
  },

  // Truck Fleet
  "truck.title": {
    en: "Reefer Fleet Transit Telemetry",
    ta: "குளிரூட்டப்பட்ட சரக்கு லாரி கண்காணிப்பு",
  },
  "truck.sub": {
    en: "Real-time dispatch orders, IoT refrigeration monitoring, and smart route guidance.",
    ta: "நேரலை விநியோக ஆணைகள், IoT குளிர்பதன கண்காணிப்பு மற்றும் வழித்தட வழிகாட்டுதல்.",
  },
  "truck.active_trips": {
    en: "Active Dispatch Orders",
    ta: "செயலில் உள்ள பயண ஆணைகள்",
  },
  "truck.accept_trip": {
    en: "Accept Trip",
    ta: "பயணத்தை ஏற்றுக்கொள்",
  },
  "truck.start_transit": {
    en: "Start Transit",
    ta: "பயணத்தைத் தொடங்கு",
  },
  "truck.mark_delivered": {
    en: "Mark Delivered",
    ta: "விநியோகிக்கப்பட்டது என குறி",
  },
  "truck.telemetry": {
    en: "Live Sensor Telemetry",
    ta: "நேரலை சென்சார் தகவல்கள்",
  },
  "truck.cargo_temp": {
    en: "Cargo Temp",
    ta: "சரக்கு வெப்பநிலை",
  },
  "truck.cargo_sensor": {
    en: "Cargo Sensor",
    ta: "சரக்கு வெப்பநிலை சென்சார்",
  },
  "truck.humidity": {
    en: "Humidity",
    ta: "காற்றின் ஈரப்பதம்",
  },
  "truck.route_map": {
    en: "Transit Route & Highway Geometry",
    ta: "பயண வழித்தடம் & நெடுஞ்சாலை வரைபடம்",
  },
  "truck.authorized_pickups": {
    en: "Authorized Pickups",
    ta: "அனுமதிக்கப்பட்ட பயணங்கள்",
  },
  "truck.awaiting_po": {
    en: "Awaiting Buyer PO",
    ta: "வாங்குபவர் கொள்முதல் ஆணை தேவை",
  },
  "truck.vehicle_status": {
    en: "Vehicle Status",
    ta: "வாகன நிலை",
  },
  "truck.ready": {
    en: "Ready",
    ta: "தயார்",
  },
  "truck.off_duty": {
    en: "Off Duty",
    ta: "பணியில் இல்லை",
  },
  "truck.incoming_assignments": {
    en: "Incoming Pickup Assignments",
    ta: "உள்வரும் விளைபொருள் பயண ஆணைகள்",
  },
  "truck.pickup_requires_approval": {
    en: "Pickup requires commercial buyer purchase approval",
    ta: "சரக்கை ஏற்றுவதற்கு வணிக வாங்குபவரின் கொள்முதல் ஒப்புதல் தேவை",
  },
  "truck.farm_origin": {
    en: "Farm Origin",
    ta: "பண்ணை அமைவிடம்",
  },
  "truck.buyer_destination": {
    en: "Buyer Destination",
    ta: "வாங்குபவர் சேருமிடம்",
  },
  "truck.approval_state": {
    en: "Approval State",
    ta: "ஒப்புதல் நிலை",
  },
  "truck.decline": {
    en: "Decline",
    ta: "நிராகரி",
  },
  "truck.no_assignments": {
    en: "No pending pickup assignments right now.",
    ta: "தற்போது புதிய பயண ஆணைகள் எதுவும் இல்லை.",
  },

  // Cold Storage
  "storage.title": {
    en: "Cold Vault Buffer Network",
    ta: "குளிர்பதன சேமிப்பு மையம்",
  },
  "storage.sub": {
    en: "Pre-cooling and temporary shelf-life extension buffer for high-perishable crops.",
    ta: "அழுகக்கூடிய பயிர்களின் ஆயுளை நீட்டிக்க முன்கூட்டியே குளிர்விக்கும் சேமிப்பு மையம்.",
  },
  "storage.active_lots": {
    en: "Stored Buffer Lots",
    ta: "சேமிப்பில் உள்ள தொகுப்புகள்",
  },
  "storage.vault_temp": {
    en: "Vault Temperature",
    ta: "கிடங்கு வெப்பநிலை",
  },
  "storage.capacity": {
    en: "Vault Capacity",
    ta: "கிடங்கு கொள்ளளவு",
  },
  "storage.occupied_capacity": {
    en: "Occupied Capacity",
    ta: "நிரப்பப்பட்ட கொள்ளளவு",
  },
  "storage.available_capacity": {
    en: "Available Capacity",
    ta: "மீதமுள்ள கொள்ளளவு",
  },
  "storage.chamber_temp": {
    en: "Chamber Temp",
    ta: "அறை வெப்பநிலை",
  },
  "storage.inbound_slot_requests": {
    en: "Inbound Slot Requests",
    ta: "உள்வரும் சேமிப்பு கோரிக்கைகள்",
  },
  "storage.active_stored_inventory": {
    en: "Active Stored Inventory",
    ta: "சேமிப்பில் உள்ள இருப்பு",
  },
  "storage.duration": {
    en: "Duration",
    ta: "கால அளவு",
  },
  "storage.inbound_eta": {
    en: "Inbound ETA",
    ta: "வந்து சேரும் நேரம்",
  },
  "storage.rate": {
    en: "Rate",
    ta: "கட்டணம்",
  },
  "storage.checked_in": {
    en: "Checked In",
    ta: "சேமிக்கப்பட்ட நேரம்",
  },
  "storage.preservation": {
    en: "Preservation",
    ta: "பாதுகாப்பு காரணி",
  },
  "storage.fee_accrued": {
    en: "Fee Accrued",
    ta: "திரண்ட கட்டணம்",
  },
  "storage.confirm": {
    en: "Confirm",
    ta: "உறுதிசெய்",
  },
  "storage.decline": {
    en: "Decline",
    ta: "நிராகரி",
  },
  "storage.no_requests": {
    en: "No inbound storage requests pending.",
    ta: "உள்வரும் சேமிப்பு கோரிக்கைகள் எதுவும் இல்லை.",
  },
  "storage.days": {
    en: "days",
    ta: "நாட்கள்",
  },
  "storage.release_lot": {
    en: "Release Lot",
    ta: "தொகுப்பை விடுவி",
  },

  // Commercial Buyer
  "buyer.pending_offers": {
    en: "Pending Offers",
    ta: "நிலுவையில் உள்ள சலுகைகள்",
  },
  "buyer.inbound_fleets": {
    en: "Inbound Reefer Fleets",
    ta: "வரும் குளிரூட்டப்பட்ட வாகனங்கள்",
  },
  "buyer.volume_in_transit": {
    en: "Volume in Transit",
    ta: "பயணத்தில் உள்ள சரக்கு அளவு",
  },
  "buyer.min_arrival_shelf_life": {
    en: "Min Arrival Shelf Life",
    ta: "குறைந்தபட்ச புத்துணர்ச்சி ஆயுள்",
  },
  "buyer.incoming_lot_allocations": {
    en: "Incoming Lot Allocations",
    ta: "உள்வரும் விளைபொருள் ஒதுக்கீடுகள்",
  },
  "buyer.offer_price": {
    en: "Offer Price",
    ta: "வழங்கப்படும் விலை",
  },
  "buyer.freshness": {
    en: "Freshness",
    ta: "புத்துணர்ச்சி",
  },
  "buyer.assigned_fleet": {
    en: "Assigned Fleet",
    ta: "ஒதுக்கப்பட்ட வாகனம்",
  },
  "buyer.inbound_cold_chain": {
    en: "Inbound Cold Chain Deliveries",
    ta: "உள்வரும் குளிர்பதன விநியோகங்கள்",
  },
  "buyer.fleet_and_driver": {
    en: "Fleet & Driver",
    ta: "வாகனம் & ஓட்டுநர்",
  },
  "buyer.eta": {
    en: "ETA",
    ta: "வந்து சேரும் நேரம்",
  },
  "buyer.no_offers": {
    en: "No incoming offers pending.",
    ta: "நிலுவையில் உள்ள சலுகைகள் எதுவும் இல்லை.",
  },
  "buyer.no_deliveries": {
    en: "No inbound deliveries in transit.",
    ta: "பயணத்தில் உள்ள விநியோகங்கள் எதுவும் இல்லை.",
  },
  "buyer.decline": {
    en: "Decline",
    ta: "நிராகரி",
  },

  // FPO Dashboard
  "fpo.title": {
    en: "Cluster Mission Control",
    ta: "FPO கிளஸ்டர் கட்டுப்பாட்டு மையம்",
  },
  "fpo.sub": {
    en: "Cluster-wide aggregation, kinetic spoilage supervision, dynamic truck rerouting, and administrative plan overrides.",
    ta: "விளைபொருட்கள் ஒருங்கிணைப்பு, அழுகல் கண்காணிப்பு மற்றும் அவசர வழிமாற்று வசதி.",
  },
  "fpo.cluster_volume": {
    en: "Cluster Volume",
    ta: "மொத்த விளைபொருள் அளவு",
  },
  "fpo.urgent_lots": {
    en: "Urgency < 48h",
    ta: "அவசரம் (< 48 மணி)",
  },
  "fpo.active_reefer_trips": {
    en: "Active Reefer Trips",
    ta: "செயலில் உள்ள லாரி பயணங்கள்",
  },
  "fpo.realized_value": {
    en: "Realized Value",
    ta: "ஈட்டப்பட்ட மொத்த மதிப்பு",
  },
  "fpo.override": {
    en: "Override",
    ta: "மாற்று",
  },
  "fpo.override_plan": {
    en: "Override Plan",
    ta: "திட்டத்தை மாற்று",
  },
  "fpo.confirm_override": {
    en: "Confirm Override",
    ta: "மாற்றத்தை உறுதிசெய்",
  },
  "fpo.new_destination": {
    en: "New Target Destination",
    ta: "புதிய இலக்கு சேருமிடம்",
  },
  "fpo.override_reason": {
    en: "Override Reason",
    ta: "மாற்றுவதற்கான காரணம்",
  },
  "fpo.cancel": {
    en: "Cancel",
    ta: "ரத்து செய்",
  },
  "fpo.close": {
    en: "Close",
    ta: "மூடு",
  },
  "fpo.current_destination": {
    en: "Current Destination",
    ta: "தற்போதைய சேருமிடம்",
  },
  "fpo.remaining": {
    en: "remaining",
    ta: "மீதமுள்ளது",
  },
  "fpo.no_cluster_batches": {
    en: "No cluster batches registered.",
    ta: "பதிவுசெய்யப்பட்ட தொகுப்புகள் எதுவும் இல்லை.",
  },
  "fpo.engine_diagnostics": {
    en: "Algorithmic Engine Diagnostics",
    ta: "அல்காரிதம் இயந்திர பகுப்பாய்வு",
  },
  "fpo.engine_sub": {
    en: "Arrhenius Spoilage Simulator · Dynamic Rerouting Engine · Secondary Arbitrage",
    ta: "அர்ஹீனியஸ் அழுகல் மாதிரி · மாறும் வழித்தட இயந்திரம் · இரண்டாம் நிலை வர்த்தகம்",
  },
  "fpo.inspect": {
    en: "Inspect",
    ta: "பார்வையிடு",
  },
  "fpo.hide": {
    en: "Hide",
    ta: "மறை",
  },
  "fpo.spoilage_simulator": {
    en: "Spoilage Simulator",
    ta: "அழுகல் மாதிரி பகுப்பாய்வு",
  },
  "fpo.rerouting_engine": {
    en: "Rerouting Engine",
    ta: "வழிமாற்று இயந்திரம்",
  },
  "fpo.secondary_arbitrage": {
    en: "Secondary Arbitrage",
    ta: "இரண்டாம் நிலை வர்த்தகம்",
  },
};

/**
 * Natural agricultural Tamil names for common crops
 */
export const CROP_TRANSLATIONS: Record<string, { en: string; ta: string }> = {
  tomato: { en: "Tomato", ta: "தக்காளி (Tomato)" },
  tomatoes: { en: "Tomatoes", ta: "தக்காளி (Tomatoes)" },
  strawberry: { en: "Strawberry", ta: "ஸ்ட்ராபெரி (Strawberry)" },
  strawberries: { en: "Strawberries", ta: "ஸ்ட்ராபெரி (Strawberries)" },
  grapes: { en: "Grapes", ta: "திராட்சை (Grapes)" },
  capsicum: { en: "Capsicum", ta: "குடைமிளகாய் (Capsicum)" },
  "bell pepper": { en: "Bell Pepper", ta: "குடைமிளகாய் (Bell Pepper)" },
  onion: { en: "Onion", ta: "வெங்காயம் (Onion)" },
  onions: { en: "Onions", ta: "வெங்காயம் (Onions)" },
  potato: { en: "Potato", ta: "உருளைக்கிழங்கு (Potato)" },
  potatoes: { en: "Potatoes", ta: "உருளைக்கிழங்கு (Potatoes)" },
  pomegranate: { en: "Pomegranate", ta: "மாதுளை (Pomegranate)" },
  mango: { en: "Mango", ta: "மாம்பழம் (Mango)" },
  mangoes: { en: "Mangoes", ta: "மாம்பழம் (Mangoes)" },
  banana: { en: "Banana", ta: "வாழைப்பழம் (Banana)" },
  bananas: { en: "Bananas", ta: "வாழைப்பழம் (Bananas)" },
  spinach: { en: "Spinach", ta: "கீரை (Spinach)" },
  papaya: { en: "Papaya", ta: "பப்பாளி (Papaya)" },
  guava: { en: "Guava", ta: "கொய்யா (Guava)" },
  apple: { en: "Apple", ta: "ஆப்பிள் (Apple)" },
  apples: { en: "Apples", ta: "ஆப்பிள் (Apples)" },
  cabbage: { en: "Cabbage", ta: "முட்டைக்கோஸ் (Cabbage)" },
  cauliflower: { en: "Cauliflower", ta: "காலிஃபிளவர் (Cauliflower)" },
  carrot: { en: "Carrot", ta: "கேரட் (Carrot)" },
  carrots: { en: "Carrots", ta: "கேரட் (Carrots)" },
  orange: { en: "Orange", ta: "ஆரஞ்சு (Orange)" },
  oranges: { en: "Oranges", ta: "ஆரஞ்சு (Oranges)" },
};

export function getCropDisplayName(cropName: string | undefined | null, language: Language = "en"): string {
  if (!cropName) return "";
  const key = cropName.trim().toLowerCase();
  const entry = CROP_TRANSLATIONS[key];
  if (!entry) return cropName;
  return language === "ta" ? entry.ta : entry.en;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hz_language") as Language | null;
      if (stored === "en" || stored === "ta") {
        setLanguageState(stored);
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("hz_language", lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === "en" ? "ta" : "en";
    setLanguage(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const entry = DICTIONARY[key];
    if (!entry) {
      return fallback !== undefined ? fallback : key;
    }
    return entry[language] || entry.en || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Clean, compact language switcher pill component for headers
 */
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language selector"
      className="flex items-center border border-slate-200 bg-slate-100/80 rounded-md p-0.5 text-[11px] font-medium shrink-0"
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2 py-0.5 rounded transition-all cursor-pointer touch-manipulation font-semibold ${
          language === "en"
            ? "bg-white text-slate-900 shadow-xs"
            : "text-slate-500 hover:text-slate-900"
        }`}
        title="View in English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ta")}
        className={`px-2 py-0.5 rounded transition-all cursor-pointer touch-manipulation font-semibold ${
          language === "ta"
            ? "bg-[#16a34a] text-white shadow-xs"
            : "text-slate-500 hover:text-slate-900"
        }`}
        title="தமிழில் படிக்கவும்"
      >
        தமிழ்
      </button>
    </div>
  );
}
