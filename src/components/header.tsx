
"use client";

import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Moon, Sun, History, BookOpen, Trash2, Edit2, Save as SaveIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { AuthModal } from "./auth-modal";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { collection, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
import Link from "next/link";

export function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  // Cloud History
  const historyQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(collection(db, "users", user.uid, "questionnaires"), orderBy("createdAt", "desc"));
  }, [user, db]);
  
  const { data: cloudHistory, isLoading: isCloudLoading } = useCollection(historyQuery);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
    setLocalHistory(JSON.parse(localStorage.getItem("study_history") || "[]"));
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleDelete = async (id: string) => {
    if (user && db) {
      await deleteDoc(doc(db, "users", user.uid, "questionnaires", id));
    }
    const updated = localHistory.filter(h => h.id !== id);
    setLocalHistory(updated);
    localStorage.setItem("study_history", JSON.stringify(updated));
    toast({ title: "Removido do histórico" });
  };

  const handleRename = async (id: string) => {
    if (!newName.trim()) return;
    if (user && db) {
      await updateDoc(doc(db, "users", user.uid, "questionnaires", id), { name: newName });
    }
    const updated = localHistory.map(h => h.id === id ? { ...h, name: newName } : h);
    setLocalHistory(updated);
    localStorage.setItem("study_history", JSON.stringify(updated));
    setEditingId(null);
    setNewName("");
    toast({ title: "Nome atualizado!" });
  };

  const itemsToShow = user ? (cloudHistory || []) : localHistory;

  return (
    <header className="relative z-50 w-full border-b bg-background/80 backdrop-blur-md border-accent/20 h-16">
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-primary tracking-tighter">
            <BookOpen className="h-6 w-6 text-accent" />
            <span>Questões <span className="text-accent">AÍ</span></span>
          </Link>
          
          <Button onClick={() => setIsHistoryOpen(true)} size="sm" className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-black shadow-md">
            <History className="h-4 w-4" />
            <span className="hidden lg:inline text-xs uppercase tracking-wider">Meus Questionários</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-accent/10">
            {theme === "light" ? <Moon className="h-5 w-5 text-accent" /> : <Sun className="h-5 w-5 text-accent" />}
          </Button>

          {user ? (
            <Button variant="outline" size="sm" onClick={() => signOut(auth)} className="gap-2 border-accent/20 font-bold hover:bg-accent/5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          ) : (
            <Button onClick={() => setIsAuthModalOpen(true)} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-black shadow-md">
              <UserIcon className="mr-2 h-4 w-4" />
              Entrar
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <History className="h-6 w-6 text-accent" /> Meus Estudos
            </DialogTitle>
            <DialogDescription className="font-medium">
              Gerencie seus simulados e questionários {user ? "salvos na nuvem" : "salvos neste navegador"}.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            {itemsToShow.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl">
                <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">Nenhum questionário encontrado.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {itemsToShow.map((item) => (
                  <div key={item.id} className="p-4 border-2 rounded-2xl bg-card hover:border-primary/30 transition-all group">
                    {editingId === item.id ? (
                      <div className="flex gap-2">
                        <Input 
                          value={newName} 
                          onChange={(e) => setNewName(e.target.value)}
                          className="font-bold h-10"
                          placeholder="Novo nome..."
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleRename(item.id)} className="bg-green-500 hover:bg-green-600">
                          <SaveIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 min-w-0 pr-4">
                          <h4 className="font-black text-foreground truncate">{item.name || item.fileName || "Sem Nome"}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold">
                            <span className="bg-accent/10 px-2 py-0.5 rounded text-accent-foreground">{item.count} itens</span>
                            <span>Aprov: {item.score}%</span>
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditingId(item.id); setNewName(item.name || item.fileName || ""); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
