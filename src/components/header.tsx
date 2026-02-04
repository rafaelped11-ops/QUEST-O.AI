
"use client";

import { useUser, useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, User as UserIcon, Moon, Sun, History, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { AuthModal } from "./auth-modal";
import { useToast } from "@/hooks/use-toast";
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
    
    // Load initial history
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">Questões <span className="text-primary">AÍ</span></span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Sheet onOpenChange={(open) => {
            if (open) {
              setHistory(JSON.parse(localStorage.getItem("study_history") || "[]"));
            }
          }}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-accent-foreground font-semibold bg-accent/20 hover:bg-accent/30">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Meus Questionários</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
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
                        <div key={item.id} className="py-4 space-y-1">
                          <p className="font-semibold text-sm truncate">{item.fileName}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.type} • {item.count} itens</span>
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full text-destructive" onClick={clearHistory}>
                      Limpar Histórico
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsAuthModalOpen(true)} size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                <UserIcon className="mr-2 h-4 w-4" />
                Entrar
              </Button>
            </div>
          )}
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
