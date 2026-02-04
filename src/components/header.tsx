
"use client";

import { useUser, useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Moon, Sun, History, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { AuthModal } from "./auth-modal";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    
    const savedHistory = JSON.parse(localStorage.getItem("study_history") || "[]");
    setHistory(savedHistory);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = () => {
    signOut(auth);
    toast({ title: "Até logo!", description: "Você saiu da sua conta." });
  };

  const clearHistory = () => {
    localStorage.removeItem("study_history");
    setHistory([]);
    toast({ title: "Histórico Limpo" });
  };

  return (
    <header className="relative z-50 w-full border-b bg-background/80 backdrop-blur-md border-accent/20 h-16">
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        {/* Lado Esquerdo: Histórico */}
        <div className="flex items-center">
          <Sheet onOpenChange={(open) => {
            if (open) {
              setHistory(JSON.parse(localStorage.getItem("study_history") || "[]"));
            }
          }}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-accent-foreground font-bold bg-accent/20 hover:bg-accent/40 transition-colors">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Meus Questionários</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-accent" />
                  Meus Questionários
                </SheetTitle>
                <SheetDescription>
                  Seu histórico recente de estudos realizados neste navegador.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-8 space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhum questionário encontrado.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y max-h-[60vh] overflow-y-auto pr-2">
                      {history.map((item) => (
                        <div key={item.id} className="py-4 space-y-1 hover:bg-muted/50 transition-colors px-2 rounded-lg">
                          <p className="font-bold text-sm truncate">{item.fileName}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="bg-accent/20 px-2 py-0.5 rounded text-accent-foreground font-medium">{item.type}</span>
                            <span>{item.count} itens • {new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full text-destructive border-destructive/20" onClick={clearHistory}>
                      Limpar Histórico
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo Centralizado (Flutuando na borda) */}
        <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-background p-2 rounded-2xl shadow-lg border-2 border-accent/20">
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              <Image 
                src="/logo.png" 
                alt="Questões AÍ" 
                fill 
                className="object-contain p-1"
                onError={(e) => {
                  // Fallback para quando o logo ainda não foi carregado
                  const target = e.target as HTMLImageElement;
                  target.src = "https://picsum.photos/seed/questoesai/200/200";
                }}
              />
            </div>
          </div>
        </div>

        {/* Lado Direito: Tema e Auth */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-accent/20">
            {theme === "light" ? <Moon className="h-5 w-5 text-accent" /> : <Sun className="h-5 w-5 text-accent" />}
          </Button>

          {user ? (
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 border-accent/20 font-bold">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          ) : (
            <Button onClick={() => setIsAuthModalOpen(true)} size="sm" className="bg-accent hover:bg-accent/80 text-accent-foreground font-black">
              <UserIcon className="mr-2 h-4 w-4" />
              Entrar
            </Button>
          )}
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
