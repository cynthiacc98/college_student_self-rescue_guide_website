import { getBasicSettings } from "@/lib/settings";
import HomeHeroSOTA from "./HomeHeroSOTA";

export default async function HomeHeroWrapper() {
  const settings = await getBasicSettings();
  
  return (
    <HomeHeroSOTA 
      siteName={settings.siteName} 
      siteDescription={settings.siteDescription} 
    />
  );
}
