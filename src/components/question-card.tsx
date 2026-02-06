
"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Info, ThumbsUp, ThumbsDown, FileSearch } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuestionCardProps {
  index: number;
  question: string;
  options?: string[];
  correctAnswer: string;
  justification: string;
  sourcePage: number;
  type: 'A' | 'C';
  onAnswered: (isCorrect: boolean, selected: string) => void;
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

  const handleSelection = (value: string) => {
    if (isSubmitted) return;
    setSelectedAnswer(value);
    setIsSubmitted(true);
    onAnswered(value === correctAnswer, value);
  };

  const isCorrect = selectedAnswer === correctAnswer;

  return (
    <Card className={`overflow-hidden transition-all border-l-8 ${isSubmitted ? (isCorrect ? 'border-l-green-500' : 'border-l-destructive') : 'border-l-accent/20'} shadow-lg bg-card/50`}>
      <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-3 border-b">
        <div className="flex items-center gap-3">
          <Badge className="h-8 w-8 flex items-center justify-center rounded-lg font-black bg-accent text-accent-foreground">{index}</Badge>
          <Badge variant="outline" className="uppercase text-[10px] tracking-widest font-black border-accent/30 text-accent-foreground">
            {type === 'A' ? 'Certo/Errado' : 'Múltipla Escolha'}
          </Badge>
        </div>
        {isSubmitted && (
           <Badge variant={isCorrect ? "default" : "destructive"} className="font-bold flex gap-1">
            {isCorrect ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {isCorrect ? "Acertou" : "Errou"}
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
                variant="outline" 
                className={`flex-1 h-14 text-lg font-bold border-2 transition-all ${isSubmitted && correctAnswer === 'C' ? 'bg-green-500 border-green-600 text-white hover:bg-green-500' : ''} ${isSubmitted && selectedAnswer === 'C' && correctAnswer !== 'C' ? 'bg-destructive border-destructive text-white hover:bg-destructive' : ''} ${!isSubmitted && selectedAnswer === 'C' ? 'border-accent bg-accent/10' : 'border-accent/10'}`}
                onClick={() => handleSelection('C')}
                disabled={isSubmitted}
              >
                <ThumbsUp className="mr-2 h-5 w-5" /> Certo
              </Button>
              <Button 
                variant="outline" 
                className={`flex-1 h-14 text-lg font-bold border-2 transition-all ${isSubmitted && correctAnswer === 'E' ? 'bg-green-500 border-green-600 text-white hover:bg-green-500' : ''} ${isSubmitted && selectedAnswer === 'E' && correctAnswer !== 'E' ? 'bg-destructive border-destructive text-white hover:bg-destructive' : ''} ${!isSubmitted && selectedAnswer === 'E' ? 'border-accent bg-accent/10' : 'border-accent/10'}`}
                onClick={() => handleSelection('E')}
                disabled={isSubmitted}
              >
                <ThumbsDown className="mr-2 h-5 w-5" /> Errado
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {options?.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isOptionCorrect = letter === correctAnswer;
                const isOptionSelected = letter === selectedAnswer;

                return (
                  <div 
                    key={i} 
                    onClick={() => handleSelection(letter)}
                    className={`flex items-center space-x-3 rounded-xl border-2 p-4 transition-all ${
                    isSubmitted 
                      ? (isOptionCorrect ? 'bg-green-500/10 border-green-500' : isOptionSelected ? 'bg-destructive/10 border-destructive' : 'opacity-60')
                      : 'border-accent/10 hover:border-accent/40 cursor-pointer active:scale-[0.99]'
                  }`}>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSubmitted && isOptionCorrect ? 'bg-green-500 border-green-500' : 'border-accent/30'}`}>
                      {isSubmitted && isOptionCorrect && <CheckCircle2 className="h-4 w-4 text-white" />}
                      {!isSubmitted && selectedAnswer === letter && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
                    </div>
                    <Label className="flex-1 cursor-pointer font-bold text-sm md:text-base">
                      <span className="text-accent mr-2 font-black">{letter})</span> {opt}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      {isSubmitted && (
        <CardFooter className="flex flex-col gap-4 bg-muted/10 border-t p-6 animate-in slide-in-from-top-2 duration-300">
          <div className="w-full space-y-4">
            <div className="bg-card dark:bg-zinc-900/50 p-5 rounded-xl shadow-inner border-2 border-accent/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-accent">
                  <Info className="h-4 w-4" />
                  <h5 className="font-black uppercase text-[10px] tracking-widest">Justificativa Comentada</h5>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-accent gap-2 font-black border-accent/20 cursor-help">
                        <FileSearch className="h-3 w-3" />
                        Pág. {sourcePage}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="bg-accent text-accent-foreground font-bold">
                      Referência extraída da página {sourcePage} do seu PDF original.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <p className="text-sm leading-relaxed text-foreground/90 font-medium italic whitespace-pre-wrap">
                {justification}
              </p>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
