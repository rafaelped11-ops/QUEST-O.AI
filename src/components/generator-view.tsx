
"use client";

import { useState, useMemo, useEffect } from "react";
import { generateQuestionsFromPdf } from "@/ai/flows/generate-questions-from-pdf";
import { parseManualQuestions } from "@/ai/flows/parse-manual-questions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Pencil, BrainCircuit, CheckCircle2, XCircle, ChevronLeft, BarChart3, ListChecks } from "lucide-react";
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<'A' | 'C'>('A');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);
  
  // Quiz states
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, { isCorrect: boolean, selected: string }>>({});
  
  const [manualText, setManualText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

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
      setAnswers({});
      setIsQuizMode(true);
      saveToHistory(file.name, "IA", response.questions.length);
      toast({ title: "Simulado Gerado!", description: `${response.questions.length} questões criadas.` });
    } catch (error: any) {
      toast({ title: "Erro na Geração", description: error.message || "Falha ao gerar.", variant: "destructive" });
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
      setAnswers({});
      setIsQuizMode(true);
      saveToHistory("Entrada Manual", "Manual", response.questions.length);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao identificar questões.", variant: "destructive" });
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
    if (user && db) {
      const colRef = collection(db, "users", user.uid, "questionnaires");
      addDocumentNonBlocking(colRef, { ...newItem, createdAt: serverTimestamp() });
    }
  };

  const handleAnswer = (index: number, isCorrect: boolean, selected: string) => {
    setAnswers(prev => ({ ...prev, [index]: { isCorrect, selected } }));
  };

  const isFinished = results && Object.keys(answers).length === results.length;

  const stats = useMemo(() => {
    if (!results) return { correct: 0, score: "0" };
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const total = results.length;
    let scoreValue = 0;
    if (questionType === 'A') {
      const incorrectCount = total - correctCount;
      scoreValue = Math.max(0, (correctCount - incorrectCount) / total) * 100;
    } else {
      scoreValue = (correctCount / total) * 100;
    }
    return { correct: correctCount, score: scoreValue.toFixed(1) };
  }, [answers, results, questionType]);

  if (isQuizMode && results) {
    if (isFinished) {
      return (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsQuizMode(false)} className="gap-2 font-black">
              <ChevronLeft className="h-4 w-4" /> Novo Simulado
            </Button>
          </div>

          <Card className="border-none shadow-2xl bg-gradient-to-br from-primary/10 to-accent/10 ring-2 ring-primary/20 overflow-hidden">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-background p-3 rounded-full w-fit shadow-xl mb-4">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black">Simulado Concluído!</CardTitle>
              <CardDescription className="text-base font-medium">Veja como você se saiu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center mt-4">
                <div className="p-4 bg-background rounded-2xl border shadow-sm">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Acertos</p>
                  <p className="text-3xl font-black text-green-500">{stats.correct}</p>
                </div>
                <div className="p-4 bg-background rounded-2xl border shadow-sm">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Erros</p>
                  <p className="text-3xl font-black text-destructive">{results.length - stats.correct}</p>
                </div>
                <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg col-span-2 md:col-span-1">
                  <p className="text-[10px] font-black uppercase opacity-80 tracking-widest mb-1">Aproveitamento</p>
                  <p className="text-3xl font-black">{stats.score}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" /> Resumo das Respostas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <div className="space-y-2">
                {results.map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="font-black">#{idx + 1}</Badge>
                      <div>
                        <p className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{q.text}</p>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          Sua resposta: <span className="font-black text-foreground uppercase">{answers[idx]?.selected === 'C' ? 'Certo' : answers[idx]?.selected === 'E' ? 'Errado' : answers[idx]?.selected}</span>
                        </p>
                      </div>
                    </div>
                    {answers[idx]?.isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-destructive shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setIsQuizMode(false)} className="gap-2 font-bold hover:bg-accent/10">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          <Badge variant="outline" className="font-bold border-primary/20 bg-primary/5 text-primary">
            {Object.keys(answers).length} / {results.length} Respondidas
          </Badge>
        </div>

        <div className="grid gap-8">
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
              pdfUrl={pdfUrl}
              onAnswered={(isCorrect, selected) => handleAnswer(idx, isCorrect, selected)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl h-auto min-h-[56px]">
          <TabsTrigger value="pdf" className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs md:text-sm font-black transition-all">
            <BrainCircuit className="h-4 w-4" /> Questões por IA
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs md:text-sm font-black transition-all">
            <Pencil className="h-4 w-4" /> Manual
          </TabsTrigger>
          <TabsTrigger value="discursiva" className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs md:text-sm font-black transition-all">
            <Sparkles className="h-4 w-4" /> Redação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm ring-1 ring-primary/10">
            <CardHeader>
              <CardDescription className="text-muted-foreground font-medium">Carregue seu PDF para gerar questões inéditas com Inteligência Artificial.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateFromPdf} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-bold">Arquivo PDF</Label>
                    <Input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, setFile)} className="bg-background border-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Tipo de Questão</Label>
                    <Select value={questionType} onValueChange={(v: any) => setQuestionType(v)}>
                      <SelectTrigger className="bg-background border-primary/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Certo ou Errado (Cebraspe)</SelectItem>
                        <SelectItem value="C">Múltipla Escolha (A-E)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Quantidade</Label>
                    <Input type="number" min={1} max={60} value={count} onChange={(e) => setCount(Number(e.target.value))} className="bg-background border-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Nível de Dificuldade</Label>
                    <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                      <SelectTrigger className="bg-background border-primary/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Iniciante</SelectItem>
                        <SelectItem value="medium">Intermediário</SelectItem>
                        <SelectItem value="hard">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 text-lg font-black bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 active:scale-95 transition-all" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Gerar Questões"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm ring-1 ring-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-black">Identificação Manual</CardTitle>
              <CardDescription className="font-medium">Cole textos de questões para formatá-las automaticamente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="Cole o texto aqui..." className="min-h-[200px] bg-background border-primary/20" value={manualText} onChange={(e) => setManualText(e.target.value)} />
              <Button onClick={handleManualParse} className="w-full h-12 font-black bg-accent text-accent-foreground" disabled={loading || !manualText}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Iniciar Treino Manual"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discursiva">
          <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm ring-1 ring-primary/10">
             <CardHeader><CardTitle className="font-black">Redação e Discursivas</CardTitle></CardHeader>
             <CardContent className="text-center py-12">
               <Sparkles className="h-12 w-12 mx-auto text-accent opacity-50 mb-4" />
               <p className="text-muted-foreground font-medium">Módulo de redação disponível para treino com temas sugeridos pela IA.</p>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
