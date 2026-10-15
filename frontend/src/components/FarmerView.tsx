"use client";

import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  PhoneCall,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Snowflake,
  Truck,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  Sun,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

export type FarmerLanguage = "hi" | "ta" | "en";

interface ProduceBatch {
  id: string;
  crop_type: string;
  quantity_kg: number;
  initial_shelf_life_days: number;
  remaining_shelf_life_days: number;
  storage_condition: string;
  status: string;
  harvest_date: string;
}

interface AllocationRec {
  allocation_id: string;
  batch_id: string;
  crop_type: string;
  farmer_name: string;
  origin_location: string;
  buyer_name: string;
  destination_location: string;
  buyer_type: string;
  allocated_quantity_kg: number;
  vehicle_number: string;
  is_refrigerated: boolean;
  distance_km: number;
  estimated_transit_hours: number;
  transport_cost: number;
  net_margin: number;
  explanation: string;
  expected_revenue?: number;
  expected_gross_revenue?: number;
  offered_price_per_kg?: number;
}

interface ColdStorage {
  id: string;
  name: string;
  location: string;
  total_capacity_kg: number;
  current_utilization_kg: number;
  temperature_celsius: number;
}

interface FarmerViewProps {
  batches: ProduceBatch[];
  recommendations: AllocationRec[];
  storages: ColdStorage[];
  onOpenRegisterModal: () => void;
  onRefresh: () => void;
  loading: boolean;
  onSwitchToManager: () => void;
}

const TRANSLATIONS = {
  en: {
    appTitle: "KISAN MITRA",
    appSubtitle: "Simple Post-Harvest Crop & Cash Guide",
    langName: "English",
    switchManager: "Switch to Logistics Manager View",
    listening: "Speaking...",
    listenAll: "Listen to Daily Crop Advice",
    stopAudio: "Stop Voice",
    registerCrop: "Register New Crop",
    refresh: "Refresh Data",
    weatherTitle: "Today's Temperature & Sun Advisory",
    weatherAlert: "34°C Heatwave: High heat accelerates decay by 2.2x. Move produce to shaded shelter or arrange morning transport.",
    emergencyAlert: "Urgent Attention Needed!",
    emergencyDesc: "Some produce is decaying fast due to heat. Sell today or shift to cold store.",
    myCrops: "My Crops & Days Left",
    noCrops: "No active crops registered. Tap the green button below to add your harvest.",
    daysLeft: "days left to sell",
    safe: "Safe",
    sellSoon: "Sell Today",
    danger: "Urgent - Sell Immediately",
    whereToSell: "Best Buyers & Cash in Hand",
    buyer: "Buyer",
    cash: "Net Cash Payout",
    truck: "Assigned Truck",
    coldRoom: "Refrigerated",
    ambientRoom: "Normal Truck",
    callHelp: "Call Kisan Helpline (1800-180-1551)",
    coldStorageTitle: "Safe Cold Storage Nearby",
    availableSpace: "Available space to keep crops cool and stop spoilage",
    kgFree: "kg free space",
    bookColdRoom: "Reserve Space",
    openHeap: "Open Field / Sun",
    shadedShed: "Shaded Shed",
    coldStore: "Cold Store",
    cropsEmoji: {
      Tomato: "🍅",
      Potato: "🥔",
      Onion: "🧅",
      Mango: "🥭",
      Apple: "🍎",
    } as Record<string, string>,
    cropsName: {
      Tomato: "Tomato",
      Potato: "Potato",
      Onion: "Onion",
      Mango: "Mango",
      Apple: "Apple",
    } as Record<string, string>,
  },
  hi: {
    appTitle: "किसान साथी",
    appSubtitle: "सरल फसल सुरक्षा और सही दाम साथी",
    langName: "हिंदी",
    switchManager: "अधिकारी / ऑपरेशन्स व्यू देखें",
    listening: "आवाज़ चल रही है...",
    listenAll: "आज की पूरी सलाह सुनें",
    stopAudio: "आवाज़ रोकें",
    registerCrop: "नई फसल दर्ज करें",
    refresh: "ताज़ा करें",
    weatherTitle: "आज का मौसम व गर्मी की सलाह",
    weatherAlert: "34°C तेज धूप: गर्मी से टमाटर और सब्जियां 2 गुना तेजी से पक रही हैं। दोपहर से पहले गाड़ी में लोड करें या शेड में रखें।",
    emergencyAlert: "ज़रूरी सूचना: फसल को गर्मी का खतरा!",
    emergencyDesc: "गर्मी के कारण आपकी कुछ फसल 2 दिन में खराब हो सकती है। इसे तुरंत मंडी भेजें या कोल्ड स्टोर में रखें।",
    myCrops: "मेरी फसल और बचे हुए दिन",
    noCrops: "अभी कोई फसल दर्ज नहीं है। नीचे दिए गए हरे बटन से अपनी फसल जोड़ें।",
    daysLeft: "दिन बचे हैं बेचने के लिए",
    safe: "सुरक्षित",
    sellSoon: "आज या कल बेचें",
    danger: "तुरंत बेचें (खराब होने का डर)",
    whereToSell: "कहाँ बेचें और कितने पैसे मिलेंगे",
    buyer: "खरीदार व्यापारी",
    cash: "हाथ में आने वाला नकद",
    truck: "भेजने वाली गाड़ी",
    coldRoom: "ठंडी गाड़ी (AC)",
    ambientRoom: "सामान्य गाड़ी",
    callHelp: "किसान हेल्पलाइन (1800-180-1551)",
    coldStorageTitle: "पास का ठंडा गोदाम (कोल्ड स्टोर)",
    availableSpace: "फसल को धूप और सड़ने से बचाने के लिए खाली जगह",
    kgFree: "किलो जगह खाली है",
    bookColdRoom: "जगह बुक करें",
    openHeap: "खेत / धूप में",
    shadedShed: "छायादार शेड में",
    coldStore: "कोल्ड स्टोर में",
    cropsEmoji: {
      Tomato: "🍅",
      Potato: "🥔",
      Onion: "🧅",
      Mango: "🥭",
      Apple: "🍎",
    } as Record<string, string>,
    cropsName: {
      Tomato: "टमाटर",
      Potato: "आलू",
      Onion: "प्याज",
      Mango: "आम",
      Apple: "सेब",
    } as Record<string, string>,
  },
  ta: {
    appTitle: "விவசாயி தோழன்",
    appSubtitle: "பயிர் பாதுகாப்பு மற்றும் லாப வழிகாட்டி",
    langName: "தமிழ்",
    switchManager: "மேலாளர் பார்வைக்கு மாறவும்",
    listening: "குரல் கேட்கிறது...",
    listenAll: "இன்றைய ஆலோசனையைக் கேளுங்கள்",
    stopAudio: "நிறுத்து",
    registerCrop: "புதிய பயிரைப் பதிவு செய்க",
    refresh: "புதுப்பிக்கவும்",
    weatherTitle: "இன்றைய வானிலை மற்றும் வெயில் எச்சரிக்கை",
    weatherAlert: "34°C வெயில்: அதிக வெப்பத்தால் காய்கறிகள் வேகமாக அழுகும் அபாயம். பயிரை நிழலில் வைக்கவும்.",
    emergencyAlert: "முக்கிய எச்சரிக்கை!",
    emergencyDesc: "வெப்பத்தால் பயிர் விரைவில் அழுகும் அபாயம். இன்றே விற்கவும் அல்லது குளிர்பதன கிடங்கில் வைக்கவும்.",
    myCrops: "என் பயிர்கள் மற்றும் மீதமுள்ள நாட்கள்",
    noCrops: "பயிர்கள் எதுவும் இல்லை. கீழே உள்ள பச்சை பொத்தானை அழுத்தி பயிரைச் சேர்க்கவும்.",
    daysLeft: "நாட்கள் மீதமுள்ளன",
    safe: "பாதுகாப்பானது",
    sellSoon: "இன்றே விற்கவும்",
    danger: "உடனடியாக விற்கவும்",
    whereToSell: "எங்கு விற்க வேண்டும் & கிடைக்கும் பணம்",
    buyer: "வாங்குபவர்",
    cash: "கிடைக்கும் பணம்",
    truck: "ஒதுக்கப்பட்ட வாகனம்",
    coldRoom: "குளிர்சாதன வாகனம்",
    ambientRoom: "சாதாரண வாகனம்",
    callHelp: "உதவி எண் (1800-180-1551)",
    coldStorageTitle: "அருகிலுள்ள குளிர்பதன கிடங்கு",
    availableSpace: "பயிர்களைப் பாதுகாக்க மீதமுள்ள இடம்",
    kgFree: "கிலோ காலி இடம்",
    bookColdRoom: "இடம் முன்பதிவு செய்க",
    openHeap: "வெயிலில் / வயலில்",
    shadedShed: "நிழல் கொட்டகையில்",
    coldStore: "குளிர் கிடங்கில்",
    cropsEmoji: {
      Tomato: "🍅",
      Potato: "🥔",
      Onion: "🧅",
      Mango: "🥭",
      Apple: "🍎",
    } as Record<string, string>,
    cropsName: {
      Tomato: "தக்காளி",
      Potato: "உருளைக்கிழங்கு",
      Onion: "வெங்காயம்",
      Mango: "மாம்பழம்",
      Apple: "ஆப்பிள்",
    } as Record<string, string>,
  },
};

export function FarmerView({
  batches,
  recommendations,
  storages,
  onOpenRegisterModal,
  onRefresh,
  loading,
  onSwitchToManager,
}: FarmerViewProps) {
  const [lang, setLang] = useState<FarmerLanguage>("hi");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [bookedStorageId, setBookedStorageId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  // Helper for speech synthesis
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Voice playback is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === "hi") {
      utterance.lang = "hi-IN";
    } else if (lang === "ta") {
      utterance.lang = "ta-IN";
    } else {
      utterance.lang = "en-IN";
    }
    utterance.rate = 0.88; // Slower cadence for rural clarity

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Build comprehensive spoken daily advisory
  const playOverviewSpeech = () => {
    let message = "";
    if (lang === "hi") {
      message = "नमस्ते किसान भाई! किसान साथी में आपका स्वागत है। ";
      message += "आज तापमान 34 डिग्री है। तेज गर्मी से फसल को बचाने के लिए इसे धूप में न रखें। ";
      if (batches.length === 0) {
        message += "अभी आपकी कोई फसल दर्ज नहीं है। नीचे दिए गए हरे बटन से अपनी फसल दर्ज करें।";
      } else {
        const critical = batches.filter((b) => b.remaining_shelf_life_days <= 3);
        if (critical.length > 0) {
          message += `सावधान! आपकी ${critical.length} फसलें जल्दी खराब होने वाली हैं। `;
        }
        if (recommendations.length > 0) {
          const top = recommendations[0];
          const cropName = t.cropsName[top.crop_type] || top.crop_type;
          message += `आज का सबसे अच्छा सौदा ${top.buyer_name} के साथ है। आपके ${top.allocated_quantity_kg} किलो ${cropName} के लिए लगभग ${Math.round(top.net_margin)} रुपये मिलेंगे। गाड़ी संख्या है ${top.vehicle_number}। `;
        }
        if (storages.length > 0) {
          const free = storages[0].total_capacity_kg - storages[0].current_utilization_kg;
          message += `पास के कोल्ड स्टोर ${storages[0].name} में ${(free / 1000).toFixed(0)} टन जगह खाली है।`;
        }
      }
    } else if (lang === "ta") {
      message = "வணக்கம் விவசாயி தோழரே! ";
      message += "இன்றைய வெயில் 34 டிகிரி. பயிர்களை நிழலில் வைக்கவும். ";
      if (batches.length === 0) {
        message += "பயிர் எதுவும் பதிவு செய்யப்படவில்லை. கீழே உள்ள பொத்தானை அழுத்தவும்.";
      } else {
        if (recommendations.length > 0) {
          const top = recommendations[0];
          const cropName = t.cropsName[top.crop_type] || top.crop_type;
          message += `இன்றைய சிறந்த வாங்குபவர் ${top.buyer_name}. உங்கள் ${cropName} பயிருக்கு ${Math.round(top.net_margin)} ரூபாய் கிடைக்கும். லாரி எண் ${top.vehicle_number}.`;
        }
      }
    } else {
      message = "Welcome farmer! Today's temperature is 34 degrees Celsius. Keep harvested produce shaded. ";
      if (recommendations.length > 0) {
        const top = recommendations[0];
        message += `Today's best buyer is ${top.buyer_name}. Expected cash payout is ${Math.round(top.net_margin)} rupees for your ${top.allocated_quantity_kg} kg of ${top.crop_type}. Assigned truck is ${top.vehicle_number}.`;
      }
    }

    speakText(message);
  };

  const handleBookStorage = (storageId: string, storageName: string) => {
    setBookedStorageId(storageId);
    const msg = lang === "hi"
      ? `बधाई! ${storageName} में आपकी जगह आरक्षित कर ली गई है। कोल्ड स्टोर प्रबंधक आपसे संपर्क करेंगे।`
      : `Confirmed! Space reserved at ${storageName}. Facility coordinator will call you.`;
    alert(msg);
  };

  // Find critical batches (< 3 days)
  const criticalBatches = batches.filter((b) => b.remaining_shelf_life_days <= 3.0);

  return (
    <div className="space-y-6 pb-24">
      {/* 1. TOP HEADER BANNER (Deck-DNA Light Theme) */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Hindi/Tamil Title */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                {t.appTitle}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E8F5E9] text-[#107C41] border border-[#C8E6C9]">
                आसान साथी
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6E6E73] mt-1 font-medium">
              {t.appSubtitle}
            </p>
          </div>

          {/* Simple Big Language Switcher */}
          <div className="flex items-center gap-1.5 bg-[#F5F5F7] p-1.5 rounded-2xl border border-neutral-200">
            {(["hi", "ta", "en"] as FarmerLanguage[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  lang === l
                    ? "bg-[#107C41] text-white shadow-sm scale-100"
                    : "text-[#4B5563] hover:text-[#1D1D1F] hover:bg-white"
                }`}
              >
                {l === "hi" ? "हिंदी" : l === "ta" ? "தமிழ்" : "English"}
              </button>
            ))}
          </div>
        </div>

        {/* 🔊 BIG AUDIO ADVISORY BUTTON */}
        <div>
          <button
            onClick={playOverviewSpeech}
            className={`w-full min-h-[58px] px-5 py-3.5 rounded-2xl flex items-center justify-center gap-3 font-extrabold text-base sm:text-lg transition-all cursor-pointer active:scale-[0.98] shadow-sm ${
              isSpeaking
                ? "bg-[#FFF4E5] text-[#B76E00] border-2 border-[#FFE0B2] animate-pulse"
                : "bg-[#107C41] hover:bg-[#0D6535] text-white border border-[#107C41]"
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-6 h-6 stroke-[2.5]" />
                <span>{t.stopAudio}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-6 h-6 stroke-[2.5]" />
                <span>🔊 {t.listenAll}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. WEATHER & HEAT STRESS ADVISORY */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9E6] border border-[#FFE082] flex items-start gap-3.5 text-[#1D1D1F]">
        <div className="p-2.5 rounded-xl bg-[#FFE082] text-[#B76E00] shrink-0 mt-0.5">
          <Sun className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-bold text-[#B76E00]">
            {t.weatherTitle} (34°C)
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-medium">
            {t.weatherAlert}
          </p>
        </div>
      </div>

      {/* 3. URGENT SPOILAGE ALERT (if any crop has <= 3 days left) */}
      {criticalBatches.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#FFEBEE] border-2 border-[#FFCDD2] text-[#C62828] space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#FFCDD2] text-[#C62828] shrink-0">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#C62828]">
                {t.emergencyAlert} ({criticalBatches.length} {lang === "hi" ? "फसल खतरे में" : "crops at risk"})
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-1 leading-relaxed">
                {t.emergencyDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION 1: WHERE TO SELL & CASH IN HAND (कहाँ बेचें और कितने पैसे मिलेंगे) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
            <span>💰</span>
            <span>{t.whereToSell}</span>
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#107C41]">
            {recommendations.length} {lang === "hi" ? "खरीदार तैयार हैं" : "Buyers ready"}
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-neutral-200/80 text-center text-[#6E6E73] text-sm">
            {lang === "hi"
              ? "खरीदार और गाड़ियां अपडेट हो रही हैं..."
              : "Buyer allocations updating..."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 2).map((rec, idx) => {
              const cropEmoji = t.cropsEmoji[rec.crop_type] || "🌾";
              const cropLocalName = t.cropsName[rec.crop_type] || rec.crop_type;
              const unitPrice =
                rec.offered_price_per_kg ??
                (rec.allocated_quantity_kg > 0
                  ? (
                      (rec.expected_revenue ?? rec.net_margin) /
                      rec.allocated_quantity_kg
                    ).toFixed(1)
                  : "40");

              const readBuyerCard = () => {
                let speech = "";
                if (lang === "hi") {
                  speech = `खरीदार है ${rec.buyer_name}। वे आपके ${rec.allocated_quantity_kg} किलो ${cropLocalName} के लिए कुल लगभग ${Math.round(rec.net_margin)} रुपये नकद देंगे। भाव है ₹${unitPrice} प्रति किलो। गाड़ी नंबर है ${rec.vehicle_number}।`;
                } else if (lang === "ta") {
                  speech = `வாங்குபவர் ${rec.buyer_name}. உங்கள் ${cropLocalName} பயிருக்கு ${Math.round(rec.net_margin)} ரூபாய் கிடைக்கும். லாரி எண் ${rec.vehicle_number}.`;
                } else {
                  speech = `Buyer is ${rec.buyer_name}. Total cash in hand is approximately ${Math.round(rec.net_margin)} rupees for ${rec.allocated_quantity_kg} kg of ${cropLocalName}. Assigned vehicle is ${rec.vehicle_number}.`;
                }
                speakText(speech);
              };

              return (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-[#107C41]/30 hover:border-[#107C41] shadow-[0_2px_12px_rgba(0,0,0,0.05)] space-y-4 transition-all"
                >
                  {/* Top: Crop Emoji & Cash In Hand */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl p-2 rounded-2xl bg-[#F5F5F7] border border-neutral-200">
                        {cropEmoji}
                      </span>
                      <div>
                        <span className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
                          {cropLocalName}
                        </span>
                        <p className="text-xs sm:text-sm text-[#6E6E73] font-medium">
                          {rec.allocated_quantity_kg.toLocaleString()} kg (
                          {Math.round(rec.allocated_quantity_kg / 50)} {lang === "hi" ? "बोरी" : "sacks"})
                        </p>
                      </div>
                    </div>

                    {/* Cash In Hand Box */}
                    <div className="text-right bg-[#E8F5E9] border border-[#C8E6C9] px-3.5 py-2 rounded-2xl">
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#107C41] font-bold block">
                        {t.cash}
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-[#107C41] tabular-nums">
                        ₹{Math.round(rec.net_margin).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Buyer & Truck Details */}
                  <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-neutral-200/80 space-y-2.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6E6E73] font-medium">{t.buyer}:</span>
                      <span className="font-bold text-[#1D1D1F] text-right">
                        {rec.buyer_name} ({rec.destination_location})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#6E6E73] font-medium">{t.truck}:</span>
                      <span className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-[#107C41]" />
                        <span>{rec.vehicle_number}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#E8F5E9] text-[#107C41] border border-[#C8E6C9]">
                          {rec.is_refrigerated ? t.coldRoom : t.ambientRoom}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#6E6E73] font-medium">
                        {lang === "hi" ? "भाव (प्रति किलो)" : "Price per kg"}:
                      </span>
                      <span className="font-bold text-[#107C41] tabular-nums text-sm sm:text-base">
                        ₹{unitPrice}/kg
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 text-[11px] text-[#6E6E73]">
                      <span>{lang === "hi" ? "पहुँचने का समय" : "Transit"}: {rec.estimated_transit_hours}h ({rec.distance_km} km)</span>
                      <span className="text-[#107C41] font-semibold">✓ {lang === "hi" ? "पुष्टि की गई" : "Confirmed"}</span>
                    </div>
                  </div>

                  {/* Card Voice Action Button */}
                  <button
                    onClick={readBuyerCard}
                    className="w-full min-h-[46px] rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-200"
                  >
                    <Volume2 className="w-4 h-4 text-[#107C41]" />
                    <span>{lang === "hi" ? "यह सौदा बोलकर सुनें" : "Listen to this buyer details"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. SECTION 2: MY CROPS & DAYS REMAINING (मेरी फसल और बचे हुए दिन) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
            <span>📦</span>
            <span>{t.myCrops}</span>
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F5F7] text-[#4B5563]">
            {batches.length} {lang === "hi" ? "फसलें दर्ज हैं" : "crops registered"}
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-neutral-200/80 text-center space-y-4">
            <p className="text-[#6E6E73] text-sm leading-relaxed max-w-md mx-auto">
              {t.noCrops}
            </p>
            <button
              onClick={onOpenRegisterModal}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#107C41] hover:bg-[#0D6535] text-white font-extrabold text-sm cursor-pointer shadow-md"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>{t.registerCrop}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((b) => {
              const days = b.remaining_shelf_life_days;
              const isUrgent = days <= 3.0;
              const isWarning = days > 3.0 && days <= 5.0;

              const cropEmoji = t.cropsEmoji[b.crop_type] || "🌾";
              const cropLocalName = t.cropsName[b.crop_type] || b.crop_type;

              const storageDesc =
                b.storage_condition === "cold_storage"
                  ? t.coldStore
                  : b.storage_condition === "ventilated_shed"
                  ? t.shadedShed
                  : t.openHeap;

              const statusBadge = isUrgent
                ? {
                    bg: "bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828]",
                    bar: "bg-[#C62828]",
                    label: t.danger,
                  }
                : isWarning
                ? {
                    bg: "bg-[#FFF4E5] border-[#FFE0B2] text-[#B76E00]",
                    bar: "bg-[#B76E00]",
                    label: t.sellSoon,
                  }
                : {
                    bg: "bg-[#E8F5E9] border-[#C8E6C9] text-[#107C41]",
                    bar: "bg-[#107C41]",
                    label: t.safe,
                  };

              const readBatchStatus = () => {
                let speech = "";
                if (lang === "hi") {
                  speech = `आपकी ${cropLocalName} की ${b.quantity_kg} किलो फसल ${storageDesc} में रखी है। इसमें लगभग ${days.toFixed(0)} दिन बचे हैं। स्थिति है: ${statusBadge.label}।`;
                } else if (lang === "ta") {
                  speech = `உங்கள் ${cropLocalName} பயிர் விற்க ${days.toFixed(0)} நாட்கள் உள்ளன. நிலை: ${statusBadge.label}.`;
                } else {
                  speech = `Your ${b.quantity_kg} kg of ${b.crop_type} stored in ${storageDesc} has ${days.toFixed(0)} days left. Status: ${statusBadge.label}.`;
                }
                speakText(speech);
              };

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-white border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3.5 flex flex-col justify-between"
                >
                  <div>
                    {/* Top: Crop Emoji & Name */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-2xl bg-[#F5F5F7] border border-neutral-200">
                          {cropEmoji}
                        </span>
                        <div>
                          <span className="text-base sm:text-lg font-bold text-[#1D1D1F]">
                            {cropLocalName}
                          </span>
                          <span className="text-xs text-[#6E6E73] block font-medium">
                            {b.quantity_kg.toLocaleString()} kg ({Math.round(b.quantity_kg / 50)} बोरी)
                          </span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusBadge.bg}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Massive Days Counter */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-[#F8F9FA] border border-neutral-200 text-center">
                      <div className="text-3xl sm:text-4xl font-black text-[#1D1D1F] tabular-nums tracking-tight">
                        {days.toFixed(0)}{" "}
                        <span className="text-xs sm:text-sm font-semibold text-[#6E6E73] uppercase tracking-wider">
                          {t.daysLeft}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-[#E5E5EA] overflow-hidden mt-2.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${statusBadge.bar}`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((days / Math.max(1, b.initial_shelf_life_days)) * 100)
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-[#6E6E73] font-medium">
                        <span>{lang === "hi" ? "स्थान" : "Storage"}: {storageDesc}</span>
                        <span>{lang === "hi" ? "कटाई" : "Harvested"}: {b.harvest_date}</span>
                      </div>
                    </div>
                  </div>

                  {/* 🔊 Speak Button */}
                  <button
                    onClick={readBatchStatus}
                    className="w-full min-h-[44px] rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-200"
                  >
                    <Volume2 className="w-4 h-4 text-[#107C41]" />
                    <span>{lang === "hi" ? "इस फसल का हाल सुनें" : "Listen Status"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. SECTION 3: NEARBY COLD STORAGE (सुरक्षित ठंडा गोदाम) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Snowflake className="w-5 h-5 text-[#107C41]" />
            <h3 className="text-sm sm:text-base font-bold text-[#1D1D1F]">
              {t.coldStorageTitle}
            </h3>
          </div>
          <span className="text-xs text-[#107C41] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] border border-[#C8E6C9]">
            ✓ उपलब्ध (Available)
          </span>
        </div>

        <p className="text-xs text-[#6E6E73]">
          {t.availableSpace}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {storages.map((s) => {
            const free = s.total_capacity_kg - s.current_utilization_kg;
            const isBooked = bookedStorageId === s.id;
            return (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200 flex flex-col justify-between gap-3 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-[#1D1D1F] text-sm block">
                      {s.name}
                    </span>
                    <span className="text-[#6E6E73] text-[11px]">
                      {s.location} • {s.temperature_celsius}°C ठंडी हवा
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-[#107C41] block tabular-nums">
                      {(free / 1000).toFixed(0)}k kg
                    </span>
                    <span className="text-[10px] text-[#6E6E73] font-medium">
                      {t.kgFree}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleBookStorage(s.id, s.name)}
                  disabled={isBooked}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isBooked
                      ? "bg-[#E8F5E9] text-[#107C41] border border-[#C8E6C9]"
                      : "bg-[#107C41] hover:bg-[#0D6535] text-white"
                  }`}
                >
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>{isBooked ? "✓ बुक हो गया (Reserved)" : t.bookColdRoom}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. MANDI HELPLINE & EMERGENCY SUPPORT */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white text-[#107C41] shadow-xs">
            <PhoneCall className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-bold text-[#1D1D1F] text-sm block">
              {t.callHelp}
            </span>
            <span className="text-xs text-[#4B5563]">
              {lang === "hi" ? "मुफ्त सरकारी कृषि एवं मंडी सहायता सेवा" : "Toll-free Kisan Call Center advisory service"}
            </span>
          </div>
        </div>

        <a
          href="tel:18001801551"
          className="px-4 py-2 rounded-xl bg-[#107C41] hover:bg-[#0D6535] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>1800-180-1551</span>
        </a>
      </div>

      {/* 8. FLOATING BOTTOM DOCK: Register Crop & Call Help */}
      <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 bg-white/95 backdrop-blur-xl border border-neutral-200/90 p-2.5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-3">
        <button
          onClick={onOpenRegisterModal}
          className="flex-1 min-h-[52px] px-5 py-3 rounded-2xl bg-[#107C41] hover:bg-[#0D6535] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>{t.registerCrop}</span>
        </button>

        <a
          href="tel:18001801551"
          className="min-h-[52px] px-5 py-3 rounded-2xl bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-neutral-200 transition-all cursor-pointer"
          title="Kisan Call Center: 1800-180-1551"
        >
          <PhoneCall className="w-4 h-4 text-[#107C41]" />
          <span className="hidden sm:inline">हेल्पलाइन</span>
          <span className="sm:hidden">कॉल</span>
        </a>
      </div>

      {/* DISCRETE SWITCH TO MANAGER MODE */}
      <div className="pt-6 text-center">
        <button
          onClick={onSwitchToManager}
          className="inline-flex items-center gap-1.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] transition-colors py-2 px-3.5 rounded-xl border border-neutral-200 bg-white shadow-xs cursor-pointer"
        >
          <span>⚙️ {t.switchManager}</span>
        </button>
      </div>
    </div>
  );
}
