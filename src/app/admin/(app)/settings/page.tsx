import { getSettings } from "@/lib/menu";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <SettingsForm initial={await getSettings()} />;
}
