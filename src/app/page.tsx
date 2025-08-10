import HomeHero from "@/components/HomeHero";
import HomeHotResources from "@/components/HomeHotResources";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HomeHero />
      <section className="container-page pb-24">
        <h2 className="text-xl font-semibold mb-4">热门资料</h2>
        <div className="card p-4">
          <HomeHotResources />
        </div>
      </section>
    </main>
  );
}
