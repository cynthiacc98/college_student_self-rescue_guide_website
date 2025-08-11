import { getBasicSettings } from "@/lib/settings";
import HomeHero from "./HomeHero";
import ScrollParallax from "./ScrollParallax";
import IntersectionReveal from "./IntersectionReveal";

export default async function HomeHeroWrapper() {
  const settings = await getBasicSettings();
  
  return (
    <ScrollParallax 
      speed={0.3}
      enableIndicator={false}
      layers={[
        {
          id: "background-particles",
          speed: 0.8,
          element: <div className="w-full h-full bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-cyan-900/5" />,
          zIndex: -1
        }
      ]}
    >
      <IntersectionReveal 
        direction="fade" 
        timing="slow" 
        threshold={0.2}
      >
        <HomeHero 
          siteName={settings.siteName} 
          siteDescription={settings.siteDescription} 
        />
      </IntersectionReveal>
    </ScrollParallax>
  );
}
