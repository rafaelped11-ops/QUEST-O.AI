
"use client";

import { Header } from "@/components/header";
import { GeneratorView } from "@/components/generator-view";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F0F4F7]">
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-5xl">
        <header className="mb-12 text-center space-y-4">
          <h1 className="text-5xl font-bold text-foreground">
            Questões <span className="text-primary">AÍ</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Transforme seus PDFs em questões de alto nível. Estude com questões inéditas focadas no seu material.
          </p>
        </header>
        
        <GeneratorView />
      </main>
      
      <footer className="mt-20 border-t py-12 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">© 2024 Questões AÍ - O seu simulador inteligente.</p>
        </div>
      </footer>
    </div>
  );
}
