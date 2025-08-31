import React, { useState } from 'react';
import type { NaverBlogItem } from '../types';
import { MagicWandIcon, CogIcon, ExternalLinkIcon } from './icons';
import NaverApiSettings from './NaverApiSettings';

interface SeoTopicGeneratorProps {
  onAnalyzeNaver: (mainKeyword: string) => void;
  onGenerateTopics: (mainKeyword: string, additionalKeywords: string) => void;
  onTopicSelected: (topic: string) => void;
  isLoading: boolean;
  topicIdeas: string[];
  naverSearchResults: NaverBlogItem[];
  onSaveApiKeys: (clientId: string, clientSecret: string) => void;
  initialApiClientId: string;
  initialApiClientSecret: string;
}

const SeoTopicGenerator: React.FC<SeoTopicGeneratorProps> = ({ 
  onAnalyzeNaver,
  onGenerateTopics,
  onTopicSelected, 
  isLoading, 
  topicIdeas,
  naverSearchResults,
  onSaveApiKeys,
  initialApiClientId,
  initialApiClientSecret
}) => {
  const [mainKeyword, setMainKeyword] = useState('');
  const [additionalKeywords, setAdditionalKeywords] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainKeyword.trim()) {
      alert('메인 키워드를 입력해 주세요.');
      return;
    }
    onAnalyzeNaver(mainKeyword);
  };

  const cleanHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">1. 블로그 주제 정하기</h2>
          <p className="text-gray-400">네이버 SEO에 최적화된 블로그 주제를 추천받으세요.</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
          className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="API 설정 열기"
        >
          <CogIcon className="w-6 h-6" />
        </button>
      </div>

      {isSettingsOpen && (
        <NaverApiSettings 
          onSave={onSaveApiKeys}
          initialClientId={initialApiClientId}
          initialClientSecret={initialApiClientSecret}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      <form onSubmit={handleAnalyzeSubmit} className="space-y-6">
        <div>
          <label htmlFor="main-keyword" className="block text-sm font-medium text-gray-300 mb-2">
            메인 키워드
          </label>
          <input
            type="text"
            id="main-keyword"
            value={mainKeyword}
            onChange={(e) => setMainKeyword(e.target.value)}
            placeholder="예: 제주도 맛집"
            className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm p-3 text-gray-200 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <label htmlFor="additional-keywords" className="block text-sm font-medium text-gray-300 mb-2">
            추가 키워드 (선택 사항)
          </label>
          <input
            type="text"
            id="additional-keywords"
            value={additionalKeywords}
            onChange={(e) => setAdditionalKeywords(e.target.value)}
            placeholder="예: 가족여행, 흑돼지, 내돈내산"
            className="w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm p-3 text-gray-200 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !mainKeyword}
            className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
          >
            <MagicWandIcon className="w-5 h-5" />
            {isLoading ? '분석 중...' : '네이버 상위 포스트 분석하기'}
          </button>
        </div>
      </form>
      
      {naverSearchResults.length > 0 && !isLoading && (
        <div className="mt-8 pt-6 border-t border-gray-700">
           <h3 className="text-xl font-semibold text-center mb-4 text-gray-200">
              '{mainKeyword}' 관련 현재 상위 노출 블로그
            </h3>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600 space-y-3 mb-6">
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    {naverSearchResults.map((result, index) => (
                        <li key={index}>
                           <a 
                             href={result.link} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                           >
                               <span>{cleanHtml(result.title)}</span>
                               <ExternalLinkIcon className="w-4 h-4" />
                           </a>
                        </li>
                    ))}
                </ol>
            </div>
             <div className="flex justify-center">
              <button
                onClick={() => onGenerateTopics(mainKeyword, additionalKeywords)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
              >
                 <MagicWandIcon className="w-5 h-5" />
                 분석 결과로 주제 추천받기
              </button>
            </div>
        </div>
      )}

      {topicIdeas.length > 0 && !isLoading && (
        <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-xl font-semibold text-center mb-2 text-gray-200">AI 추천 블로그 주제</h3>
            <p className="text-center text-gray-400 mb-6">마음에 드는 주제를 선택하여 블로그 글을 생성하세요.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topicIdeas.map((topic, index) => (
                    <button
                        key={index}
                        onClick={() => onTopicSelected(topic)}
                        className="text-left p-4 bg-gray-900 hover:bg-purple-800/50 border border-gray-600 hover:border-purple-500 rounded-lg transition-all duration-200 h-full flex flex-col group"
                    >
                         <div className="flex-grow">
                             <p className="font-semibold text-purple-400 group-hover:text-purple-300 mb-2">추천 주제 {index + 1}</p>
                             <p className="text-gray-300 group-hover:text-white">{topic}</p>
                         </div>
                    </button>
                ))}
            </div>
        </div>
      )}
    </>
  );
};

export default SeoTopicGenerator;