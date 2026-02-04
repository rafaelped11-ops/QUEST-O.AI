
"use client";

import { useUser, useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, User as UserIcon, Moon, Sun, History } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { AuthModal } from "./auth-modal";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">Questões <span className="text-primary">AÍ</span></span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                <History className="h-4 w-4" />
                Histórico
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="sm" className="hidden md:flex gap-2" onClick={() => toast({ title: "Local", description: "Histórico local disponível no menu do navegador." })}>
                <History className="h-4 w-4" />
                Local
              </Button>
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
