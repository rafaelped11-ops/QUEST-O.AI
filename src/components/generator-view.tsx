
"use client";

import { useState } from "react";
import { generateQuestionsFromTopic, type GenerateQuestionsFromTopicOutput } from "@/ai/flows/generate-questions-from-topic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, Send, BookMarked } from "lucide-react";
import { QuestionCard } from "@/components/question-card";
import { useToast } from "@/hooks/use-toast";

export function GeneratorView() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GenerateQuestionsFromTopicOutput | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        title: "Tópico obrigatório",
        description: "Por favor, insira um assunto para gerar as questões.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await generateQuestionsFromTopic({
        topic,
        difficulty,
        numberOfQuestions: count,
      });
      setResults(response);
      toast({
        title: "Sucesso!",
        description: `${response.questions.length} questões geradas para ${topic}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao gerar questões",
        description: "Ocorreu um problema ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-2 border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Configurar Simulado
          </CardTitle>
          <CardDescription>
            Defina o assunto e o nível de desafio que você deseja enfrentar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="topic">Assunto ou Tópico</Label>
              <div className="relative">
                <BookMarked className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="topic" 
                  placeholder="Ex: Direito Administrativo, Crase, Geometria..." 
                  className="pl-10"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 md:col-span-2">
              <div className="flex justify-between items-center">
                <Label>Quantidade de Questões: {count}</Label>
              </div>
              <Slider 
                min={1} 
                max={10} 
                step={1} 
                value={[count]} 
                onValueChange={(val) => setCount(val[0])}
                className="py-4"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button 
                type="submit" 
                disabled={loading} 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gerar Questões
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Resultados</h2>
            <p className="text-sm text-muted-foreground">
              Mostrando {results.questions.length} questões sobre {topic}
            </p>
          </div>
          <div className="grid gap-4">
            {results.questions.map((q, idx) => (
              <QuestionCard 
                key={idx} 
                index={idx + 1} 
                question={q.question} 
                answer={q.answer} 
                currentDifficulty={difficulty}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
