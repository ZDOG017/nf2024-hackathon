'use client';
import React, { useState } from 'react';
import axios from 'axios';

export default function ComparePage() {
  const [repo1, setRepo1] = useState('');
  const [repo2, setRepo2] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/compare-repos', { repo1, repo2 });
      setResult(response.data.result);
    } catch (error) {
      console.error('Error comparing repositories:', error);
      setResult('Error occurred while comparing repositories');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Compare GitHub Repositories</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="repo1" className="block mb-1">Repository 1 URL:</label>
          <input
            type="text"
            id="repo1"
            value={repo1}
            onChange={(e) => setRepo1(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="https://github.com/username/repo1"
            required
          />
        </div>
        <div>
          <label htmlFor="repo2" className="block mb-1">Repository 2 URL:</label>
          <input
            type="text"
            id="repo2"
            value={repo2}
            onChange={(e) => setRepo2(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="https://github.com/username/repo2"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </form>
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <p className="bg-gray-100 p-4 rounded">
            {result.includes('http') ? (
              <a href={result.split(': ')[1]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View MOSS Result
              </a>
            ) : (
              result
            )}
          </p>
        </div>
      )}
    </div>
  );
}