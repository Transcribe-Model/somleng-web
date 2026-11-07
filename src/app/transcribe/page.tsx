import { redirect } from "next/navigation";

export default function TranscribeRedirectPage() {
  redirect("/dashboard/transcribe");
}
