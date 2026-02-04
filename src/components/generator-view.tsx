
"use client";

import { useState, useEffect } from "react";
import { generateQuestionsFromPdf } from "@/ai/flows/generate-questions-from-pdf";
import { parseManualQuestions } from "@/ai/flows/parse-manual-questions";
import { suggestEssayTopics, correctEssay } from "@/ai/flows/essay-training-flows";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileUp, Sparkles, AlertCircle, Pencil, FileText, History, Trash2 } from "lucide-react";
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
  const [stats, setStats] = useState<{ correct: number; incorrect: number } | null>(null);
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  
  // Estados para Entrada Manual
  const [manualText, setManualText] = useState("");

  // Estados para Prova Discursiva
  const [essayContent, setEssayContent] = useState("");
  const [essayTopics, setEssayTopics] = useState<string[] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [userEssay, setUserEssay] = useState("");
  const [maxScore, setMaxScore] = useState(20);
  const [essayCorrection, setEssayCorrection] = useState<any | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("study_history") || "[]");
    setLocalHistory(history);
  }, []);

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

  const handleGenerateFromPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "PDF necessário", description: "Faça o upload de um arquivo.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const mockPdfText = "O Direito Administrativo é o ramo do direito público que estuda os princípios e normas que regem a função administrativa."; 
      const response = await generateQuestionsFromPdf({
        pdfText: mockPdfText,
        questionType,
        numberOfQuestions: Math.min(60, count),
        difficulty,
      });
      setResults(response.questions);
      setStats({ correct: 0, incorrect: 0 });
      saveToHistory(file.name, questionType, response.questions.length);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao gerar questões.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleManualParse = async () => {
    if (!manualText) return;
    setLoading(true);
    try {
      const response = await parseManualQuestions({ rawText: manualText });
      setResults(response.questions);
      setStats({ correct: 0, incorrect: 0 });
      saveToHistory("Entrada Manual", "Mista", response.questions.length);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao identificar questões.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestTopics = async () => {
    if (!essayContent) return;
    setLoading(true);
    try {
      const response = await suggestEssayTopics({ content: essayContent });
      setEssayTopics(response.topics);
      toast({ title: "Temas Gerados", description: "Escolha um tema para começar seu treino." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao sugerir temas.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectEssay = async () => {
    if (!userEssay || !selectedTopic) return;
    setLoading(true);
    try {
      const response = await correctEssay({
        topic: selectedTopic,
        essay: userEssay,
        maxScore,
      });
      setEssayCorrection(response);
      saveToHistory(`Redação: ${selectedTopic.substring(0, 20)}...`, "Discursiva", 1);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao corrigir redação.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = (name: string, type: string, count: number) => {
    const newItem = {
      id: Date.now(),
      fileName: name,
      type,
      date: new Date().toISOString(),
      count
    };
    if (user) {
      addDoc(collection(db, "users", user.uid, "questionnaires"), { ...newItem, createdAt: serverTimestamp() });
    }
    const history = [newItem, ...localHistory].slice(0, 10);
    setLocalHistory(history);
    localStorage.setItem("study_history", JSON.stringify(history));
  };

  const clearHistory = () => {
    localStorage.removeItem("study_history");
    setLocalHistory([]);
    toast({ title: "Histórico Limpo" });
  };

  const updateStats = (isCorrect: boolean | null) => {
    if (isCorrect === null) return;
    setStats(prev => {
      if (!prev) return { correct: isCorrect ? 1 : 0, incorrect: isCorrect ? 0 : 1 };
      return {
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
      };
    });
  };

  const calculateAproveitamento = () => {
    if (!stats || !results) return "0.0";
    const total = results.length;
    if (questionType === 'A') {
      const saldo = stats.correct - stats.incorrect;
      const calc = (Math.max(0, saldo) / total) * 100;
      return calc.toFixed(1);
    }
    return ((stats.correct / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-8 pb-12">
      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="pdf" className="gap-2"><FileText className="h-4 w-4" /> Simulado PDF</TabsTrigger>
          <TabsTrigger value="manual" className="gap-2"><Pencil className="h-4 w-4" /> Entrada Manual</TabsTrigger>
          <TabsTrigger value="discursiva" className="gap-2"><Sparkles className="h-4 w-4" /> Prova Discursiva</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardDescription>Configure seu simulador para gerar questões inéditas focadas no seu PDF.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateFromPdf} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pdf">Arquivo PDF</Label>
                    <Input id="pdf" type="file" accept=".pdf" onChange={handleFileChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Questão</Label>
                    <Select value={questionType} onValueChange={(v: any) => setQuestionType(v)}>
                      <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Tipo A (Certo/Errado)</SelectItem>
                        <SelectItem value="C">Tipo C (Múltipla Escolha)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="count">Quantidade (Máx 60)</Label>
                    <Input id="count" type="number" min={1} max={60} value={count} onChange={(e) => setCount(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Dificuldade</Label>
                    <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                      <SelectTrigger id="difficulty"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Iniciante</SelectItem>
                        <SelectItem value="medium">Intermediário</SelectItem>
                        <SelectItem value="hard">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "gerar questões"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Identificação de Questões</CardTitle>
              <CardDescription>Cole o texto de questões abaixo para que a IA identifique e formate para treino.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Cole aqui o texto com as questões e respostas..." 
                className="min-h-[200px]" 
                value={manualText} 
                onChange={(e) => setManualText(e.target.value)}
              />
              <Button onClick={handleManualParse} className="w-full" disabled={loading || !manualText}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Identificar Questões"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discursiva">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Treino de Redação</CardTitle>
              <CardDescription>Carregue conteúdo para gerar temas ou escreva diretamente sua redação para correção.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Conteúdo de Referência (Opcional)</Label>
                <Textarea 
                  placeholder="Cole aqui o conteúdo sobre o qual deseja treinar a redação..." 
                  value={essayContent}
                  onChange={(e) => setEssayContent(e.target.value)}
                />
                <Button variant="outline" onClick={handleSuggestTopics} disabled={loading || !essayContent}>Sugerir 3 Temas</Button>
              </div>

              {essayTopics && (
                <div className="space-y-2">
                  <Label>Selecione um Tema</Label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger><SelectValue placeholder="Selecione um dos temas sugeridos" /></SelectTrigger>
                    <SelectContent>
                      {essayTopics.map((t, i) => <SelectItem key={i} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Seu Texto</Label>
                  <Textarea 
                    placeholder="Escreva sua redação aqui..." 
                    className="min-h-[300px]" 
                    value={userEssay}
                    onChange={(e) => setUserEssay(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nota Máxima</Label>
                    <Input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
                  </div>
                  <Button onClick={handleCorrectEssay} className="w-full h-12" disabled={loading || !userEssay || (!selectedTopic && !essayTopics)}>
                    Corrigir Redação
                  </Button>

                  {essayCorrection && (
                    <div className="p-4 bg-muted rounded-lg space-y-3 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xl text-primary">Nota Final: {essayCorrection.finalScore} / {maxScore}</h4>
                      </div>
                      <div className="text-sm space-y-2">
                        <p><strong>Feedback:</strong> {essayCorrection.feedback}</p>
                        <p><strong>Pontos Fortes:</strong> {essayCorrection.strengths.join(", ")}</p>
                        <p><strong>A melhorar:</strong> {essayCorrection.weaknesses.join(", ")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-primary/10 rounded-xl border border-primary/20">
            <div>
              <h2 className="text-2xl font-bold">Resultado do Simulado</h2>
              <p className="text-muted-foreground">{results.length} questões processadas</p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-inner border min-w-[160px]">
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Aproveitamento</p>
              <p className={`text-4xl font-black ${Number(calculateAproveitamento()) >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                {calculateAproveitamento()}%
              </p>
            </div>
          </div>
          <div className="grid gap-6">
            {results.map((q, idx) => (
              <QuestionCard 
                key={idx} 
                index={idx + 1} 
                question={q.text} 
                options={q.options}
                correctAnswer={q.correctAnswer}
                justification={q.justification}
                sourcePage={q.sourcePage || 0}
                type={q.type || questionType}
                onAnswered={updateStats}
              />
            ))}
          </div>
        </div>
      )}

      <Card className="mt-12 border-dashed">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Histórico Local</CardTitle>
          </div>
          {localHistory.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive"><Trash2 className="h-4 w-4 mr-1" /> Limpar</Button>
          )}
        </CardHeader>
        <CardContent>
          {localHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhum estudo realizado localmente.</p>
          ) : (
            <div className="divide-y">
              {localHistory.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.fileName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()} • {item.count} itens • {item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
