import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProductSearchCardProps {
  onSearch: (value: string) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

export function ProductSearchCard({
  onSearch,
  searchValue,
  setSearchValue,
}: ProductSearchCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(searchValue.trim());
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by SKU, name or category"
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </CardContent>
    </Card>
  );
}
