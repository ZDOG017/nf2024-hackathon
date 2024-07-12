'use client';
import React, { useState } from 'react';
import axios from 'axios';

interface SimilarRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
}

export default function SimilarReposPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [similarRepos, setSimilarRepos] = useState<SimilarRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/find-similar-repos', { repoUrl });
      setSimilarRepos(response.data.similarRepos);
    } catch (error) {
      console.error('Error finding similar repositories:', error);
      setError('Failed to find similar repositories');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Find Similar GitHub Repositories</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="repoUrl" className="block mb-1">Repository URL:</label>
          <input
            type="text"
            id="repoUrl"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="input-field"
            placeholder="https://github.com/username/repo"
            required
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Find Similar Repos'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {similarRepos.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Similar Repositories:</h2>
          <ul className="space-y-4">
            {similarRepos.map((repo) => (
              <li key={repo.full_name} className="bg-gray-100 p-4 rounded">
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-semibold">
                  {repo.full_name}
                </a>
                <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
                <p className="text-sm text-gray-500 mt-1">Stars: {repo.stargazers_count}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}