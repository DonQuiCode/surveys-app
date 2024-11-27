// app/surveys/[id]/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import db from '@/utils/firestore';
import { useRouter } from 'next/navigation';
import { Survey } from '@/types/survey';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface SurveyResponseProps {
    params: Promise<{
      id: string;
    }>;
  }

interface Answer {
  questionId: string;
  answer: string | string[];
}

export default function SurveyResponsePage({ params }: SurveyResponseProps) {
  const { id } = use(params); // розпаковуємо params за допомогою use
  const router = useRouter();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const surveyDoc = await getDoc(doc(db, 'surveys', id)); // використовуємо id замість params.id
        if (surveyDoc.exists()) {
          const surveyData = surveyDoc.data() as Survey;
          setSurvey({ ...surveyData, id: surveyDoc.id });
          
          // Ініціалізуємо відповіді
          const initialAnswers = surveyData.questions.map(question => ({
            questionId: question.id,
            answer: question.type === 'multiple' ? [] : ''
          }));
          setAnswers(initialAnswers);
        } else {
          toast({
            title: "Помилка",
            description: "Опитування не знайдено",
            variant: "destructive",
          });
          router.push('/surveys');
        }
      } catch (error) {
        console.error('Error fetching survey:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити опитування",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [id, router]);

  const handleTextAnswer = (questionId: string, value: string) => {
    setAnswers(prev =>
      prev.map(a =>
        a.questionId === questionId ? { ...a, answer: value } : a
      )
    );
  };

  const handleSingleChoice = (questionId: string, value: string) => {
    setAnswers(prev =>
      prev.map(a =>
        a.questionId === questionId ? { ...a, answer: value } : a
      )
    );
  };

  const handleMultipleChoice = (questionId: string, value: string, checked: boolean) => {
    setAnswers(prev =>
      prev.map(a => {
        if (a.questionId === questionId) {
          const currentAnswers = Array.isArray(a.answer) ? a.answer : [];
          const newAnswers = checked
            ? [...currentAnswers, value]
            : currentAnswers.filter(v => v !== value);
          return { ...a, answer: newAnswers };
        }
        return a;
      })
    );
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Валідація обов'язкових полів
      const unansweredRequired = survey?.questions.some(
        question =>
          question.required &&
          (!answers.find(a => a.questionId === question.id)?.answer ||
            (Array.isArray(answers.find(a => a.questionId === question.id)?.answer) &&
              !(answers.find(a => a.questionId === question.id)?.answer as string[]).length))
      );

      if (unansweredRequired) {
        toast({
          title: "Помилка",
          description: "Будь ласка, дайте відповідь на всі обов'язкові питання",
          variant: "destructive",
        });
        return;
      }

      // Зберігаємо відповіді
      await addDoc(collection(db, 'responses'), {
        surveyId: id,
        answers,
        submittedAt: new Date()
      });

      toast({
        title: "Успіх",
        description: "Ваші відповіді збережено",
      });

      router.push('/surveys/thank-you');
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти відповіді",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-8 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-4 mt-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full" />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!survey) {
    return null;
  }

  return (
    <div className="container max-w-3xl py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
          {survey.description && (
            <CardDescription>{survey.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {survey.questions.map((question) => (
          <Card key={question.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Label className="text-base">
                    {question.text}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                </div>

                {question.type === 'text' && (
                  <Textarea
                    value={
                      (answers.find(a => a.questionId === question.id)
                        ?.answer as string) || ''
                    }
                    onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                    placeholder="Ваша відповідь..."
                  />
                )}

                {question.type === 'single' && (
                  <RadioGroup
                    value={
                      (answers.find(a => a.questionId === question.id)
                        ?.answer as string) || ''
                    }
                    onValueChange={(value) => handleSingleChoice(question.id, value)}
                  >
                    <div className="space-y-2">
                      {question.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                          <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {question.type === 'multiple' && (
                  <div className="space-y-2">
                    {question.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${question.id}-${index}`}
                          checked={
                            (answers.find(a => a.questionId === question.id)
                              ?.answer as string[])?.includes(option) || false
                          }
                          onCheckedChange={(checked) =>
                            handleMultipleChoice(question.id, option, checked as boolean)
                          }
                        />
                        <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Відправлення...' : 'Відправити відповіді'}
          </Button>
        </div>
      </div>
    </div>
  );
}