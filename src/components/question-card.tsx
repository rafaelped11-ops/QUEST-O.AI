"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Info, ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuestionCardProps {
  index: number;
  question: string;
  options?: string[];
  correctAnswer: string;
  justification: string;
  sourcePage: number;
  type: 'A' | 'C';
  onAnswered?: (isCorrect: boolean | null) => void;
}

export function QuestionCard({ 
  index, 
  question, 
  options, 
  correctAnswer, 
  justification, 
  sourcePage, 
  type,
  onAnswered 
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleCheck = () => {
    if (!selectedAnswer) {
      toast({ title: "Selecione uma resposta", description: "Escolha uma opção antes de verificar.", variant: "destructive" });
      return;
    }
    setIsSubmitted(true);
    const correct = selectedAnswer === correctAnswer;
    onAnswered?.(correct);
  };

  const isCorrect = selectedAnswer === correctAnswer;

  return (
    <Card className={`overflow-hidden transition-all border-l-8 ${isSubmitted ? (isCorrect ? 'border-l-green-500' : 'border-l-destructive') : 'border-l-accent'} shadow-lg bg-card/50`}>
      <CardHeader className="flex flex-row items-center justify-between bg-muted/30 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Badge className="h-8 w-8 flex items-center justify-center rounded-lg font-black bg-accent text-accent-foreground">{index}</Badge>
          <Badge variant="outline" className="uppercase text-[10px] tracking-widest font-black border-accent/30 text-accent-foreground bg-accent/5">
            {type === 'A' ? 'Certo/Errado' : 'Múltipla Escolha'}
          </Badge>
        </div>
        {isSubmitted && (
           <Badge variant={isCorrect ? "default" : "destructive"} className="font-bold">
            {isCorrect ? "Correto" : "Incorreto"}
           </Badge>
        )}
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="text-lg leading-relaxed font-bold text-foreground whitespace-pre-wrap">
          {question}
        </div>

        <div className="space-y-3">
          {type === 'A' ? (
            <div className="flex gap-4">
              <Button 
                variant={selectedAnswer === 'C' ? 'default' : 'outline'} 
                className={`flex-1 h-14 text-lg font-bold border-2 ${isSubmitted && correctAnswer === 'C' ? 'bg-green-500 border-green-600 text-white' : ''} ${isSubmitted && selectedAnswer === 'C' && correctAnswer !== 'C' ? 'bg-destructive border-destructive text-white' : ''} ${selectedAnswer === 'C' && !isSubmitted ? 'bg-accent border-accent text-accent-foreground' : 'border-accent/20'}`}
                onClick={() => !isSubmitted && setSelectedAnswer('C')}
                disabled={isSubmitted}
              >
                <ThumbsUp className="mr-2 h-5 w-5" /> Certo
              </Button>
              <Button 
                variant={selectedAnswer === 'E' ? 'default' : 'outline'} 
                className={`flex-1 h-14 text-lg font-bold border-2 ${isSubmitted && correctAnswer === 'E' ? 'bg-green-500 border-green-600 text-white' : ''} ${isSubmitted && selectedAnswer === 'E' && correctAnswer !== 'E' ? 'bg-destructive border-destructive text-white' : ''} ${selectedAnswer === 'E' && !isSubmitted ? 'bg-accent border-accent text-accent-foreground' : 'border-accent/20'}`}
                onClick={() => !isSubmitted && setSelectedAnswer('E')}
                disabled={isSubmitted}
              >
                <ThumbsDown className="mr-2 h-5 w-5" /> Errado
              </Button>
            </div>
          ) : (
            <RadioGroup value={selectedAnswer || ""} onValueChange={(v) => !isSubmitted && setSelectedAnswer(v)} className="space-y-2">
              {options?.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isOptionCorrect = letter === correctAnswer;
                const isOptionSelected = letter === selectedAnswer;

                return (
                  <div key={i} className={`flex items-center space-x-3 rounded-xl border-2 p-4 transition-all ${
                    isSubmitted 
                      ? (isOptionCorrect ? 'bg-green-500/10 border-green-500' : isOptionSelected ? 'bg-destructive/10 border-destructive' : 'opacity-50')
                      : selectedAnswer === letter ? 'bg-accent/10 border-accent' : 'border-accent/10 hover:border-accent/40 cursor-pointer'
                  }`}>
                    <RadioGroupItem value={letter} id={`q-${index}-${letter}`} disabled={isSubmitted} className="border-accent text-accent" />
                    <Label htmlFor={`q-${index}-${letter}`} className="flex-1 cursor-pointer font-bold">
                      <span className="text-accent mr-2">{letter})</span> {opt}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 bg-muted/10 border-t p-6">
        {!isSubmitted ? (
          <Button onClick={handleCheck} className="w-full md:w-auto bg-accent hover:bg-accent/80 text-accent-foreground font-black shadow-lg">
            Verificar Resposta
          </Button>
        ) : (
          <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
              {isCorrect ? <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" /> : <XCircle className="h-6 w-6 text-destructive shrink-0" />}
              <div>
                <h4 className={`font-black ${isCorrect ? 'text-green-800 dark:text-green-400' : 'text-destructive'}`}>
                  {isCorrect ? 'Excelente!' : 'Não desanime'}
                </h4>
                <p className={`text-sm font-bold ${isCorrect ? 'text-green-700 dark:text-green-500' : 'text-destructive/80'}`}>
                  Gabarito oficial: <span className="underline decoration-wavy">{correctAnswer === 'C' ? 'Certo' : correctAnswer === 'E' ? 'Errado' : correctAnswer}</span>
                </p>
              </div>
            </div>

            <div className="bg-card dark:bg-zinc-900/50 p-5 rounded-xl shadow-inner border-2 border-accent/10 space-y-3">
              <div className="flex items-center gap-2 text-accent">
                <Info className="h-5 w-5" />
                <h5 className="font-black uppercase text-[10px] tracking-widest">Justificativa do Professor</h5>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 font-medium italic whitespace-pre-wrap">
                {justification}
              </p>
              <div className="pt-2 flex justify-end">
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80 hover:bg-accent/10 gap-2 font-black">
                  <ExternalLink className="h-4 w-4" />
                  Pág. {sourcePage}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}