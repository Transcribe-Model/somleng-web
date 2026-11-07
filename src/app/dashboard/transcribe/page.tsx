import { TranscribeApp } from "@/components/TranscribeApp";

export const metadata = {
  title: "បម្លែងសំឡេង — សម្លេងខ្មែរ",
  description: "បញ្ចូលឯកសារសំឡេង និងបម្លែងសំឡេងភាសាខ្មែរទៅជាអក្សរ",
};

export default function DashboardTranscribePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TranscribeApp />
    </div>
  );
}
