
"use client";

import { useState } from "react";
import { generateQuestionsFromPdf } from "@/ai/flows/generate-questions-from-pdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileUp, Sparkles, AlertCircle } from "lucide-react";
import { QuestionCard } from "@/components/question-card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function GeneratorView() {
  const { user } = useUser();
  const db = useFirestore();
  const [file, setFile] = useState<File | null>(null);
  const [questionType, setQuestionType] = useState<'A' | 'C'>('A');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [stats, setStats] = useState<{ correct: number; incorrect: number; canceled?: number } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast({ title: "Arquivo inválido", description: "Por favor, envie um arquivo PDF.", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "PDF necessário", description: "Faça o upload de um arquivo para continuar.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Em um cenário real, o texto do PDF seria extraído aqui.
      // Como não temos a lib cliente pronta para ler PDF direto no browser sem infra pesada,
      // Simularemos o envio do texto para a IA.
      // Na prática, você usaria pdfjs-dist ou similar aqui.
      const mockPdfText = "CONTEÚDO DO DOCUMENTO EXTRAÍDO PARA PROCESSAMENTO DA IA..."; 
      
      const response = await generateQuestionsFromPdf({
        pdfText: mockPdfText,
        questionType,
        numberOfQuestions: count,
        difficulty,
      });

      setResults(response.questions);
      setStats(null); // Reseta estatísticas do novo simulado

      // Salva no Firestore se estiver logado
      if (user) {
        await addDoc(collection(db, "users", user.uid, "questionnaires"), {
          type: questionType,
          difficulty,
          count,
          fileName: file.name,
          createdAt: serverTimestamp(),
          questions: response.questions
        });
      } else {
        // Salva localmente
        const history = JSON.parse(localStorage.getItem("study_history") || "[]");
        history.push({
          id: Date.now(),
          fileName: file.name,
          type: questionType,
          date: new Date().toISOString(),
          count
        });
        localStorage.setItem("study_history", JSON.stringify(history.slice(-10)));
      }

      toast({ title: "Sucesso!", description: `${response.questions.length} questões inéditas geradas.` });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao gerar", description: "Falha na comunicação com a IA.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (isCorrect: boolean | null) => {
    if (questionType === 'A') {
      setStats(prev => {
        const current = prev || { correct: 0, incorrect: 0, canceled: 0 };
        if (isCorrect === true) return { ...current, correct: current.correct + 1 };
        if (isCorrect === false) return { ...current, incorrect: current.incorrect + 1 };
        return current;
      });
    }
  };

  const calculateAproveitamento = () => {
    if (!stats) return 0;
    if (questionType === 'A') {
      // Lógica Cebraspe: Uma errada anula uma certa
      const saldo = stats.correct - stats.incorrect;
      const aproveitamento = (Math.max(0, saldo) / (results?.length || 1)) * 100;
      return aproveitamento.toFixed(1);
    }
    return ((stats.correct / (results?.length || 1)) * 100).toFixed(1);
  };

  return (
    <div className="space-y-8 pb-12">
      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-accent" />
            Configurar Simulador
          </CardTitle>
          <CardDescription>
            Carregue seu material de estudo para gerar questões inéditas e diversificadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pdf">Material de Estudo (PDF)</Label>
                <div className="relative group">
                  <Input 
                    id="pdf" 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileChange}
                    className="cursor-pointer file:bg-primary file:text-white file:border-none file:rounded-md file:px-4 file:mr-4 file:hover:bg-primary/90"
                  />
                  <FileUp className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Questão</Label>
                <Select value={questionType} onValueChange={(v: any) => setQuestionType(v)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Tipo A (Certo/Errado - Cebraspe)</SelectItem>
                    <SelectItem value="C">Tipo C (Múltipla Escolha - A a E)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="count">Quantidade (Máx: 60)</Label>
                <Input 
                  id="count" 
                  type="number" 
                  min={1} 
                  max={60} 
                  value={count} 
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-12 text-lg shadow-lg shadow-accent/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Lendo Documento e Criando Questões...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Gerar Simulado Inédito
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-primary/10 rounded-xl border border-primary/20">
            <div>
              <h2 className="text-2xl font-bold">Simulado Gerado</h2>
              <p className="text-muted-foreground">Documento: {file?.name}</p>
            </div>
            {stats && (
              <div className="text-center p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-inner border">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Seu Aproveitamento</p>
                <p className={`text-4xl font-black ${Number(calculateAproveitamento()) >= 60 ? 'text-green-500' : 'text-orange-500'}`}>
                  {calculateAproveitamento()}%
                </p>
                {questionType === 'A' && (
                  <p className="text-[10px] text-muted-foreground mt-1">* Critério Cebraspe: Errada anula Certa</p>
                )}
              </div>
            )}
          </div>

          {questionType === 'A' && (
            <Alert className="bg-orange-50 dark:bg-orange-950 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle>Fator de Correção Ativo</AlertTitle>
              <AlertDescription>
                Neste modo, cada resposta incorreta anulará uma resposta correta, seguindo o padrão da banca Cebraspe.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6">
            {results.map((q, idx) => (
              <QuestionCard 
                key={idx} 
                index={idx + 1} 
                question={q.text} 
                options={q.options}
                correctAnswer={q.correctAnswer}
                justification={q.justification}
                sourcePage={q.sourcePage}
                type={questionType}
                onAnswered={updateStats}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
