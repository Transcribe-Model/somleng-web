import { TtsApp } from "@/components/TtsApp";

export const metadata = {
  title: "អត្ថបទទៅសំឡេង — សម្លេងខ្មែរ",
  description: "វាយ ឬបិទភ្ជាប់អត្ថបទ ហើយស្តាប់សំឡេងលំនាំដើមភាសាខ្មែរ ឬអង់គ្លេស",
};

export default function DashboardTtsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TtsApp />
    </div>
  );
}
