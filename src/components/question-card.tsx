
"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, RotateCcw, CheckCircle2, ChevronDown } from "lucide-react";
import { adjustQuestionDifficulty } from "@/ai/flows/adjust-question-difficulty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface QuestionCardProps {
  index: number;
  question: string;
  answer: string;
  currentDifficulty: string;
}

export function QuestionCard({ index, question: initialQuestion, answer, currentDifficulty: initialDifficulty }: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [questionText, setQuestionText] = useState(initialQuestion);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const { toast } = useToast();

  const handleAdjustDifficulty = async (newDifficulty: string) => {
    if (newDifficulty === difficulty) return;
    
    setIsAdjusting(true);
    try {
      const result = await adjustQuestionDifficulty({
        question: questionText,
        currentDifficulty: difficulty,
        desiredDifficulty: newDifficulty,
      });
      setQuestionText(result.adjustedQuestion);
      setDifficulty(newDifficulty);
      toast({
        title: "Dificuldade Ajustada",
        description: `Questão agora está em nível ${newDifficulty}.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao ajustar",
        description: "Não foi possível ajustar a dificuldade agora.",
        variant: "destructive",
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-l-4 border-l-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/30 pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">#{index}</Badge>
          <Badge 
            variant="secondary" 
            className={`${
              difficulty === 'hard' ? 'bg-destructive/10 text-destructive' : 
              difficulty === 'medium' ? 'bg-accent/10 text-accent-foreground' : 
              'bg-primary/10 text-primary-foreground'
            }`}
          >
            {difficulty === 'easy' ? 'Fácil' : difficulty === 'medium' ? 'Médio' : 'Difícil'}
          </Badge>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isAdjusting} className="h-8 gap-1">
              Ajustar Nível <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAdjustDifficulty("easy")}>Fácil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAdjustDifficulty("medium")}>Médio</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAdjustDifficulty("hard")}>Difícil</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className={`prose prose-sm max-w-none text-foreground ${isAdjusting ? 'opacity-50 grayscale animate-pulse' : ''}`}>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{questionText}</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-4 border-t bg-muted/10 pt-4">
        <div className="flex w-full justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAnswer(!showAnswer)}
            className="gap-2"
          >
            {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showAnswer ? "Esconder Resposta" : "Ver Resposta"}
          </Button>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
            <CheckCircle2 className="h-5 w-5" />
          </Button>
        </div>

        {showAnswer && (
          <div className="w-full p-4 rounded-md bg-accent/5 border border-accent/20 animate-in zoom-in-95 duration-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Gabarito / Comentário</h4>
            <p className="text-sm font-medium text-foreground italic">{answer}</p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
