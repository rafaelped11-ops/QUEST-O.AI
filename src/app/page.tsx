
"use client";

import { Header } from "@/components/header";
import { GeneratorView } from "@/components/generator-view";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-6xl mt-12 md:mt-16">
        <header className="mb-12 text-center space-y-4">
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
            Transforme seus PDFs em questões de alto nível. Estude com simulados inéditos focados integralmente no seu material.
          </p>
        </header>
        
        <GeneratorView />
      </main>
      
      <footer className="mt-20 border-t py-12 bg-card">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">© 2024 Questões AÍ - O seu simulador inteligente para concursos.</p>
        </div>
      </footer>
    </div>
  );
}
