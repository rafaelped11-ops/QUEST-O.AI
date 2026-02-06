"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Info, ThumbsUp, ThumbsDown, FileSearch } from "lucide-react";
import { Label } from "@/components/ui/label";

interface QuestionCardProps {
  index: number;
  question: string;
  options?: string[];
  correctAnswer: string;
  justification: string;
  sourcePage: number;
  type: 'A' | 'C';
  pdfUrl?: string | null;
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
  pdfUrl,
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

  const handleVerifySource = () => {
    if (pdfUrl) {
      // Abre o PDF na página específica. Nota: Muitos navegadores suportam #page=N
      window.open(`${pdfUrl}#page=${sourcePage}`, '_blank');
    }
  };

  const isCorrect = selectedAnswer === correctAnswer;

  return (
    <Card className={`overflow-hidden transition-all border-l-8 ${isSubmitted ? (isCorrect ? 'border-l-green-500' : 'border-l-destructive') : 'border-l-primary/20'} shadow-xl bg-card`}>
      <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-4 border-b">
        <div className="flex items-center gap-3">
          <Badge className="h-8 w-8 flex items-center justify-center rounded-lg font-black bg-primary text-primary-foreground shadow-md">{index}</Badge>
          <Badge variant="outline" className="uppercase text-[10px] font-black tracking-widest border-primary/20">
            {type === 'A' ? 'JULGAMENTO (C/E)' : 'MÚLTIPLA ESCOLHA'}
          </Badge>
        </div>
        {isSubmitted && (
           <Badge variant={isCorrect ? "default" : "destructive"} className="font-black px-4 animate-in slide-in-from-right-2">
            {isCorrect ? "ACERTOU!" : "ERROU"}
           </Badge>
        )}
      </CardHeader>
      
      <CardContent className="pt-8 pb-8 space-y-8">
        <div className="text-xl leading-relaxed font-bold text-foreground whitespace-pre-wrap">
          {question}
        </div>

        <div className="space-y-4">
          {type === 'A' ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                className={`flex-1 h-16 text-lg font-black border-2 transition-all active:scale-95 ${isSubmitted && correctAnswer === 'C' ? 'bg-green-500 border-green-600 text-white hover:bg-green-500' : ''} ${isSubmitted && selectedAnswer === 'C' && correctAnswer !== 'C' ? 'bg-destructive border-destructive text-white hover:bg-destructive' : ''} ${!isSubmitted && selectedAnswer === 'C' ? 'border-primary bg-primary/10' : 'border-primary/10'}`}
                onClick={() => handleSelection('C')}
                disabled={isSubmitted}
              >
                <ThumbsUp className="mr-2 h-6 w-6" /> CERTO
              </Button>
              <Button 
                variant="outline" 
                className={`flex-1 h-16 text-lg font-black border-2 transition-all active:scale-95 ${isSubmitted && correctAnswer === 'E' ? 'bg-green-500 border-green-600 text-white hover:bg-green-500' : ''} ${isSubmitted && selectedAnswer === 'E' && correctAnswer !== 'E' ? 'bg-destructive border-destructive text-white hover:bg-destructive' : ''} ${!isSubmitted && selectedAnswer === 'E' ? 'border-primary bg-primary/10' : 'border-primary/10'}`}
                onClick={() => handleSelection('E')}
                disabled={isSubmitted}
              >
                <ThumbsDown className="mr-2 h-6 w-6" /> ERRADO
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {options?.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isOptionCorrect = letter === correctAnswer;
                const isOptionSelected = letter === selectedAnswer;

                return (
                  <div 
                    key={i} 
                    onClick={() => handleSelection(letter)}
                    className={`flex items-center space-x-4 rounded-xl border-2 p-5 transition-all active:scale-[0.98] ${
                    isSubmitted 
                      ? (isOptionCorrect ? 'bg-green-500/10 border-green-500 shadow-sm' : isOptionSelected ? 'bg-destructive/10 border-destructive' : 'opacity-60 grayscale-[0.5]')
                      : 'border-muted/50 hover:border-primary/40 cursor-pointer hover:bg-muted/10'
                  }`}>
                    <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 font-black text-sm ${isSubmitted && isOptionCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-primary/30 text-primary'}`}>
                      {isSubmitted && isOptionCorrect ? <CheckCircle2 className="h-5 w-5" /> : letter}
                    </div>
                    <Label className="flex-1 cursor-pointer font-bold text-base leading-snug">
                       {opt}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      {isSubmitted && (
        <CardFooter className="flex flex-col gap-6 bg-muted/10 border-t p-8 animate-in slide-in-from-top-4 duration-500">
          <div className="w-full space-y-6">
            <div className="bg-card dark:bg-zinc-900/50 p-6 rounded-2xl shadow-inner border-2 border-primary/10 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-primary/5">
                <div className="flex items-center gap-2 text-primary">
                  <Info className="h-5 w-5" />
                  <h5 className="font-black uppercase text-[10px] tracking-widest">Gabarito Comentado</h5>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 px-4 text-[10px] gap-2 font-black border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                  onClick={handleVerifySource}
                  disabled={!pdfUrl}
                >
                  <FileSearch className="h-4 w-4" />
                  VERIFICAR FONTES (PÁG. {sourcePage})
                </Button>
              </div>
              
              <div className="text-sm md:text-base leading-relaxed text-foreground/90 font-medium italic whitespace-pre-wrap">
                {justification}
              </div>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
