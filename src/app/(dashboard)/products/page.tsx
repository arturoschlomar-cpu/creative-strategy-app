import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";

const products = [
  { id: "1", name: "Protein Supplement", audience: "Fitness enthusiasts 25-40", ads: 24 },
  { id: "2", name: "Skincare Bundle", audience: "Women 28-45", ads: 18 },
];

export default function ProductsPage() {
  return (
    <>
      <Header title="Products" subtitle="Product profiles and USP library" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Button className="bg-[#FCD202] text-black hover:bg-[#FCD202]/90 h-8 text-xs font-semibold">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Product
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="border-[#1E2530] bg-[#161B24] hover:border-[#2A3140] cursor-pointer transition-colors">
              <CardContent className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E2530] mb-3">
                  <Package className="h-5 w-5 text-[#FCD202]" />
                </div>
                <p className="font-semibold text-white text-sm mb-1">{product.name}</p>
                <p className="text-xs text-[#5A6478] mb-3">{product.audience}</p>
                <p className="text-xs text-[#8693A8]">{product.ads} creatives analyzed</p>
              </CardContent>
            </Card>
          ))}
          <Card className="border-2 border-dashed border-[#1E2530] bg-transparent hover:border-[#2A3140] cursor-pointer transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-5 h-full min-h-[120px]">
              <Plus className="h-6 w-6 text-[#5A6478] mb-2" />
              <p className="text-xs text-[#5A6478]">Add product</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
