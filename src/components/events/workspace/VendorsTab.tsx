/**
 * @file VendorsTab.tsx
 * @module components/events/workspace/VendorsTab
 * @description Workspace tab for viewing, filtering, and managing commercial vendor contracts,
 * quote comparisons, and status progressions with strict type validation.
 */

import { Plus } from "lucide-react";
import { Vendor, VendorStatusEnum } from "@/lib/types";
import { formatINR } from "@/lib/engines/budget";

/**
 * Props for the VendorsTab component.
 */
export interface VendorsTabProps {
  /** Master list of vendor records */
  vendors: Vendor[];
  /** Category-filtered list of vendors */
  filteredVendors: Vendor[];
  /** Current active category filter */
  vendorFilter: string;
  /** Callback to change category filter */
  setVendorFilter: (filter: string) => void;
  /** Callback to open the add vendor dialog */
  onOpenAddVendorModal: () => void;
  /** Callback to update a vendor record */
  onUpdateVendor: (vendor: Vendor, changes: Partial<Vendor>) => Promise<void>;
}

export function VendorsTab({
  vendors,
  filteredVendors,
  vendorFilter,
  setVendorFilter,
  onOpenAddVendorModal,
  onUpdateVendor,
}: VendorsTabProps) {
  return (
    <div
      role="tabpanel"
      id="tabpanel-vendors"
      aria-labelledby="tab-vendors"
      tabIndex={0}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-sm text-gray-500">{vendors.length} vendors • Track quotes, status, and contacts</p>
        </div>
        <button
          onClick={onOpenAddVendorModal}
          className="inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {["All", "Venue", "Catering", "Decor", "Photography", "More"].map((cat) => {
          const active = vendorFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setVendorFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED]"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            No vendors found in this category.
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#7C3AED] uppercase tracking-wide">{vendor.category}</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{vendor.businessName}</p>
                  {vendor.phone && <p className="text-xs text-gray-400 mt-0.5">{vendor.phone}</p>}
                </div>
                <select
                  value={vendor.status}
                  aria-label={`Status for ${vendor.businessName}`}
                  onChange={(e) => {
                    const parsed = VendorStatusEnum.safeParse(e.target.value);
                    if (parsed.success) {
                      void onUpdateVendor(vendor, { status: parsed.data });
                    }
                  }}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none ${
                    vendor.status === "booked"
                      ? "bg-[#D1FAE5] border-[#6EE7B7] text-[#065F46]"
                      : vendor.status === "quote_received"
                      ? "bg-[#FEF3C7] border-amber-300 text-[#92400E]"
                      : vendor.status === "contacted"
                      ? "bg-[#EDE9FE] border-[#C4B5FD] text-[#5B21B6]"
                      : "bg-gray-100 border-gray-200 text-gray-600"
                  }`}
                >
                  <option value="not_contacted">Not Contacted</option>
                  <option value="contacted">Contacted</option>
                  <option value="quote_received">Quote Received</option>
                  <option value="booked">Booked ✓</option>
                  <option value="not_proceeding">Not Proceeding</option>
                </select>
              </div>

              {/* Quote Comparison */}
              <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 font-medium">Estimated</p>
                  <p className="font-bold text-gray-900 text-sm">{formatINR(vendor.estimatedQuote)}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Final Quote</p>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={vendor.finalQuote}
                    aria-label={`Final quote for ${vendor.businessName}`}
                    onChange={(e) => onUpdateVendor(vendor, { finalQuote: Number(e.target.value) })}
                    className="w-full bg-white px-2 py-0.5 rounded-lg border border-gray-200 text-xs font-bold focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Questions to Ask */}
              {vendor.questionsToAsk && vendor.questionsToAsk.length > 0 && (
                <details className="group">
                  <summary className="text-xs font-bold text-[#7C3AED] cursor-pointer hover:underline">
                    {vendor.questionsToAsk.length} questions to ask →
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-gray-500 list-disc pl-4">
                    {vendor.questionsToAsk.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
