'use client';
import React, { useState, useEffect } from 'react';
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
        row: index + 2, // +2 because Google Sheets starts at 1 and we have a header row
      });
      return response.data;
    } catch (error) {
      console.error('Error evaluating application:', error);
      return { verdict: 'Error', explanation: 'Failed to evaluate' };
    }
  }

  async function evaluateAllApplications(): Promise<void> {
    setEvaluating(true);
    const updatedApplications = [...applications];
    for (let i = 0; i < updatedApplications.length; i++) {
      const result = await evaluateApplication(updatedApplications[i], i);
      updatedApplications[i].verdict = result.verdict;
      updatedApplications[i].explanation = result.explanation;
      setApplications([...updatedApplications]);
    }
    setEvaluating(false);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">nFactorial Incubator Applications</h1>
      <button
        onClick={evaluateAllApplications}
        disabled={evaluating}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {evaluating ? 'Evaluating...' : 'Evaluate All Applications'}
      </button>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Навыки программирования</th>
            <th className="border border-gray-300 p-2">Telegram</th>
            <th className="border border-gray-300 p-2">GitHub</th>
            <th className="border border-gray-300 p-2">Опыт в программировании</th>
            <th className="border border-gray-300 p-2">Verdict</th>
            <th className="border border-gray-300 p-2">Explanation</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app, index) => (
            <tr key={index}>
              <td className="border border-gray-300 p-2">{app['Какое из вариантов лучше всего описывает Ваш уровень навыков программирования?']}</td>
              <td className="border border-gray-300 p-2">{app['Профиль в Telegram']}</td>
              <td className="border border-gray-300 p-2">{app['Ссылка на GitHub']}</td>
              <td className="border border-gray-300 p-2">{app['Подробное описание Вашего опыта в программировании']}</td>
              <td className="border border-gray-300 p-2">{app.verdict || 'Not evaluated'}</td>
              <td className="border border-gray-300 p-2">{app.explanation || 'No explanation'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}