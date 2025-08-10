import HomeHero from "@/components/HomeHero";
import HomeHotResources from "@/components/HomeHotResources";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HomeHero />
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <h2 className="text-xl font-semibold mb-4">热门资料</h2>
        <HomeHotResources />
      </section>
    </main>
  );
}
