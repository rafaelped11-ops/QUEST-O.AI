
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { GeneratorView } from "@/components/generator-view";

export default function Home() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
            <header className="mb-8 space-y-2">
              <h1 className="text-4xl font-headline font-bold text-foreground">
                Concurso <span className="text-primary">AI Prep</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Gere simulados personalizados e turbine sua aprovação com inteligência artificial.
              </p>
            </header>
            
            <GeneratorView />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
