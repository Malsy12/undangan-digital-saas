import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import TemplateGrid from "@/components/landing/TemplateGrid";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import { createClient } from "@/lib/supabase/server";
import { getActiveTemplates } from "@/lib/templates/queries";

export default async function Home() {
  const supabase = await createClient();
  const templates = await getActiveTemplates(supabase);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <TemplateGrid templates={templates} />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
