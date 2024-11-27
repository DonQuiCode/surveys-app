// app/dashboard/[id]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth } from "@/utils/firebaseConfig";
import db from "@/utils/firestore";
import { useRouter } from "next/navigation";
import { Survey } from "@/types/survey";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface SurveyResultsProps {
  params: Promise<{
    id: string;
  }>;
}

interface Response {
  id: string;
  answers: {
    questionId: string;
    answer: string | string[];
  }[];
  submittedAt: Date;
}

interface QuestionStats {
  questionId: string;
  questionText: string;
  type: string;
  totalResponses: number;
  data: Array<{
    option: string;
    count: number;
    percentage: number;
  }>;
  textResponses?: string[];
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export default function SurveyResultsPage({ params }: SurveyResultsProps) {
    console.log("Component rendering, params:", params);

  const { id } = use(params);
  console.log("ID extracted:", id);

  const router = useRouter();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [stats, setStats] = useState<QuestionStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log("Survey, responses, stats, isLoading states initialized", survey?.description, responses[0]?.submittedAt);

  console.log("States initialized");


  useEffect(() => {
    console.log("Effect running");

    const fetchSurveyAndResponses = async () => {
      try {
        console.log("Fetching survey data for id:", id);
        // Отримуємо дані опитування
        const surveyDoc = await getDoc(doc(db, "surveys", id));
        if (!surveyDoc.exists()) {
          toast({
            title: "Помилка",
            description: "Опитування не знайдено",
            variant: "destructive",
          });
          router.push("/dashboard");
          return;
        }

        const surveyData = { ...surveyDoc.data(), id: surveyDoc.id } as Survey;
        setSurvey(surveyData);

        // Перевіряємо права доступу
        if (surveyData.authorId !== auth.currentUser?.uid) {
          toast({
            title: "Помилка",
            description: "У вас немає доступу до цього опитування",
            variant: "destructive",
          });
          router.push("/dashboard");
          return;
        }

        // Отримуємо всі відповіді
        const responsesQuery = query(
          collection(db, "responses"),
          where("surveyId", "==", id)
        );
        const responsesSnapshot = await getDocs(responsesQuery);
        const responsesData = responsesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt.toDate(),
        })) as Response[];
        setResponses(responsesData);

        // Обробляємо статистику
        const questionStats = surveyData.questions.map((question) => {
          const stats: QuestionStats = {
            questionId: question.id,
            questionText: question.text,
            type: question.type,
            totalResponses: responsesData.length,
            data: [],
          };

          if (question.type === "text") {
            stats.textResponses = responsesData
              .map(
                (response) =>
                  response.answers.find((a) => a.questionId === question.id)
                    ?.answer as string
              )
              .filter(Boolean);
          } else {
            const optionCounts = new Map<string, number>();

            // Ініціалізуємо лічильники для всіх опцій
            question.options?.forEach((option) => optionCounts.set(option, 0));

            // Підраховуємо відповіді
            responsesData.forEach((response) => {
              const answer = response.answers.find(
                (a) => a.questionId === question.id
              )?.answer;
              if (Array.isArray(answer)) {
                answer.forEach((option) => {
                  optionCounts.set(option, (optionCounts.get(option) || 0) + 1);
                });
              } else if (answer) {
                optionCounts.set(answer, (optionCounts.get(answer) || 0) + 1);
              }
            });

            stats.data = Array.from(optionCounts.entries()).map(
              ([option, count]) => ({
                option,
                count,
                percentage: (count / responsesData.length) * 100,
              })
            );
          }

          return stats;
        });

        setStats(questionStats);
      } catch (error) {
        console.error("Error fetching survey results:", error);
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити результати",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurveyAndResponses();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
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
    <div className="container max-w-7xl py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
          {survey.description && (
            <CardDescription>{survey.description}</CardDescription>
          )}
          <div className="text-sm text-muted-foreground">
            Всього відповідей: {responses.length}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((questionStat) => (
          <Card key={questionStat.questionId} className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {questionStat.questionText}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {questionStat.type === "text" ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {questionStat.textResponses?.map((response, index) => (
                    <div key={index} className="p-2 bg-secondary rounded-md">
                      {response}
                    </div>
                  ))}
                </div>
              ) : questionStat.type === "single" ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={questionStat.data}
                        dataKey="count"
                        nameKey="option"
                        cx="50%"
                        cy="50%"
                        label={({ option, percentage }) =>
                          `${option}: ${percentage.toFixed(1)}%`
                        }
                      >
                        {questionStat.data.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={questionStat.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="option" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
