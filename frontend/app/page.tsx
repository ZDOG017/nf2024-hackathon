'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Application, EvaluationResult } from './types';

export default function Home() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications(): Promise<void> {
    try {
      const response = await axios.get<Application[]>('http://localhost:5000/applications');
      setApplications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setLoading(false);
    }
  }

  async function evaluateApplication(application: Application, index: number): Promise<void> {
    try {
      const response = await axios.post<EvaluationResult>('http://localhost:5000/evaluate', {
        application,
        row: index + 2, // +2 because Google Sheets starts at 1 and we have a header row
      });
      const updatedApplications = [...applications];
      updatedApplications[index].verdict = response.data.verdict;
      setApplications(updatedApplications);
    } catch (error) {
      console.error('Error evaluating application:', error);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">nFactorial Incubator Applications</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Email</th>
            <th className="border border-gray-300 p-2">Verdict</th>
            <th className="border border-gray-300 p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app, index) => (
            <tr key={index}>
              <td className="border border-gray-300 p-2">{app.name}</td>
              <td className="border border-gray-300 p-2">{app.email}</td>
              <td className="border border-gray-300 p-2">{app.verdict || 'Not evaluated'}</td>
              <td className="border border-gray-300 p-2">
                <button 
                  onClick={() => evaluateApplication(app, index)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                >
                  Evaluate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}