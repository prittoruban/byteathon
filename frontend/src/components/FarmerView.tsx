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
  Sparkles,
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
    appSubtitle: "Post-Harvest Crop & Cash Guide",
    langName: "English",
    switchManager: "Switch to Logistics Manager View",
    listening: "Speaking...",
    listenAll: "Listen to Daily Advice",
    stopAudio: "Stop Voice",
    registerCrop: "Register New Crop",
    refresh: "Refresh Data",
    emergencyAlert: "Urgent Attention Needed!",
    emergencyDesc: "Some produce is decaying fast due to heat. Sell today or store safely.",
    myCrops: "My Crops & Days Left",
    noCrops: "No active crops registered. Tap the green button below to add your harvest.",
    daysLeft: "days left to sell",
    safe: "Safe",
    sellSoon: "Sell Today",
    danger: "Danger - Sell Immediately",
    whereToSell: "Where to Sell & Cash in Hand",
    buyer: "Buyer",
    cash: "Expected Cash",
    truck: "Assigned Vehicle",
    coldRoom: "Refrigerated",
    ambientRoom: "Normal Truck",
    callHelp: "Call Mandi Sahayak",
    coldStorageTitle: "Safe Cold Storage Nearby",
    availableSpace: "Available space to save crops from heat",
    kgFree: "kg free space",
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
    appSubtitle: "फसल सुरक्षा और सही दाम साथी",
    langName: "हिंदी",
    switchManager: "अधिकारी / ऑपरेशन्स व्यू देखें",
    listening: "आवाज़ चल रही है...",
    listenAll: "आज की सलाह सुनें",
    stopAudio: "आवाज़ रोकें",
    registerCrop: "नई फसल दर्ज करें",
    refresh: "ताज़ा करें",
    emergencyAlert: "ज़रूरी सूचना: फसल को खतरा!",
    emergencyDesc: "गर्मी के कारण आपकी कुछ फसल जल्दी खराब हो सकती है। इसे आज ही बेचें।",
    myCrops: "मेरी फसल और बचे हुए दिन",
    noCrops: "अभी कोई फसल दर्ज नहीं है। नीचे दिए गए हरे बटन से अपनी फसल जोड़ें।",
    daysLeft: "दिन बचे हैं बेचने के लिए",
    safe: "सुरक्षित",
    sellSoon: "आज या कल बेचें",
    danger: "तुरंत बेचें (खराब होने का डर)",
    whereToSell: "कहाँ बेचें और कितने पैसे मिलेंगे",
    buyer: "खरीदार व्यापारी",
    cash: "हाथ में आने वाला पैसा",
    truck: "भेजने वाली गाड़ी",
    coldRoom: "ठंडी गाड़ी (Refrigerated)",
    ambientRoom: "सामान्य गाड़ी",
    callHelp: "मंडी सहायक को फोन करें",
    coldStorageTitle: "पास का ठंडा गोदाम (कोल्ड स्टोर)",
    availableSpace: "फसल को धूप और सड़ने से बचाने के लिए खाली जगह",
    kgFree: "किलो जगह खाली है",
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
    emergencyAlert: "முக்கிய எச்சரிக்கை!",
    emergencyDesc: "வெப்பத்தால் பயிர் விரைவில் அழுகும் அபாயம். இன்றே விற்கவும்.",
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
    callHelp: "உதவிக்கு அழைக்கவும்",
    coldStorageTitle: "அருகிலுள்ள குளிர்பதன கிடங்கு",
    availableSpace: "பயிர்களைப் பாதுகாக்க மீதமுள்ள இடம்",
    kgFree: "கிலோ காலி இடம்",
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
    utterance.rate = 0.9; // Slightly slower for clear rural comprehension

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Build spoken daily advice
  const playOverviewSpeech = () => {
    let message = "";
    if (lang === "hi") {
      message = "नमस्ते किसान भाई! ";
      if (batches.length === 0) {
        message += "अभी आपकी कोई फसल दर्ज नहीं है। नीचे दिए गए बटन से अपनी फसल दर्ज करें।";
      } else {
        const critical = batches.filter((b) => b.remaining_shelf_life_days <= 3);
        if (critical.length > 0) {
          message += `सावधान! आपकी ${critical.length} फसलें जल्दी खराब हो सकती हैं। `;
        }
        if (recommendations.length > 0) {
          const top = recommendations[0];
          const cropName = t.cropsName[top.crop_type] || top.crop_type;
          message += `आज का सबसे अच्छा खरीदार ${top.buyer_name} है। वे आपके ${top.allocated_quantity_kg} किलो ${cropName} के लिए लगभग ${Math.round(top.net_margin)} रुपये देंगे। गाड़ी संख्या है ${top.vehicle_number}।`;
        } else {
          message += "आपकी फसल अभी सुरक्षित है।";
        }
      }
    } else if (lang === "ta") {
      message = "வணக்கம் விவசாயி தோழரே! ";
      if (batches.length === 0) {
        message += "தற்போது பயிர் எதுவும் பதிவு செய்யப்படவில்லை.";
      } else {
        if (recommendations.length > 0) {
          const top = recommendations[0];
          const cropName = t.cropsName[top.crop_type] || top.crop_type;
          message += `இன்றைய சிறந்த வாங்குபவர் ${top.buyer_name}. உங்கள் ${cropName} பயிருக்கு சுமார் ${Math.round(top.net_margin)} ரூபாய் கிடைக்கும். லாரி எண் ${top.vehicle_number}.`;
        }
      }
    } else {
      message = "Welcome farmer! ";
      if (recommendations.length > 0) {
        const top = recommendations[0];
        message += `Today's best buyer is ${top.buyer_name}. You will get approximately ${Math.round(top.net_margin)} rupees for your ${top.allocated_quantity_kg} kg of ${top.crop_type}. Assigned truck is ${top.vehicle_number}.`;
      } else {
        message += "Your logged crops are currently monitored and safe.";
      }
    }

    speakText(message);
  };

  // Find critical batches
  const criticalBatches = batches.filter((b) => b.remaining_shelf_life_days <= 2.5);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner: Big Language Selector & Voice Announcement */}
      <div className="bg-[#141416] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Hindi/Tamil Title */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {t.appTitle}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/25">
                आसान साथी
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5 font-medium">
              {t.appSubtitle}
            </p>
          </div>

          {/* Simple Language Pills (Huge touch targets) */}
          <div className="flex items-center gap-1.5 bg-[#1C1C1E] p-1.5 rounded-2xl border border-white/[0.08]">
            {(["hi", "ta", "en"] as FarmerLanguage[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  lang === l
                    ? "bg-[#30D158] text-black shadow-md scale-100"
                    : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {l === "hi" ? "हिंदी" : l === "ta" ? "தமிழ்" : "English"}
              </button>
            ))}
          </div>
        </div>

        {/* 🔊 BIG VOICE ADVISORY BUTTON */}
        <div className="pt-2">
          <button
            onClick={playOverviewSpeech}
            className={`w-full min-h-[58px] px-5 py-3.5 rounded-2xl flex items-center justify-center gap-3 font-bold text-base sm:text-lg transition-all cursor-pointer active:scale-[0.98] shadow-lg ${
              isSpeaking
                ? "bg-[#FF9F0A] text-black border border-amber-400 animate-pulse"
                : "bg-white text-black hover:bg-neutral-200 border border-white"
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-6 h-6 stroke-[2.5]" />
                <span>{t.stopAudio}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-6 h-6 stroke-[2.5] text-[#30D158]" />
                <span>🔊 {t.listenAll}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EMERGENCY HEATWAVE / SPOILAGE WARNING (Only if crops are dying) */}
      {criticalBatches.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#FF453A]/10 border-2 border-[#FF453A]/40 text-white space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-[#FF453A]/20 text-[#FF453A] shrink-0">
              <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#FF453A]">
                {t.emergencyAlert}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1 leading-relaxed">
                {t.emergencyDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: WHERE TO SELL & CASH IN HAND (Kahan Bechein & Kitna Paisa) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>💰</span>
            <span>{t.whereToSell}</span>
          </h2>
          <span className="text-xs text-neutral-400 font-medium">
            {recommendations.length} {lang === "hi" ? "सुझाव उपलब्ध" : "buyers ready"}
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-6 rounded-3xl bg-[#141416] border border-white/[0.08] text-center text-neutral-400 text-sm">
            {lang === "hi"
              ? "सभी खरीदार और गाड़ियां अपडेट हो रही हैं..."
              : "Buyer allocations updating..."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 2).map((rec, idx) => {
              const cropEmoji = t.cropsEmoji[rec.crop_type] || "🌾";
              const cropLocalName = t.cropsName[rec.crop_type] || rec.crop_type;

              const readBuyerCard = () => {
                let speech = "";
                if (lang === "hi") {
                  speech = `खरीदार है ${rec.buyer_name}। वे आपके ${rec.allocated_quantity_kg} किलो ${cropLocalName} के लिए लगभग ${Math.round(rec.net_margin)} रुपये नकद देंगे। गाड़ी नंबर है ${rec.vehicle_number}।`;
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
                  className="p-5 sm:p-6 rounded-3xl bg-[#141416] border-2 border-white/[0.12] hover:border-[#30D158]/50 shadow-md space-y-4 transition-all"
                >
                  {/* Top: Crop & Massive Cash */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl p-2 rounded-2xl bg-[#1C1C1E] border border-white/[0.08]">
                        {cropEmoji}
                      </span>
                      <div>
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {cropLocalName}
                        </span>
                        <p className="text-xs sm:text-sm text-neutral-400 font-medium">
                          {rec.allocated_quantity_kg.toLocaleString()} kg
                        </p>
                      </div>
                    </div>

                    {/* Cash In Hand Box */}
                    <div className="text-right bg-[#30D158]/10 border border-[#30D158]/30 px-3.5 py-2 rounded-2xl">
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-neutral-300 font-bold block">
                        {t.cash}
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-[#30D158] tabular-nums">
                        ₹{Math.round(rec.net_margin).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Buyer & Truck Details in Plain Text */}
                  <div className="p-3.5 rounded-2xl bg-[#18181A] border border-white/[0.06] space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-medium">{t.buyer}:</span>
                      <span className="font-bold text-white text-right">
                        {rec.buyer_name} ({rec.destination_location})
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-medium">{t.truck}:</span>
                      <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-[#30D158]" />
                        <span>{rec.vehicle_number}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.08] text-neutral-300">
                          {rec.is_refrigerated ? t.coldRoom : t.ambientRoom}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-medium">
                        {lang === "hi" ? "भाव (प्रति किलो)" : "Price per kg"}:
                      </span>
                      <span className="font-bold text-[#30D158] tabular-nums text-sm">
                        ₹
                        {rec.offered_price_per_kg ??
                          (rec.allocated_quantity_kg > 0
                            ? (
                                (rec.expected_revenue ?? rec.net_margin) /
                                rec.allocated_quantity_kg
                              ).toFixed(1)
                            : "40")}
                        /kg
                      </span>
                    </div>
                  </div>

                  {/* Card Voice Action Button */}
                  <button
                    onClick={readBuyerCard}
                    className="w-full min-h-[46px] rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/[0.1]"
                  >
                    <Volume2 className="w-4 h-4 text-[#30D158]" />
                    <span>{lang === "hi" ? "यह जानकारी बोलकर सुनें" : "Listen to this buyer details"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: MY CROPS & DAYS REMAINING (Meri Fasal) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>📦</span>
            <span>{t.myCrops}</span>
          </h2>
          <span className="text-xs text-neutral-400 font-medium">
            {batches.length} {lang === "hi" ? "फसलें" : "crops"}
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#141416] border border-white/[0.08] text-center space-y-3">
            <p className="text-neutral-400 text-sm leading-relaxed">
              {t.noCrops}
            </p>
            <button
              onClick={onOpenRegisterModal}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#30D158] text-black font-bold text-sm cursor-pointer shadow-md"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>{t.registerCrop}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((b) => {
              const days = b.remaining_shelf_life_days;
              const isUrgent = days <= 2.5;
              const isWarning = days > 2.5 && days <= 5.0;
              const isSafe = days > 5.0;

              const cropEmoji = t.cropsEmoji[b.crop_type] || "🌾";
              const cropLocalName = t.cropsName[b.crop_type] || b.crop_type;

              const statusColor = isUrgent
                ? {
                    bg: "bg-[#FF453A]/10 border-[#FF453A]/40 text-[#FF453A]",
                    bar: "bg-[#FF453A]",
                    label: t.danger,
                  }
                : isWarning
                ? {
                    bg: "bg-[#FF9F0A]/10 border-[#FF9F0A]/40 text-[#FF9F0A]",
                    bar: "bg-[#FF9F0A]",
                    label: t.sellSoon,
                  }
                : {
                    bg: "bg-[#30D158]/10 border-[#30D158]/40 text-[#30D158]",
                    bar: "bg-[#30D158]",
                    label: t.safe,
                  };

              const readBatchStatus = () => {
                let speech = "";
                if (lang === "hi") {
                  speech = `आपकी ${cropLocalName} की ${b.quantity_kg} किलो फसल में लगभग ${days.toFixed(0)} दिन बचे हैं। स्थिति है: ${statusColor.label}।`;
                } else if (lang === "ta") {
                  speech = `உங்கள் ${cropLocalName} பயிர் விற்க ${days.toFixed(0)} நாட்கள் மீதமுள்ளன. நிலை: ${statusColor.label}.`;
                } else {
                  speech = `Your ${b.quantity_kg} kg of ${b.crop_type} has ${days.toFixed(0)} days left. Status is ${statusColor.label}.`;
                }
                speakText(speech);
              };

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-[#141416] border border-white/[0.08] shadow-sm space-y-3.5 flex flex-col justify-between"
                >
                  <div>
                    {/* Top: Big Emoji & Name */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-2xl bg-[#1C1C1E]">
                          {cropEmoji}
                        </span>
                        <div>
                          <span className="text-base sm:text-lg font-bold text-white">
                            {cropLocalName}
                          </span>
                          <span className="text-xs text-neutral-400 block font-medium">
                            {b.quantity_kg.toLocaleString()} kg
                          </span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusColor.bg}`}
                      >
                        {statusColor.label}
                      </span>
                    </div>

                    {/* Massive Days Counter */}
                    <div className="mt-4 p-3 rounded-2xl bg-[#18181A] border border-white/[0.06] text-center">
                      <div className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                        {days.toFixed(0)}{" "}
                        <span className="text-xs sm:text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                          {t.daysLeft}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${statusColor.bar}`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((days / Math.max(1, b.initial_shelf_life_days)) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 🔊 Speak Button */}
                  <button
                    onClick={readBatchStatus}
                    className="w-full min-h-[44px] rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/[0.08]"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#30D158]" />
                    <span>{lang === "hi" ? "हाल सुनें" : "Listen Status"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: NEARBY COLD STORAGE (सुरक्षित ठंडा गोदाम) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#141416] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-[#30D158]" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              {t.coldStorageTitle}
            </h3>
          </div>
          <span className="text-xs text-[#30D158] font-bold">
            {storages.length > 0 ? "✓ उपलब्ध (Active)" : "No storage"}
          </span>
        </div>

        <p className="text-xs text-neutral-400">
          {t.availableSpace}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {storages.map((s) => {
            const free = s.total_capacity_kg - s.current_utilization_kg;
            return (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl bg-[#18181A] border border-white/[0.06] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white text-sm block">
                    {s.name}
                  </span>
                  <span className="text-neutral-400 text-[11px]">
                    {s.location} • {s.temperature_celsius}°C ठंडी हवा
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-[#30D158] block tabular-nums">
                    {(free / 1000).toFixed(0)}k kg
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {t.kgFree}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FLOATING ACTION DOCK: Register Crop & Call Mandi Help */}
      <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 bg-[#1C1C1E]/95 backdrop-blur-xl border-2 border-white/[0.15] p-2.5 rounded-3xl shadow-2xl flex items-center gap-3">
        <button
          onClick={onOpenRegisterModal}
          className="flex-1 min-h-[52px] px-4 py-3 rounded-2xl bg-[#30D158] hover:bg-[#28b84d] active:scale-[0.98] text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>{t.registerCrop}</span>
        </button>

        <a
          href="tel:18001801551"
          className="min-h-[52px] px-4 py-3 rounded-2xl bg-white/[0.1] hover:bg-white/[0.18] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/[0.12] transition-all cursor-pointer"
          title="Kisan Call Center: 1800-180-1551"
        >
          <PhoneCall className="w-4 h-4 text-[#30D158]" />
          <span className="hidden sm:inline">{t.callHelp}</span>
          <span className="sm:hidden">हेल्प</span>
        </a>
      </div>

      {/* DISCRETE SWITCH TO LOGISTICS / ENTERPRISE MANAGER MODE */}
      <div className="pt-8 text-center">
        <button
          onClick={onSwitchToManager}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors py-2 px-3 rounded-xl border border-white/[0.06] bg-white/[0.02] cursor-pointer"
        >
          <span>⚙️ {t.switchManager}</span>
        </button>
      </div>
    </div>
  );
}
