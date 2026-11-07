import { VoiceCloneApp } from "@/components/VoiceCloneApp";

export const metadata = {
  title: "ចម្លងសំឡេង — សម្លេងខ្មែរ",
  description: "ថតសំឡេងយោង រួចបង្កើតសំឡេងថ្មីតាមអត្ថបទរបស់អ្នក",
};

export default function DashboardClonePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <VoiceCloneApp />
    </div>
  );
}
