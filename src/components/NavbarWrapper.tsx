import { getBasicSettings } from "@/lib/settings";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  const settings = await getBasicSettings();
  return <Navbar siteName={settings.siteName} />;
}
