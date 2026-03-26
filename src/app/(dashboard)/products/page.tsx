"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Package, Loader2, X, Globe, Trash2,
  ChevronDown, ChevronUp
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  features: string[];
  target_audience: string;
  usp: string;
  website_url: string;
  created_at: string;
}

interface ProductForm {
  name: string;
  description: string;
  benefits: string;
  features: string;
  target_audience: string;
  usp: string;
  website_url: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", benefits: "", features: "",
  target_audience: "", usp: "", website_url: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanUrl, setScanUrl] = useState("");
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleScan() {
    if (!scanUrl.trim()) return;
    setScanning(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan-url", url: scanUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const p = data.product;
      setForm({
        name: p.name || "",
        description: p.description || "",
        benefits: (p.benefits || []).join("\n"),
        features: (p.features || []).join("\n"),
        target_audience: p.targetAudience || "",
        usp: p.usp || "",
        website_url: scanUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Product name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          benefits: form.benefits.split("\n").filter(Boolean),
          features: form.features.split("\n").filter(Boolean),
          targetAudience: form.target_audience,
          usp: form.usp,
          websiteUrl: form.website_url,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(prev => [data.product, ...prev]);
      setShowModal(false);
      setForm(emptyForm);
      setScanUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <Header title="Products" subtitle="Product profiles and USP library" />
      <div className="p-6 space-y-4">

        <div className="flex justify-end">
          <Button
            onClick={() => { setShowModal(true); setForm(emptyForm); setScanUrl(""); setError(""); }}
            className="bg-[#FCD202] text-black hover:bg-[#FCD202]/90 h-8 text-xs font-semibold"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Product
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#FCD202]" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="border-[#1E2530] bg-[#161B24] hover:border-[#2A3140] transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E2530]">
                      <Package className="h-5 w-5 text-[#FCD202]" />
                    </div>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-[#5A6478] hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-semibold text-white text-sm mb-1">{product.name}</p>
                  {product.target_audience && (
                    <p className="text-xs text-[#5A6478] mb-2">{product.target_audience}</p>
                  )}
                  {product.usp && (
                    <p className="text-xs text-[#8693A8] mb-3 line-clamp-2">{product.usp}</p>
                  )}

                  <button
                    onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                    className="flex items-center gap-1 text-[10px] text-[#5A6478] hover:text-[#8693A8]"
                  >
                    {expandedId === product.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {expandedId === product.id ? "Less" : "More details"}
                  </button>

                  {expandedId === product.id && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-[#1E2530]">
                      {product.description && (
                        <div>
                          <p className="text-[10px] font-medium text-[#5A6478] uppercase tracking-wider mb-1">Description</p>
                          <p className="text-xs text-[#8693A8]">{product.description}</p>
                        </div>
                      )}
                      {product.benefits?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-[#5A6478] uppercase tracking-wider mb-1">Benefits</p>
                          <ul className="space-y-1">
                            {product.benefits.map((b, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-[#8693A8]">
                                <span className="mt-1 h-1 w-1 rounded-full bg-[#FCD202] flex-shrink-0" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {product.website_url && (
                        <a
                          href={product.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#FCD202] hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          {product.website_url.replace(/^https?:\/\//, "").split("/")[0]}
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Card
              className="border-2 border-dashed border-[#1E2530] bg-transparent hover:border-[#2A3140] cursor-pointer transition-colors"
              onClick={() => { setShowModal(true); setForm(emptyForm); }}
            >
              <CardContent className="flex flex-col items-center justify-center p-5 h-full min-h-[140px]">
                <Plus className="h-6 w-6 text-[#5A6478] mb-2" />
                <p className="text-xs text-[#5A6478]">Add product</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-[#161B24] border border-[#1E2530] rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#161B24] border-b border-[#1E2530] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-white">Add Product</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#5A6478] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Scan URL */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">
                  Scan from URL
                  <span className="ml-1 text-[#5A6478] font-normal">(optional — AI will extract product info)</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://yourproduct.com"
                    value={scanUrl}
                    onChange={(e) => setScanUrl(e.target.value)}
                    className="border-[#1E2530] bg-[#0F1117] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
                  />
                  <Button
                    onClick={handleScan}
                    disabled={scanning || !scanUrl.trim()}
                    variant="outline"
                    className="border-[#1E2530] text-[#8693A8] hover:bg-[#1E2530] hover:text-white whitespace-nowrap"
                  >
                    {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Globe className="h-4 w-4 mr-1.5" />Scan</>}
                  </Button>
                </div>
              </div>

              <div className="border-t border-[#1E2530] pt-4 space-y-3">
                {[
                  { key: "name", label: "Product Name *", placeholder: "e.g. Protein Supplement Pro" },
                  { key: "description", label: "Description", placeholder: "What does this product do?" },
                  { key: "usp", label: "Unique Selling Point", placeholder: "What makes it different?" },
                  { key: "target_audience", label: "Target Audience", placeholder: "Who is this for?" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">{label}</label>
                    <Input
                      placeholder={placeholder}
                      value={form[key as keyof ProductForm]}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="border-[#1E2530] bg-[#0F1117] text-white placeholder:text-[#5A6478] focus-visible:ring-[#FCD202]/30"
                    />
                  </div>
                ))}

                {[
                  { key: "benefits", label: "Benefits", placeholder: "One benefit per line\nFast results\nNo side effects" },
                  { key: "features", label: "Features", placeholder: "One feature per line\n30g protein per serving\nGluten free" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-xs font-medium text-[#8693A8]">{label}</label>
                    <textarea
                      placeholder={placeholder}
                      value={form[key as keyof ProductForm]}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      rows={3}
                      className="w-full rounded-md border border-[#1E2530] bg-[#0F1117] px-3 py-2 text-sm text-white placeholder:text-[#5A6478] focus:outline-none focus:ring-1 focus:ring-[#FCD202]/30 resize-none"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="flex-1 border-[#1E2530] text-[#8693A8] hover:bg-[#1E2530] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#FCD202] text-black font-semibold hover:bg-[#FCD202]/90"
                >
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Product"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
