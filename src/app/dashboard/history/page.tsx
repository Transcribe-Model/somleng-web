import { HistoryApp } from "@/components/HistoryApp";

export const metadata = {
  title: "ប្រវត្តិ — សម្លេងខ្មែរ",
  description: "មើលប្រវត្តិការងារបម្លែងសំឡេងរបស់អ្នក",
};

export default function DashboardHistoryPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <HistoryApp />
    </div>
  );
}
