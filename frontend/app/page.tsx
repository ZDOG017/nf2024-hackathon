'use client';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Application {
  [key: string]: string;
}

interface EvaluationResult {
  verdict: string;
  explanation: string;
}

export default function Home() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentApplication, setCurrentApplication] = useState<Application | null>(null);
  const [mentorVerdict, setMentorVerdict] = useState<string>('');
  const [mentorExplanation, setMentorExplanation] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [passedCandidates, setPassedCandidates] = useState<number>(0);
  const [githubLinkRequested, setGithubLinkRequested] = useState<boolean>(false);
  const [currentGithubLink, setCurrentGithubLink] = useState<string>('');

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications(): Promise<void> {
    try {
      const response = await axios.get<string[][]>('http://localhost:5000/applications');
      const [headers, ...data] = response.data;
      const formattedApplications = data.map(row =>
        headers.reduce((acc, header, index) => {
          acc[header] = row[index];
          return acc;
        }, {} as Application)
      );
      setApplications(formattedApplications);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setLoading(false);
    }
  }

  async function evaluateApplication(application: Application, index: number): Promise<EvaluationResult> {
    try {
      const response = await axios.post<EvaluationResult>('http://localhost:5000/evaluate', {
        application,
        row: index + 2,
      });
      return response.data;
    } catch (error) {
      console.error('Error evaluating application:', error);
      return { verdict: 'Error', explanation: 'Failed to evaluate' };
    }
  }

  async function evaluateAllApplications(): Promise<void> {
    setEvaluating(true);
    setCurrentIndex(0);
    const updatedApplications = [...applications];
  
    for (let i = 0; i < updatedApplications.length; i++) {
      setCurrentIndex(i);
      const result = await evaluateApplication(updatedApplications[i], i);
      updatedApplications[i].verdict = result.verdict;
      updatedApplications[i].explanation = result.explanation;
  
      if (result.verdict === 'Не уверен') {
        setCurrentApplication({ ...updatedApplications[i], row: (i + 2).toString() });
        break;
      }
  
      setApplications([...updatedApplications]);
    }
  
    if (!currentApplication) {
      setEvaluating(false);
      const passedCount = updatedApplications.filter(app => app.verdict === 'Проходит').length;
      setPassedCandidates(passedCount);
    }
  }

  const requestGithubLinks = useCallback(async () => {
    setGithubLinkRequested(true);
    for (const application of applications) {
      if (application.verdict === 'Проходит') {
        setCurrentApplication(application);
        await new Promise<void>((resolve) => {
          const handleSubmit = async () => {
            try {
              await axios.post('http://localhost:5000/check-plagiarism', {
                application,
                githubLink: currentGithubLink
              });
              resolve();
            } catch (error) {
              console.error('Error checking plagiarism:', error);
            }
          };
          setCurrentGithubLink('');
          const checkInterval = setInterval(() => {
            if (currentGithubLink) {
              clearInterval(checkInterval);
              handleSubmit();
            }
          }, 100);
        });
      }
    }
    setGithubLinkRequested(false);
    setCurrentApplication(null);
    await fetchApplications(); // Обновляем данные после проверки всех ссылок
  }, [applications, currentGithubLink]);

  function handleMentorVerdict(verdict: string) {
    setMentorVerdict(verdict);
  }

  async function submitMentorFeedback() {
    if (currentApplication && mentorVerdict) {
      setSubmitting(true);
      try {
        await axios.post('http://localhost:5000/mentor-feedback', {
          application: currentApplication,
          mentorVerdict,
          mentorExplanation
        });
  
        // Обновляем локальное состояние
        const updatedApplications = [...applications];
        const index = parseInt(currentApplication.row as string, 10) - 2;
        updatedApplications[index].verdict = mentorVerdict;
        updatedApplications[index].explanation = mentorExplanation;
        setApplications(updatedApplications);
  
        // Сбрасываем текущую заявку и продолжаем оценку
        setCurrentApplication(null);
        setMentorVerdict('');
        setMentorExplanation('');
        setSubmitting(false);
        await evaluateAllApplications();
      } catch (error) {
        console.error('Error submitting mentor feedback:', error);
        setSubmitting(false);
      }
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">nFactorial Incubator Applications</h1>
      {!evaluating && !currentApplication && passedCandidates === 0 && (
        <div className="text-center">
          <button
            onClick={evaluateAllApplications}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
          >
            Evaluate Applications
          </button>
        </div>
      )}
      {evaluating && !currentApplication && (
        <div className="mt-8">
          <p className="text-lg mb-2">Evaluating application {currentIndex + 1} of {applications.length}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${((currentIndex + 1) / applications.length) * 100}%`}}></div>
          </div>
        </div>
      )}
      {!evaluating && passedCandidates > 0 && !githubLinkRequested && (
        <div className="mt-8 text-center">
          <p className="text-xl mb-4">Количество прошедших кандидатов: {passedCandidates}</p>
          <button
            onClick={requestGithubLinks}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
          >
            Запросить ссылки на GitHub проекты
          </button>
        </div>
      )}
      {githubLinkRequested && currentApplication && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Введите ссылку на GitHub проект</h2>
          <p>Кандидат: {currentApplication['Профиль в Telegram']}</p>
          <input
            type="text"
            value={currentGithubLink}
            onChange={(e) => setCurrentGithubLink(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black mt-4"
            placeholder="https://github.com/username/project"
          />
          <button
            onClick={() => setCurrentGithubLink(currentGithubLink)} // Это вызовет обработку в useCallback
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
          >
            Отправить ссылку
          </button>
        </div>
      )}
      {currentApplication && !githubLinkRequested && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Application Requiring Mentor Review</h2>
          <div className="mb-6 space-y-2 text-black">
            <p><strong>Programming Skills:</strong> {currentApplication['Какое из вариантов лучше всего описывает Ваш уровень навыков программирования?']}</p>
            <p><strong>Telegram:</strong> {currentApplication['Профиль в Telegram']}</p>
            <p><strong>GitHub:</strong> {currentApplication['Ссылка на GitHub']}</p>
            <p><strong>Programming Experience:</strong> {currentApplication['Подробное описание Вашего опыта в программировании']}</p>
            <p><strong>Job:</strong> {currentApplication['Место работы (если есть)']}</p>
            <p><strong>School/Uni:</strong> {currentApplication['Университет/школа, где Вы учились/учитесь']}</p>
            <p><strong>Major:</strong> {currentApplication['Специальность в университете']}</p>
            <p><strong>Achievements:</strong> {currentApplication['Ваши самые впечатляющие достижения (в программировании, учебе, спорте и пр.)']}</p>
          </div>
          <div className="mb-6 space-x-4">
            <button
              onClick={() => handleMentorVerdict('Проходит')}
              className={`px-6 py-2 rounded-full transition duration-300 ease-in-out ${mentorVerdict === 'Проходит' ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-green-500 hover:text-white'}`}
            >
              Проходит
            </button>
            <button
              onClick={() => handleMentorVerdict('Не проходит')}
              className={`px-6 py-2 rounded-full transition duration-300 ease-in-out ${mentorVerdict === 'Не проходит' ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-red-500 hover:text-white'}`}
            >
              Не проходит
            </button>
          </div>
          <textarea
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            rows={4}
            placeholder="Объяснение решения"
            value={mentorExplanation}
            onChange={(e) => setMentorExplanation(e.target.value)}
          ></textarea>
          <button
            onClick={submitMentorFeedback}
            disabled={!mentorVerdict || !mentorExplanation || submitting}
            className={`mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out ${(!mentorVerdict || !mentorExplanation || submitting) ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </main>
  );
}