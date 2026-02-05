
"use client";

import { useState } from "react";
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
import { Loader2, Sparkles, Pencil, BrainCircuit, FileUp } from "lucide-react";
import { QuestionCard } from "@/components/question-card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { extractTextFromPdf } from "@/lib/pdf-actions";

export function GeneratorView() {
  const { user } = useUser();
  const db = useFirestore();
  const [file, setFile] = useState<File | null>(null);
  const [essayFile, setEssayFile] = useState<File | null>(null);
  const [questionType, setQuestionType] = useState<'A' | 'C'>('A');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [stats, setStats] = useState<{ correct: number; incorrect: number } | null>(null);
  
  const [manualText, setManualText] = useState("");
  const [essayContent, setEssayContent] = useState("");
  const [essayTopics, setEssayTopics] = useState<string[] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [userEssay, setUserEssay] = useState("");
  const [maxScore, setMaxScore] = useState(20);
  const [essayCorrection, setEssayCorrection] = useState<any | null>(null);

  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setTarget: (f: File) => void) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast({ title: "Arquivo inválido", description: "Por favor, envie um arquivo PDF.", variant: "destructive" });
        return;
      }
      setTarget(selectedFile);
    }
  };

  const handleGenerateFromPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Atenção", description: "Selecione um PDF antes de gerar.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const pdfText = await extractTextFromPdf(formData);
      
      const response = await generateQuestionsFromPdf({
        pdfText,
        questionType,
        numberOfQuestions: Math.min(60, count),
        difficulty,
      });
      
      setResults(response.questions);
      setStats({ correct: 0, incorrect: 0 });
      saveToHistory(file.name, "DeepSeek IA", response.questions.length);
      toast({ title: "Simulado Gerado!", description: `${response.questions.length} questões criadas.` });
    } catch (error: any) {
      toast({ 
        title: "Erro na Geração", 
        description: error.message || "Não foi possível gerar as questões. Tente um arquivo diferente.", 
        variant: "destructive" 
      });
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
      saveToHistory("Entrada Manual", "Manual", response.questions.length);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao identificar questões.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestTopics = async () => {
    setLoading(true);
    try {
      let baseContent = essayContent;
      if (essayFile) {
        const formData = new FormData();
        formData.append('file', essayFile);
        baseContent = await extractTextFromPdf(formData);
      }
      if (!baseContent) {
        toast({ title: "Aviso", description: "Forneça um texto base ou carregue um PDF.", variant: "destructive" });
        return;
      }
      const response = await suggestEssayTopics({ content: baseContent });
      setEssayTopics(response.topics);
      toast({ title: "Temas Gerados", description: "Escolha um tema para começar." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao sugerir temas.", variant: "destructive" });
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
      id: Date.now().toString(),
      fileName: name,
      type,
      date: new Date().toISOString(),
      count,
      userId: user?.uid || "anonymous"
    };

    const existingHistory = JSON.parse(localStorage.getItem("study_history") || "[]");
    const history = [newItem, ...existingHistory].slice(0, 20);
    localStorage.setItem("study_history", JSON.stringify(history));

    if (user && db) {
      const colRef = collection(db, "users", user.uid, "questionnaires");
      addDocumentNonBlocking(colRef, { 
        ...newItem, 
        createdAt: serverTimestamp() 
      });
    }
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
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl h-auto">
          <TabsTrigger value="pdf" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-[10px] md:text-sm">
            <BrainCircuit className="h-4 w-4" /> 
            <span className="hidden sm:inline">Questões IA</span>
            <span className="sm:hidden">IA</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-[10px] md:text-sm">
            <Pencil className="h-4 w-4" /> 
            <span className="hidden sm:inline">Entrada Manual</span>
            <span className="sm:hidden">Manual</span>
          </TabsTrigger>
          <TabsTrigger value="discursiva" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-[10px] md:text-sm">
            <Sparkles className="h-4 w-4" /> 
            <span className="hidden sm:inline">Prova Discursiva</span>
            <span className="sm:hidden">Discursiva</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm ring-1 ring-primary/10">
            <CardHeader>
              <CardDescription className="text-muted-foreground font-medium text-center md:text-left">
                Carregue seu PDF e deixe a IA DeepSeek criar um simulado exclusivo focado no seu material.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateFromPdf} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pdf" className="text-foreground font-bold">Arquivo PDF</Label>
                    <div className="flex items-center gap-2">
                      <Input id="pdf" type="file" accept=".pdf" onChange={(e) => handleFileChange(e, setFile)} className="bg-background border-primary/20" />
                      {file && <span className="text-xs text-accent font-black whitespace-nowrap hidden md:inline">✓ Pronto</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-foreground font-bold">Tipo de Questão</Label>
                    <Select value={questionType} onValueChange={(v: any) => setQuestionType(v)}>
                      <SelectTrigger id="type" className="bg-background border-primary/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Tipo A (Certo/Errado)</SelectItem>
                        <SelectItem value="C">Tipo C (Múltipla Escolha)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="count" className="text-foreground font-bold">Quantidade (Máx 60)</Label>
                    <Input id="count" type="number" min={1} max={60} value={count} onChange={(e) => setCount(Number(e.target.value))} className="bg-background border-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-foreground font-bold">Dificuldade</Label>
                    <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                      <SelectTrigger id="difficulty" className="bg-background border-primary/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Iniciante</SelectItem>
                        <SelectItem value="medium">Intermediário</SelectItem>
                        <SelectItem value="hard">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 text-lg font-black shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground transition-all hover:scale-[1.01]" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Gerar Questões"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm ring-1 ring-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-black text-foreground">Identificação de Questões</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Cole o texto de questões de outros materiais para formatar seu treino.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Cole aqui o enunciado, opções e gabarito..." 
                className="min-h-[200px] bg-background border-primary/20 text-foreground" 
                value={manualText} 
                onChange={(e) => setManualText(e.target.value)}
              />
              <Button onClick={handleManualParse} className="w-full h-12 font-black bg-accent text-accent-foreground hover:bg-accent/90 shadow-md" disabled={loading || !manualText}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Identificar e Treinar"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discursiva">
          <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm ring-1 ring-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-black text-primary">Treino de Redação</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Treine para provas discursivas com correção baseada no padrão Cebraspe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground font-bold dark:text-white">Base de Conhecimento (Texto)</Label>
                  <Textarea 
                    placeholder="Cole aqui o texto base..." 
                    value={essayContent}
                    onChange={(e) => setEssayContent(e.target.value)}
                    className="bg-background border-accent/20 h-24 text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-bold dark:text-white">Selecionar Documento</Label>
                  <div className="flex flex-col gap-2 h-24 justify-center border-2 border-dashed border-accent/30 rounded-lg bg-accent/5 items-center">
                    <Input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      id="essay-pdf" 
                      onChange={(e) => handleFileChange(e, setEssayFile)}
                    />
                    <label htmlFor="essay-pdf" className="cursor-pointer flex flex-col items-center gap-1">
                      <FileUp className="h-6 w-6 text-accent" />
                      <span className="text-xs font-bold text-foreground dark:text-white">
                        {essayFile ? essayFile.name : "Selecionar Documento"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <Button onClick={handleSuggestTopics} disabled={loading} className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-black shadow-md">
                {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                Sugerir Temas
              </Button>

              {essayTopics && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-accent font-black uppercase text-xs tracking-widest">Temas Sugeridos</Label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger className="bg-background border-accent/50 font-medium h-12 text-foreground"><SelectValue placeholder="Escolha um tema" /></SelectTrigger>
                    <SelectContent>
                      {essayTopics.map((t, i) => <SelectItem key={i} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-bold dark:text-white">Sua Redação</Label>
                  <Textarea 
                    placeholder="Desenvolva seu texto..." 
                    className="min-h-[350px] bg-background font-serif text-lg leading-relaxed border-accent/20 text-foreground" 
                    value={userEssay}
                    onChange={(e) => setUserEssay(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-accent/10 border-2 border-accent/30 space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-foreground dark:text-white">Pontuação Máxima</Label>
                      <Input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className="bg-background border-accent/20 text-foreground" />
                    </div>
                    <Button 
                      onClick={handleCorrectEssay} 
                      className="w-full h-12 text-lg font-black bg-accent hover:bg-accent/90 text-accent-foreground shadow-md" 
                      disabled={loading || !userEssay || !selectedTopic}
                    >
                      {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                      Corrigir Agora
                    </Button>
                  </div>

                  {essayCorrection && (
                    <div className="p-6 bg-muted/50 rounded-xl border-2 border-accent/20 space-y-4 animate-in fade-in zoom-in-95">
                      <div className="flex justify-between items-center border-b border-accent/10 pb-4">
                        <h4 className="font-black text-3xl text-accent">{essayCorrection.finalScore} <span className="text-sm font-normal text-muted-foreground">/ {maxScore}</span></h4>
                        <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/30 font-bold">Concluída</Badge>
                      </div>
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="font-black text-[10px] uppercase tracking-widest text-accent mb-1">Feedback Detalhado</p>
                          <p className="leading-relaxed font-medium text-foreground">{essayCorrection.feedback}</p>
                        </div>
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-primary/10 rounded-2xl border border-primary/20 backdrop-blur-md">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-primary">Resultado</h2>
              <p className="text-muted-foreground font-medium">{results.length} questões</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="text-center p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-accent/20 flex-1 md:min-w-[180px]">
                <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1">Aproveitamento</p>
                <p className={`text-3xl md:text-4xl font-black ${Number(calculateAproveitamento()) >= 70 ? 'text-green-500' : 'text-accent'}`}>
                  {calculateAproveitamento()}%
                </p>
              </div>
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
    </div>
  );
}
