// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '@/utils/firebaseConfig';
import db from '@/utils/firestore';
import { useRouter } from 'next/navigation';
import { Survey } from '@/types/survey';
import { Plus, BarChart2, Pencil, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Response {
    surveyId: string;
    id: string;
    answers: {
      questionId: string;
      answer: string | string[];
    }[];
    submittedAt: Date;
  }

export default function DashboardPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthChecked(true);
      if (!user) {
        toast({
          title: "Помилка",
          description: "Будь ласка, увійдіть в систему",
          variant: "destructive",
        });
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchSurveys = async () => {
      if (!auth.currentUser) return;

      try {
        const surveysQuery = query(
          collection(db, 'surveys'),
          where('authorId', '==', auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(surveysQuery);
        const surveysData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt.toDate(),
        })) as Survey[];

        // Сортуємо за датою створення (найновіші перші)
        surveysData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setSurveys(surveysData);
      } catch (error) {
        console.error('Error fetching surveys:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити опитування",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchResponses = async () => {
        if (!auth.currentUser) return;
    
        try {
            const responsesQuery = query(
            collection(db, 'responses')
            );
    
            const querySnapshot = await getDocs(responsesQuery);
            const responsesData = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            submittedAt: doc.data().submittedAt.toDate(),
            })) as Response[];
    
            setResponses(responsesData);
        } catch (error) {
            console.error('Error fetching responses:', error);
            toast({
            title: "Помилка",
            description: "Не вдалося завантажити відповіді",
            variant: "destructive",
            });
        }
        };

    if (authChecked && auth.currentUser) {
      fetchSurveys();
      fetchResponses();
    }
  }, [authChecked]);

  if (!authChecked || isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Завантаження...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Мої опитування</h1>
        <Button onClick={() => router.push('/surveys/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Створити нове опитування
        </Button>
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>У вас ще немає опитувань</CardTitle>
            <CardDescription>
              Створіть своє перше опитування, натиснувши кнопку "Створити нове опитування"
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Назва</TableHead>
                <TableHead>Створено</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Відповідей</TableHead>
                <TableHead className="text-right pr-20">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell className="font-medium">{survey.title}</TableCell>
                  <TableCell>{survey.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      survey.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {survey.isActive ? 'Активне' : 'Неактивне'}
                    </span>
                  </TableCell>
                <TableCell>{responses.filter((response: Response) => response.surveyId === survey.id).length}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/surveys/${survey.id}`)}
                    >
                      Переглянути
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/${survey.id}`)}
                    >
                      <BarChart2 className="w-4 h-4" />
                    </Button>
            
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button> */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}