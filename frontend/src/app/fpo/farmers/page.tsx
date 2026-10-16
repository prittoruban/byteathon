"use client";

import React, { useState } from "react";

interface FarmerRecord {
  id: string;
  name: string;
  pm_kisan_id: string;
  village: string;
  taluka: string;
  acreage: number;
  primary_crops: string[];
  total_batches: number;
  phone: string;
}

export default function FPOFarmersDirectoryPage() {
  const [farmers, setFarmers] = useState<FarmerRecord[]>([
    {
      id: "f-01",
      name: "Ramesh Patel",
      pm_kisan_id: "MH-2024-910283",
      village: "Dindori",
      taluka: "Nashik",
      acreage: 4.5,
      primary_crops: ["Tomato", "Grapes"],
      total_batches: 18,
      phone: "+91-9822104921",
    },
    {
      id: "f-02",
      name: "Dr. Suresh Deshmukh",
      pm_kisan_id: "MH-2023-882194",
      village: "Ozar",
      taluka: "Niphad",
      acreage: 6.2,
      primary_crops: ["Strawberry", "Spinach"],
      total_batches: 24,
      phone: "+91-9823491022",
    },
    {
      id: "f-03",
      name: "Anil Jadhav",
      pm_kisan_id: "MH-2024-102938",
      village: "Pimpalgaon",
      taluka: "Niphad",
      acreage: 3.8,
      primary_crops: ["Onion", "Tomato"],
      total_batches: 14,
      phone: "+91-9876543210",
    },
    {
      id: "f-04",
      name: "Kavita Shinde",
      pm_kisan_id: "MH-2024-771928",
      village: "Sinnar",
      taluka: "Sinnar",
      acreage: 5.0,
      primary_crops: ["Bell Pepper", "Cucumber"],
      total_batches: 21,
      phone: "+91-9819283746",
    },
    {
      id: "f-05",
      name: "Bhausaheb More",
      pm_kisan_id: "MH-2022-449102",
      village: "Trimbak",
      taluka: "Trimbakeshwar",
      acreage: 7.4,
      primary_crops: ["Papaya", "Guava"],
      total_batches: 11,
      phone: "+91-9844019283",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    name: "",
    pm_kisan_id: "",
    village: "",
    taluka: "Nashik",
    acreage: 3.0,
    primary_crop: "Tomato",
    phone: "",
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmer.name || !newFarmer.pm_kisan_id) return;

    const record: FarmerRecord = {
      id: `f-${Date.now()}`,
      name: newFarmer.name,
      pm_kisan_id: newFarmer.pm_kisan_id,
      village: newFarmer.village || "Nashik Rural",
      taluka: newFarmer.taluka,
      acreage: Number(newFarmer.acreage),
      primary_crops: [newFarmer.primary_crop],
      total_batches: 0,
      phone: newFarmer.phone || "+91-9800000000",
    };

    setFarmers([record, ...farmers]);
    setShowAddModal(false);
    setNewFarmer({
      name: "",
      pm_kisan_id: "",
      village: "",
      taluka: "Nashik",
      acreage: 3.0,
      primary_crop: "Tomato",
      phone: "",
    });
    setSuccessMsg(`Farmer ${record.name} registered.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const filtered = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.pm_kisan_id.toLowerCase().includes(search.toLowerCase()) ||
      f.village.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Cluster Farmers Directory
          </h1>
          <p className="text-xs text-slate-500">
            Registered smallholders under the Nashik Agri-Cluster linked with PM-KISAN.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="h-7 px-3 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
        >
          Register Farmer
        </button>
      </div>

      {successMsg && (
        <div className="border border-slate-200 rounded-md bg-white p-3 text-xs text-slate-700">
          {successMsg}
        </div>
      )}

      {/* Filter Input */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Filter by name, PM-KISAN ID, or village..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none"
        />
        <div className="text-xs text-slate-500">
          {filtered.length} Farmers
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-300">
                <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">PM-KISAN ID</th>
                <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">Farmer Name</th>
                <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">Location</th>
                <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">Acreage</th>
                <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">Primary Crops</th>
                <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400">Batches</th>
                <th className="h-9 px-3 text-[11px] uppercase tracking-wide font-medium text-slate-400 text-right">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((farmer) => (
                <tr key={farmer.id} className="h-10 border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 text-[10px] font-mono uppercase tracking-wide text-slate-400">
                    {farmer.pm_kisan_id}
                  </td>
                  <td className="px-3 text-sm font-semibold text-slate-900">
                    {farmer.name}
                  </td>
                  <td className="px-3 text-xs text-slate-500">
                    {farmer.village}, {farmer.taluka}
                  </td>
                  <td className="px-3 text-xs text-slate-600 tabular-nums">
                    {farmer.acreage} ac
                  </td>
                  <td className="px-3 text-xs text-slate-600">
                    {farmer.primary_crops.join(", ")}
                  </td>
                  <td className="px-3 text-xs text-slate-600 tabular-nums">
                    {farmer.total_batches}
                  </td>
                  <td className="px-3 text-xs text-slate-500 font-mono text-right">
                    {farmer.phone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-md w-full p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Register Farmer in Cluster
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddFarmer} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balasaheb Gaikwad"
                  value={newFarmer.name}
                  onChange={(e) => setNewFarmer({ ...newFarmer, name: e.target.value })}
                  className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">PM-KISAN ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-2026-102938"
                  value={newFarmer.pm_kisan_id}
                  onChange={(e) => setNewFarmer({ ...newFarmer, pm_kisan_id: e.target.value })}
                  className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Village</label>
                  <input
                    type="text"
                    placeholder="e.g. Niphad"
                    value={newFarmer.village}
                    onChange={(e) => setNewFarmer({ ...newFarmer, village: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Acreage</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newFarmer.acreage}
                    onChange={(e) => setNewFarmer({ ...newFarmer, acreage: Number(e.target.value) })}
                    className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Primary Crop</label>
                  <select
                    value={newFarmer.primary_crop}
                    onChange={(e) => setNewFarmer({ ...newFarmer, primary_crop: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none cursor-pointer"
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Strawberry">Strawberry</option>
                    <option value="Spinach">Spinach</option>
                    <option value="Grapes">Grapes</option>
                    <option value="Bell Pepper">Bell Pepper</option>
                    <option value="Onion">Onion</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Phone</label>
                  <input
                    type="text"
                    placeholder="+91-..."
                    value={newFarmer.phone}
                    onChange={(e) => setNewFarmer({ ...newFarmer, phone: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-slate-200 text-xs text-slate-900 bg-white focus:border-slate-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-7 px-3 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-7 px-3 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
