import React, { useState, useEffect } from 'react';
import type { FormState } from '../types';
import { MagicWandIcon } from './icons';

interface VisualizePostFormProps {
  onSubmit: (formState: FormState) => void;
  isLoading: boolean;
  initialText?: string;
}

const VisualizePostForm: React.FC<VisualizePostFormProps> = ({ onSubmit, isLoading, initialText = '' }) => {
  const [blogText, setBlogText] = useState<string>(initialText);
  const [numParagraphs, setNumParagraphs] = useState<number>(3);
  const [blogName, setBlogName] = useState<string>('');
  const [imageSource, setImageSource] = useState<'generate' | 'upload'>('generate');

  useEffect(() => {
    setBlogText(initialText);
  }, [initialText]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogText.trim() || numParagraphs <= 0) {
      alert('텍스트를 입력하고 유효한 단락 수를 지정해 주세요.');
      return;
    }
    onSubmit({ blogText, numParagraphs, blogName, imageSource });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
       <div>
        <label htmlFor="blog-name" className="block text-sm font-medium text-gray-300 mb-2">
          내 블로그명 / 업체명 (선택 사항)
        </label>
        <input
          type="text"
          id="blog-name"
          value={blogName}
          onChange={(e) => setBlogName(e.target.value)}
          placeholder="예: 제주의 맛, 희망 컴퓨터"
          className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm p-3 text-gray-200 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
          disabled={isLoading}
        />
         <p className="text-xs text-gray-500 mt-2">입력 시 AI가 생성하는 글에 자연스럽게 포함됩니다.</p>
      </div>

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="num-paragraphs" className="block text-sm font-medium text-gray-300 mb-2">
            단락 및 이미지 수
          </label>
          <input
            type="number"
            id="num-paragraphs"
            value={numParagraphs}
            onChange={(e) => setNumParagraphs(Number(e.target.value))}
            min="1"
            max="10"
            className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm p-3 text-gray-200 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
            disabled={isLoading}
          />
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-300 mb-2">
            이미지 소스
          </label>
          <div className="flex gap-4 items-center h-full">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="imageSource" 
                value="generate"
                checked={imageSource === 'generate'} 
                onChange={() => setImageSource('generate')}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-500 focus:ring-purple-500"
                disabled={isLoading}
              />
              <span className="text-gray-200">AI로 이미지 생성</span>
            </label>
             <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="imageSource" 
                value="upload"
                checked={imageSource === 'upload'} 
                onChange={() => setImageSource('upload')}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-500 focus:ring-purple-500"
                disabled={isLoading}
              />
              <span className="text-gray-200">내 이미지 사용</span>
            </label>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !blogText}
          className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
        >
          <MagicWandIcon className="w-5 h-5" />
          {isLoading ? '준비 중...' : '시각화하기'}
        </button>
      </div>
    </form>
  );
};

export default VisualizePostForm;
