
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
    <Card className={`overflow-hidden transition-all border-l-8 ${isSubmitted ? (isCorrect ? 'border-l-green-500' : 'border-l-red-500') : 'border-l-primary'}`}>
      <CardHeader className="flex flex-row items-center justify-between bg-muted/30 pb-4">
        <div className="flex items-center gap-3">
          <Badge className="h-7 w-7 flex items-center justify-center rounded-full font-bold">{index}</Badge>
          <Badge variant="secondary" className="uppercase text-[10px] tracking-widest font-bold">
            {type === 'A' ? 'Certo/Errado' : 'Múltipla Escolha'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="text-lg leading-relaxed font-medium text-foreground whitespace-pre-wrap">
          {question}
        </div>

        <div className="space-y-3">
          {type === 'A' ? (
            <div className="flex gap-4">
              <Button 
                variant={selectedAnswer === 'C' ? 'default' : 'outline'} 
                className={`flex-1 h-14 text-lg ${isSubmitted && correctAnswer === 'C' ? 'bg-green-500 hover:bg-green-600 text-white' : ''} ${isSubmitted && selectedAnswer === 'C' && correctAnswer !== 'C' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
                onClick={() => !isSubmitted && setSelectedAnswer('C')}
                disabled={isSubmitted}
              >
                <ThumbsUp className="mr-2 h-5 w-5" /> Certo
              </Button>
              <Button 
                variant={selectedAnswer === 'E' ? 'default' : 'outline'} 
                className={`flex-1 h-14 text-lg ${isSubmitted && correctAnswer === 'E' ? 'bg-green-500 hover:bg-green-600 text-white' : ''} ${isSubmitted && selectedAnswer === 'E' && correctAnswer !== 'E' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
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
                  <div key={i} className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                    isSubmitted 
                      ? (isOptionCorrect ? 'bg-green-500/10 border-green-500' : isOptionSelected ? 'bg-red-500/10 border-red-500' : 'opacity-50')
                      : 'hover:bg-muted/50 cursor-pointer'
                  }`}>
                    <RadioGroupItem value={letter} id={`q-${index}-${letter}`} disabled={isSubmitted} />
                    <Label htmlFor={`q-${index}-${letter}`} className="flex-1 cursor-pointer font-medium">
                      <span className="font-bold mr-2">{letter})</span> {opt}
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
          <Button onClick={handleCheck} className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold">
            Verificar Resposta
          </Button>
        ) : (
          <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {isCorrect ? <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" /> : <XCircle className="h-6 w-6 text-red-600 shrink-0" />}
              <div>
                <h4 className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Você acertou!' : 'Resposta Incorreta'}
                </h4>
                <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  Gabarito: <span className="font-black underline">{correctAnswer === 'C' ? 'Certo' : correctAnswer === 'E' ? 'Errado' : correctAnswer}</span>
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Info className="h-5 w-5" />
                <h5 className="font-bold uppercase text-xs tracking-wider">Justificativa do Professor</h5>
              </div>
              <p className="text-sm leading-relaxed text-foreground italic whitespace-pre-wrap">
                {justification}
              </p>
              <div className="pt-2 flex justify-end">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-2 font-semibold">
                  <ExternalLink className="h-4 w-4" />
                  Verificar fontes (Pág. {sourcePage})
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
