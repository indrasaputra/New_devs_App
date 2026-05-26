import React, { useEffect, useState } from "react";
import { RevenueSummary } from "./RevenueSummary";
import { SecureAPI } from "../lib/secureApi";

interface Property {
  id: string;
  name: string;
}

const Dashboard: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setPropertiesLoading(true);
        const result: any = await SecureAPI.getProperties();
        if (cancelled) return;
        const list: Property[] = (result?.data ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
        }));
        setProperties(list);
        setSelectedProperty(list[0]?.id ?? "");
        setPropertiesError("");
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load properties", err);
          setPropertiesError("Failed to load properties");
        }
      } finally {
        if (!cancelled) setPropertiesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-4 lg:p-6 min-h-full">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Property Management Dashboard</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h2 className="text-lg lg:text-xl font-medium text-gray-900 mb-2">Revenue Overview</h2>
                <p className="text-sm lg:text-base text-gray-600">
                  Monthly performance insights for your properties
                </p>
              </div>

              <div className="flex flex-col sm:items-end">
                <label className="text-xs font-medium text-gray-700 mb-1">Select Property</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  disabled={propertiesLoading || properties.length === 0}
                  className="block w-full sm:w-auto min-w-[200px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {propertiesLoading && <option>Loading…</option>}
                  {!propertiesLoading && properties.length === 0 && (
                    <option>No properties found</option>
                  )}
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                {propertiesError && (
                  <p className="text-xs text-red-500 mt-1">{propertiesError}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {selectedProperty ? (
              <RevenueSummary propertyId={selectedProperty} />
            ) : !propertiesLoading ? (
              <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
                Select a property to view its revenue.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
