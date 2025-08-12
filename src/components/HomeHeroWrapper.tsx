import { getBasicSettings } from "@/lib/settings";
import HomeHeroUltra from "./HomeHeroUltra";

export default async function HomeHeroWrapper() {
  const settings = await getBasicSettings();
  
  return (
    <HomeHeroUltra 
      siteName={settings.siteName} 
      siteDescription={settings.siteDescription} 
    />
  );
}
