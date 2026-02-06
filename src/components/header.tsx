
"use client";

import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, Moon, Sun, History, BookOpen, Trash2, Edit2, Save as SaveIcon, Monitor, Cloud } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { AuthModal } from "./auth-modal";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { collection, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
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

  const handleDelete = async (id: string, isCloud: boolean) => {
    if (isCloud && user && db) {
      await deleteDoc(doc(db, "users", user.uid, "questionnaires", id));
    } else {
      const updated = localHistory.filter(h => h.id !== id);
      setLocalHistory(updated);
      localStorage.setItem("study_history", JSON.stringify(updated));
    }
    toast({ title: "Removido do histórico" });
  };

  const handleRename = async (id: string, isCloud: boolean) => {
    if (!newName.trim()) return;
    if (isCloud && user && db) {
      await updateDoc(doc(db, "users", user.uid, "questionnaires", id), { name: newName });
    } else {
      const updated = localHistory.map(h => h.id === id ? { ...h, name: newName } : h);
      setLocalHistory(updated);
      localStorage.setItem("study_history", JSON.stringify(updated));
    }
    setEditingId(null);
    setNewName("");
    toast({ title: "Nome atualizado!" });
  };

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
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <History className="h-6 w-6 text-accent" /> Meus Estudos
            </DialogTitle>
            <DialogDescription className="font-medium">
              Gerencie seus simulados e questionários salvos localmente ou na nuvem.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {/* Cloud History Section */}
              {user && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest">
                    <Cloud className="h-4 w-4" /> Nuvem (Sincronizado)
                  </div>
                  {isCloudLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : !cloudHistory || cloudHistory.length === 0 ? (
                    <div className="text-center py-6 bg-muted/10 rounded-xl border border-dashed text-xs font-bold text-muted-foreground">
                      Nenhum questionário na nuvem.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {cloudHistory.map((item) => (
                        <HistoryItem 
                          key={item.id} 
                          item={item} 
                          isCloud={true}
                          editingId={editingId}
                          newName={newName}
                          setNewName={setNewName}
                          setEditingId={setEditingId}
                          handleRename={handleRename}
                          handleDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Local History Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground font-black text-sm uppercase tracking-widest">
                  <Monitor className="h-4 w-4" /> Local (Este Navegador)
                </div>
                {localHistory.length === 0 ? (
                  <div className="text-center py-6 bg-muted/10 rounded-xl border border-dashed text-xs font-bold text-muted-foreground">
                    Nenhum questionário local.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {localHistory.map((item) => (
                      <HistoryItem 
                        key={item.id} 
                        item={item} 
                        isCloud={false}
                        editingId={editingId}
                        newName={newName}
                        setNewName={setNewName}
                        setEditingId={setEditingId}
                        handleRename={handleRename}
                        handleDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}

function HistoryItem({ item, isCloud, editingId, newName, setNewName, setEditingId, handleRename, handleDelete }: any) {
  return (
    <div className="p-4 border-2 rounded-2xl bg-card hover:border-primary/30 transition-all group relative overflow-hidden">
      {editingId === item.id ? (
        <div className="flex gap-2">
          <Input 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)}
            className="font-bold h-10"
            placeholder="Novo nome..."
            autoFocus
          />
          <Button size="sm" onClick={() => handleRename(item.id, isCloud)} className="bg-green-500 hover:bg-green-600">
            <SaveIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
               <h4 className="font-black text-foreground truncate">{item.name || "Sem Nome"}</h4>
               {isCloud && <Badge variant="secondary" className="text-[8px] font-black h-4 px-1">NUVEM</Badge>}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold">
              <span className="bg-accent/10 px-2 py-0.5 rounded text-accent-foreground">{(item.count || 0)} itens</span>
              <span>Aprov: {item.score}%</span>
              <span>{item.creationDate ? new Date(item.creationDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditingId(item.id); setNewName(item.name || ""); }}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id, isCloud)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
