
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Loader2, Sparkles, Pencil, BrainCircuit, CheckCircle2, XCircle, ChevronLeft, BarChart3, ListChecks, Save, RefreshCcw } from "lucide-react";
import { QuestionCard } from "@/components/question-card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { extractTextFromPdf } from "@/lib/pdf-actions";

export function GeneratorView() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
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
  const [hasSaved, setHasSaved] = useState(false);
  
  // Essay states
  const [essayTopics, setEssayTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [essayText, setEssayText] = useState("");
  const [essayCorrection, setEssayCorrection] = useState<any>(null);

  const [manualText, setManualText] = useState("");

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
      setHasSaved(false);
      toast({ title: "Simulado Gerado!" });
    } catch (error: any) {
      toast({ title: "Erro na Geração", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestEssay = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const pdfText = await extractTextFromPdf(formData);
      const response = await suggestEssayTopics({ content: pdfText });
      setEssayTopics(response.topics);
      toast({ title: "Temas sugeridos!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectEssay = async () => {
    if (!essayText || !selectedTopic) return;
    setLoading(true);
    try {
      const response = await correctEssay({ topic: selectedTopic, essay: essayText, maxScore: 100 });
      setEssayCorrection(response);
      toast({ title: "Redação corrigida!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
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
      setHasSaved(false);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao identificar questões.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!results) return { correct: 0, score: "0" };
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const total = results.length;
    let scoreValue = (correctCount / total) * 100;
    if (questionType === 'A') {
      const incorrectCount = total - correctCount;
      scoreValue = Math.max(0, (correctCount - incorrectCount) / total) * 100;
    }
    return { correct: correctCount, score: scoreValue.toFixed(1) };
  }, [answers, results, questionType]);

  const saveToHistory = () => {
    if (hasSaved) return;
    const id = Date.now().toString();
    const newItem = {
      id,
      name: file?.name || "Entrada Manual",
      type: results?.[0]?.type || questionType,
      date: new Date().toISOString(),
      count: results?.length || 0,
      score: stats.score,
    };

    // Save Local
    const current = JSON.parse(localStorage.getItem("study_history") || "[]");
    localStorage.setItem("study_history", JSON.stringify([newItem, ...current]));

    // Save Cloud
    if (user && db) {
      const docRef = doc(db, "users", user.uid, "questionnaires", id);
      setDocumentNonBlocking(docRef, { ...newItem, userId: user.uid, createdAt: serverTimestamp() }, { merge: true });
    }
    
    setHasSaved(true);
    toast({ title: "Questionário salvo!" });
  };

  const isFinished = results && Object.keys(answers).length === results.length;

  if (isQuizMode && results) {
    if (isFinished) {
      return (
        <div className="space-y-8 animate-in zoom-in-95 duration-500 max-w-4xl mx-auto">
          <Card className="border-none shadow-2xl bg-card overflow-hidden">
            <CardHeader className="text-center bg-primary/5 pb-8">
              <div className="mx-auto bg-background p-3 rounded-full w-fit shadow-xl mb-4">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-black">Desempenho Final</CardTitle>
              <CardDescription className="text-base font-medium">Resumo do seu simulado</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-6 bg-muted/20 rounded-2xl border">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1">Acertos</p>
                  <p className="text-4xl font-black text-green-500">{stats.correct}</p>
                </div>
                <div className="p-6 bg-muted/20 rounded-2xl border">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1">Erros</p>
                  <p className="text-4xl font-black text-destructive">{results.length - stats.correct}</p>
                </div>
                <div className="p-6 bg-primary text-primary-foreground rounded-2xl shadow-lg">
                  <p className="text-xs font-black uppercase opacity-80 tracking-widest mb-1">Aproveitamento</p>
                  <p className="text-4xl font-black">{stats.score}%</p>
                </div>
              </div>

              <div className="mt-12 space-y-4">
                <h4 className="font-black flex items-center gap-2"><ListChecks className="h-5 w-5" /> Resumo de Respostas</h4>
                <div className="divide-y border rounded-xl overflow-hidden bg-background">
                  {results.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="font-black">#{idx + 1}</Badge>
                        <span className="text-sm font-bold text-foreground">Sua resposta: {answers[idx]?.selected === 'C' ? 'CERTO' : answers[idx]?.selected === 'E' ? 'ERRADO' : answers[idx]?.selected}</span>
                      </div>
                      {answers[idx]?.isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center pb-8 border-t pt-8 bg-muted/10">
              <Button onClick={() => setIsQuizMode(false)} variant="outline" className="gap-2 font-black h-12">
                <RefreshCcw className="h-4 w-4" /> Gerar Novo Questionário
              </Button>
              <Button onClick={saveToHistory} disabled={hasSaved} className="gap-2 font-black h-12 bg-accent text-accent-foreground">
                <Save className="h-4 w-4" /> {hasSaved ? "Salvo no Histórico" : "Salvar no Histórico"}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="flex items-center justify-between sticky top-20 z-40 bg-background/80 backdrop-blur p-4 rounded-xl border">
          <Button variant="ghost" onClick={() => setIsQuizMode(false)} className="gap-2 font-bold">
            <ChevronLeft className="h-4 w-4" /> Sair do Simulado
          </Button>
          <Badge className="font-bold py-1 px-4 text-sm">
            Questão {Object.keys(answers).length + 1} de {results.length}
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
              onAnswered={(isCorrect, selected) => {
                if (!answers[idx]) handleAnswer(idx, isCorrect, selected);
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  function handleAnswer(index: number, isCorrect: boolean, selected: string) {
    setAnswers(prev => ({ ...prev, [index]: { isCorrect, selected } }));
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl h-14">
          <TabsTrigger value="pdf" className="gap-2 font-black rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <BrainCircuit className="h-4 w-4 hidden sm:inline" /> Questões por IA
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2 font-black rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <Pencil className="h-4 w-4 hidden sm:inline" /> Manual
          </TabsTrigger>
          <TabsTrigger value="discursiva" className="gap-2 font-black rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <Sparkles className="h-4 w-4 hidden sm:inline" /> Redação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <Card className="border-none shadow-xl bg-card ring-1 ring-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-black">Simulador Inteligente</CardTitle>
              <CardDescription className="font-medium">Carregue seu PDF e a IA criará questões inéditas focadas no seu conteúdo.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateFromPdf} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-bold">Arquivo PDF de Estudo</Label>
                    <Input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, setFile)} className="bg-background border-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Formato da Banca</Label>
                    <Select value={questionType} onValueChange={(v: any) => setQuestionType(v)}>
                      <SelectTrigger className="bg-background border-primary/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Certo ou Errado (Cebraspe)</SelectItem>
                        <SelectItem value="C">Múltipla Escolha (A-E)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Nº de Questões</Label>
                    <Input type="number" min={1} max={60} value={count} onChange={(e) => setCount(Number(e.target.value))} className="bg-background border-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Complexidade</Label>
                    <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                      <SelectTrigger className="bg-background border-primary/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Iniciante / Literal</SelectItem>
                        <SelectItem value="medium">Intermediário</SelectItem>
                        <SelectItem value="hard">Avançado / Doutrinário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 text-lg font-black bg-accent text-accent-foreground shadow-lg hover:bg-accent/90" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Gerar Questões"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card className="border-none shadow-xl bg-card ring-1 ring-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-black">Importação de Questões</CardTitle>
              <CardDescription className="font-medium">Cole o texto bruto de questões para que a IA organize seu simulado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="Cole aqui enunciados e alternativas..." className="min-h-[250px] bg-background border-primary/20 font-medium" value={manualText} onChange={(e) => setManualText(e.target.value)} />
              <Button onClick={handleManualParse} className="w-full h-12 font-black bg-accent text-accent-foreground" disabled={loading || !manualText}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Iniciar Treino Manual"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discursiva">
          <Card className="border-none shadow-xl bg-card ring-1 ring-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-black">Módulo de Redação</CardTitle>
              <CardDescription className="font-medium">Treine sua escrita com temas sugeridos com base no seu material e receba feedback instantâneo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {!file ? (
                <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/10">
                  <BrainCircuit className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-bold text-muted-foreground">Carregue um PDF na primeira aba para habilitar o treino de redação.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <Button onClick={handleSuggestEssay} disabled={loading} variant="outline" className="w-full h-12 border-accent/30 text-accent font-black hover:bg-accent/5">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Sugerir Temas Prováveis
                    </Button>
                    
                    {essayTopics.length > 0 && (
                      <div className="grid gap-3">
                        {essayTopics.map((topic, i) => (
                          <div 
                            key={i} 
                            onClick={() => setSelectedTopic(topic)}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all font-bold ${selectedTopic === topic ? 'border-primary bg-primary/5 text-primary' : 'border-muted/50 hover:border-primary/30'}`}
                          >
                            {topic}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedTopic && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4">
                      <Label className="font-black text-lg">Escreva sua Redação</Label>
                      <Textarea 
                        placeholder="Desenvolva seu texto aqui (Mínimo 20 linhas recomendadas para concursos)..." 
                        className="min-h-[400px] font-medium leading-relaxed"
                        value={essayText}
                        onChange={(e) => setEssayText(e.target.value)}
                      />
                      <Button onClick={handleCorrectEssay} disabled={loading || !essayText} className="w-full h-14 bg-accent text-accent-foreground font-black text-lg">
                         {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Corrigir e Avaliar Agora"}
                      </Button>
                    </div>
                  )}

                  {essayCorrection && (
                    <Card className="border-2 border-primary/20 bg-primary/5 shadow-inner">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Avaliação da Banca</span>
                          <Badge className="text-xl px-4 py-1 h-auto font-black">{essayCorrection.finalScore}/100</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">Feedback Geral</p>
                          <p className="font-medium text-foreground leading-relaxed">{essayCorrection.feedback}</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                            <p className="text-[10px] font-black uppercase text-green-700 mb-2">Pontos Fortes</p>
                            <ul className="text-xs space-y-1 font-bold text-green-900">
                              {essayCorrection.strengths.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                            </ul>
                          </div>
                          <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                            <p className="text-[10px] font-black uppercase text-destructive mb-2">Oportunidades de Melhoria</p>
                            <ul className="text-xs space-y-1 font-bold text-destructive">
                              {essayCorrection.weaknesses.map((w: string, i: number) => <li key={i}>• {w}</li>)}
                            </ul>
                          </div>
                        </div>
                        <div className="p-6 bg-background rounded-xl border shadow-sm">
                           <p className="text-[10px] font-black uppercase text-muted-foreground mb-3">Análise Detalhada (Critérios Cebraspe)</p>
                           <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{essayCorrection.detailedAnalysis}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
