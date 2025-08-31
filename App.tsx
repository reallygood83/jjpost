import React, { useState, useCallback, useEffect } from 'react';
import type { FormState, Result, NaverBlogItem } from './types';
import {
  splitTextIntoParagraphs,
  createImagePrompt,
  generateImage,
  generateSeoTopics,
  generateBlogPost
} from './services/geminiService';
import { searchNaverBlogs } from './services/naverService';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import SeoTopicGenerator from './components/SeoTopicGenerator';
import { MagicWandIcon } from './components/icons';

// Define the steps of the application flow
type AppStep = 'GENERATE_TOPIC' | 'VISUALIZE_POST' | 'VIEW_RESULTS';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('GENERATE_TOPIC');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [topicIdeas, setTopicIdeas] = useState<string[]>([]);
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [results, setResults] = useState<Result[]>([]);
  const [naverSearchResults, setNaverSearchResults] = useState<NaverBlogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [naverWarning, setNaverWarning] = useState<string | null>(null);
  
  // State for Naver API keys, initialized from localStorage
  const [naverClientId, setNaverClientId] = useState<string>(() => localStorage.getItem('naverClientId') || '');
  const [naverClientSecret, setNaverClientSecret] = useState<string>(() => localStorage.getItem('naverClientSecret') || '');

  const handleSaveApiKeys = (clientId: string, clientSecret: string) => {
    localStorage.setItem('naverClientId', clientId);
    localStorage.setItem('naverClientSecret', clientSecret);
    setNaverClientId(clientId);
    setNaverClientSecret(clientSecret);
  };

  const handleError = (err: unknown, messagePrefix: string) => {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(`${messagePrefix}. 세부 정보: ${errorMessage}`);
      setIsLoading(false);
      setLoadingMessage('');
  };

  const handleAnalyzeNaver = useCallback(async (mainKeyword: string) => {
    setIsLoading(true);
    setLoadingMessage('네이버에서 실시간 순위를 분석하는 중...');
    setError(null);
    setNaverWarning(null);
    setTopicIdeas([]);
    setNaverSearchResults([]);

    // If API keys aren't provided, show a warning and generate topics without Naver data.
    if (!naverClientId || !naverClientSecret) {
      setNaverWarning('네이버 API 키가 없습니다. 실시간 데이터 없이 주제를 추천합니다.');
      setIsLoading(false);
      return;
    }
    
    try {
      const naverBlogs = await searchNaverBlogs(mainKeyword, naverClientId, naverClientSecret);
      setNaverSearchResults(naverBlogs);
    } catch (naverError) {
      console.warn("Naver API call failed:", naverError);
      setNaverWarning('네이버 API 연동에 실패했습니다. API 키 또는 프록시 설정을 확인하세요.');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [naverClientId, naverClientSecret]);


  // Step 1b: Generate SEO topic ideas
  const handleGenerateTopics = useCallback(async (mainKeyword: string, additionalKeywords: string) => {
    setIsLoading(true);
    setLoadingMessage('AI가 분석 결과를 바탕으로 블로그 주제를 생성하는 중...');
    setError(null);
    setTopicIdeas([]);

    try {
      const topics = await generateSeoTopics(mainKeyword, additionalKeywords, naverSearchResults);
      if (!topics || topics.length === 0) {
        throw new Error("모델이 주제를 반환하지 않았습니다.");
      }
      setTopicIdeas(topics);
    } catch (err) {
      handleError(err, '주제 생성에 실패했습니다');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [naverSearchResults]);

  // Step 2: Generate a blog post from a selected topic
  const handleTopicSelected = useCallback(async (topic: string) => {
    setIsLoading(true);
    setLoadingMessage(`"${topic}" 주제로 블로그 글을 작성하는 중...`);
    setError(null);
    setTopicIdeas([]); // Clear topics to hide the selection UI

    try {
      const postContent = await generateBlogPost(topic);
      setGeneratedPost(postContent);
      setStep('VISUALIZE_POST'); // Move to the next step
    } catch (err) {
      handleError(err, '블로그 글 생성에 실패했습니다');
      setStep('GENERATE_TOPIC'); // Go back to topic generation on error
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  // Step 3: Visualize the post (the original app's functionality)
  const handleVisualizeSubmit = useCallback(async (formState: FormState) => {
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      setLoadingMessage(`블로그 포스트를 분석하여 ${formState.numParagraphs}개의 단락으로 나누는 중...`);
      const paragraphs = await splitTextIntoParagraphs(formState.blogText, formState.numParagraphs);

      if (!paragraphs || paragraphs.length === 0) {
        throw new Error("텍스트를 단락으로 나누지 못했습니다. 모델이 빈 결과를 반환했습니다.");
      }

      setStep('VIEW_RESULTS'); // Move to results view immediately to show progress
      const newResults: Result[] = [];
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        setLoadingMessage(`[${i + 1}/${paragraphs.length}] 이미지 프롬프트 생성 중...`);
        const prompt = await createImagePrompt(paragraph);
        setLoadingMessage(`[${i + 1}/${paragraphs.length}] 이미지 생성 중...`);
        const imageUrl = await generateImage(prompt);
        const result: Result = { paragraph, prompt, imageUrl };
        newResults.push(result);
        setResults([...newResults]);
      }
    } catch (err) {
      handleError(err, '콘텐츠 시각화에 실패했습니다');
      setStep('VISUALIZE_POST'); // Go back to editing on error
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);
  
  const handleReset = () => {
    setStep('GENERATE_TOPIC');
    setTopicIdeas([]);
    setGeneratedPost('');
    setResults([]);
    setError(null);
    setNaverWarning(null);
    setNaverSearchResults([]);
  };

  const renderStepContent = () => {
    switch(step) {
      case 'GENERATE_TOPIC':
        return (
          <div className="bg-gray-800/50 rounded-xl shadow-2xl p-6 mb-12 backdrop-blur-sm border border-gray-700">
            <SeoTopicGenerator
              onAnalyzeNaver={handleAnalyzeNaver}
              onGenerateTopics={handleGenerateTopics}
              onTopicSelected={handleTopicSelected}
              isLoading={isLoading}
              topicIdeas={topicIdeas}
              naverSearchResults={naverSearchResults}
              onSaveApiKeys={handleSaveApiKeys}
              initialApiClientId={naverClientId}
              initialApiClientSecret={naverClientSecret}
            />
          </div>
        );
      case 'VISUALIZE_POST':
        return (
          <div className="bg-gray-800/50 rounded-xl shadow-2xl p-6 mb-12 backdrop-blur-sm border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-2">글 시각화하기</h2>
            <p className="text-center text-gray-400 mb-6">생성된 블로그 글을 확인하고 이미지를 생성할 단락 수를 선택하세요.</p>
            <InputForm
              onSubmit={handleVisualizeSubmit}
              isLoading={isLoading}
              initialText={generatedPost}
            />
          </div>
        );
      case 'VIEW_RESULTS':
         // Render loader inside results only during the image generation phase
         if (isLoading) return <Loader message={loadingMessage} />;
         return <ResultsDisplay results={results} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-2">
             <MagicWandIcon className="w-10 h-10 text-purple-400" />
             <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                AI 블로그 포스트 어시스턴트
            </h1>
          </div>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            키워드 분석, SEO 최적화된 글 작성, 그리고 글에 맞는 이미지 생성까지 한번에 해결하세요.
          </p>
        </header>

        <main>
           {step !== 'GENERATE_TOPIC' && (
             <div className="flex justify-center mb-6">
                 <button onClick={handleReset} className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                     &larr; 처음부터 다시 시작하기
                 </button>
             </div>
          )}
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center my-4" role="alert">
              <strong className="font-bold">오류: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {naverWarning && (
            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg text-center my-4" role="alert">
              <strong className="font-bold">알림: </strong>
              <span className="block sm:inline">{naverWarning}</span>
            </div>
          )}

          <div className="relative">
             {/* Show loader only for topic/post generation, not for image visualization (handled in renderStepContent) */}
             {isLoading && (step === 'GENERATE_TOPIC' || step === 'VISUALIZE_POST') && <Loader message={loadingMessage} />}
             {renderStepContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;