
import React, { useState, useEffect } from 'react';
import type { FormState } from '../types';
import { MagicWandIcon } from './icons';

interface InputFormProps {
  onSubmit: (formState: FormState) => void;
  isLoading: boolean;
  initialText?: string;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, initialText = '' }) => {
  const [blogText, setBlogText] = useState<string>(initialText);
  const [numParagraphs, setNumParagraphs] = useState<number>(3);

  useEffect(() => {
    setBlogText(initialText);
  }, [initialText]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogText.trim() || numParagraphs <= 0) {
      alert('텍스트를 입력하고 유효한 단락 수를 지정해 주세요.');
      return;
    }
    onSubmit({ blogText, numParagraphs });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div>
        <label htmlFor="blog-text" className="block text-sm font-medium text-gray-300 mb-2">
          블로그 포스트
        </label>
        <textarea
          id="blog-text"
          value={blogText}
          onChange={(e) => setBlogText(e.target.value)}
          placeholder="블로그 포스트 전체 내용을 여기에 붙여넣으세요..."
          rows={12}
          className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm p-4 text-gray-200 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="num-paragraphs" className="block text-sm font-medium text-gray-300 mb-2">
          생성할 이미지 수 (단락 수)
        </label>
        <input
          type="number"
          id="num-paragraphs"
          value={numParagraphs}
          onChange={(e) => setNumParagraphs(Number(e.target.value))}
          min="1"
          max="10"
          className="w-full max-w-xs bg-gray-900 border border-gray-600 rounded-md shadow-sm p-3 text-gray-200 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !blogText}
          className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
        >
          <MagicWandIcon className="w-5 h-5" />
          {isLoading ? '생성 중...' : '시각화하기'}
        </button>
      </div>
    </form>
  );
};

export default InputForm;
