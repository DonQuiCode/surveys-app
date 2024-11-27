'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { auth } from '@/utils/firebaseConfig';
import db from '@/utils/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

import type { Question, QuestionType, Survey } from '@/types/survey';

export default function CreateSurveyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [survey, setSurvey] = useState<Partial<Survey>>({
    title: '',
    description: '',
    questions: [],
    isPublic: true,
    isActive: true,
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      text: '',
      type: 'text',
      required: true,
      options: [],
    };

    setSurvey((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion],
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions?.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    }));
  };

  const removeQuestion = (questionId: string) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions?.filter((q) => q.id !== questionId),
    }));
  };

  const addOption = (questionId: string) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions?.map((q) =>
        q.id === questionId
          ? { ...q, options: [...(q.options || []), ''] }
          : q
      ),
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions?.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options?.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      ),
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      if (!auth.currentUser) {
        toast({
          title: "Помилка",
          description: "Ви повинні бути авторизовані для створення опитування",
          variant: "destructive",
        });
        return;
      }

      if (!survey.title || !survey.questions?.length) {
        toast({
          title: "Помилка",
          description: "Заповніть назву та додайте хоча б одне питання",
          variant: "destructive",
        });
        return;
      }

      const surveyData: Survey = {
        ...survey as Survey,
        authorId: auth.currentUser.uid,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'surveys'), surveyData);
      
      toast({
        title: "Успіх",
        description: "Опитування успішно створено",
      });

      router.push(`/surveys/${docRef.id}`);
    } catch (error) {
      console.error('Error creating survey:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити опитування",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6">Створення нового опитування</h1>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Input
            placeholder="Назва опитування"
            value={survey.title}
            onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
          />
          <Textarea
            placeholder="Опис опитування"
            value={survey.description}
            onChange={(e) => setSurvey({ ...survey, description: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={survey.isPublic}
              onCheckedChange={(checked) => setSurvey({ ...survey, isPublic: checked })}
            />
            <span>Публічне опитування</span>
          </div>
        </div>

        <div className="space-y-4">
          {survey.questions?.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-4">
                    <Input
                      placeholder="Текст питання"
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(question.id, { text: e.target.value })
                      }
                    />
                    
                    <Select
                      value={question.type}
                      onValueChange={(value: QuestionType) =>
                        updateQuestion(question.id, { type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Тип питання" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Текстова відповідь</SelectItem>
                        <SelectItem value="single">Одиночний вибір</SelectItem>
                        <SelectItem value="multiple">Множинний вибір</SelectItem>
                      </SelectContent>
                    </Select>

                    {(question.type === 'single' || question.type === 'multiple') && (
                      <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => (
                          <Input
                            key={optionIndex}
                            placeholder={`Варіант ${optionIndex + 1}`}
                            value={option}
                            onChange={(e) =>
                              updateOption(question.id, optionIndex, e.target.value)
                            }
                          />
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(question.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Додати варіант
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked) =>
                      updateQuestion(question.id, { required: checked })
                    }
                  />
                  <span>Обов'язкове питання</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addQuestion}>
          <Plus className="w-4 h-4 mr-2" />
          Додати питання
        </Button>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Зберегти опитування
          </Button>
        </div>
      </div>
    </div>
  );
}