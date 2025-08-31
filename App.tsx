
import React, { useState, useCallback } from 'react';
import type { FormState, Result, NaverBlogItem, ImageEditStatus } from './types';
import {
  splitTextIntoParagraphs,
  createImagePrompt,
  generateImage,
  generateSeoTopics,
  generateBlogPost,
  editImage,
  translateToEnglish,
} from './services/geminiService';
import { searchNaverBlogs } from './services/naverService';
import VisualizePostForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import SeoTopicGenerator from './components/SeoTopicGenerator';
import ImageCustomization from './components/ImageCustomization';
import { MagicWandIcon } from './components/icons';

// Define the steps of the application flow
type AppStep = 'GENERATE_TOPIC' | 'VISUALIZE_POST' | 'CUSTOMIZE_IMAGES' | 'VIEW_RESULTS';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('GENERATE_TOPIC');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [topicIdeas, setTopicIdeas] = useState<string[]>([]);
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [blogName, setBlogName] = useState<string>('');
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

  const handleTopicSelected = useCallback(async (topic: string) => {
    setIsLoading(true);
    setLoadingMessage(`"${topic}" 주제로 블로그 글을 작성하는 중...`);
    setError(null);
    setTopicIdeas([]);

    try {
      // Note: We don't have blogName yet, it will be entered in the next step.
      // We will pass it to the final content generation, but for now the post is generic.
      const postContent = await generateBlogPost(topic, ''); // Generate post without blog name for now
      setGeneratedPost(postContent);
      setStep('VISUALIZE_POST');
    } catch (err) {
      handleError(err, '블로그 글 생성에 실패했습니다');
      setStep('GENERATE_TOPIC');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleVisualizationSetup = useCallback(async (formState: FormState) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setBlogName(formState.blogName); // Save blog name from the form

    try {
      let finalBlogText = formState.blogText;
      // If a blog name is provided, regenerate the post with the name included.
      if (formState.blogName) {
         setLoadingMessage(`'${formState.blogName}'을(를) 포함하여 글을 다시 생성하는 중...`);
         const selectedTopic = "Previously Selected Topic"; // This is a limitation, we don't have the topic here.
                                                           // A better approach would be to regenerate based on the text body.
                                                           // For now, we'll assume the text is what we want to personalize.
         // A simple string replacement is brittle. Let's ask the AI to re-process it.
         const updatedPostContent = await generateBlogPost(finalBlogText, formState.blogName); // Re-run with name
         finalBlogText = updatedPostContent;
         setGeneratedPost(finalBlogText); // Update state with the new post
      }
        
      setLoadingMessage(`블로그 포스트를 ${formState.numParagraphs}개의 단락으로 나누는 중...`);
      const paragraphs = await splitTextIntoParagraphs(finalBlogText, formState.numParagraphs);
      if (!paragraphs || paragraphs.length === 0) {
        throw new Error("텍스트를 단락으로 나누지 못했습니다.");
      }
      
      const initialResults: Result[] = paragraphs.map(p => ({
        paragraph: p,
        prompt: '',
        imageUrl: '',
        editStatus: 'pending'
      }));
      setResults(initialResults);

      if (formState.imageSource === 'generate') {
        setStep('CUSTOMIZE_IMAGES'); 
        // We defer the actual generation to the finalize step
        // to show the user the paragraphs first.
      } else {
        setStep('CUSTOMIZE_IMAGES'); // Go to customization for uploading
      }

    } catch (err) {
      handleError(err, '시각화 준비에 실패했습니다');
      setStep('VISUALIZE_POST');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleUpdateResult = (index: number, newResult: Partial<Result>) => {
    setResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...newResult };
      return newResults;
    });
  };

  const handleTranslate = async (index: number, textToTranslate: string) => {
    if (!textToTranslate) return;
    handleUpdateResult(index, { editStatus: 'translating' });
    try {
      const translated = await translateToEnglish(textToTranslate);
      handleUpdateResult(index, { editPrompt: translated, editStatus: 'editing' });
    } catch (err) {
      console.error("Translation failed", err);
      handleError(err, `프롬프트 번역 실패`);
      handleUpdateResult(index, { editStatus: 'editing' }); // revert status
    }
  };

  const handleFinalizeImages = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
        const finalResults: Result[] = [];
        for (let i = 0; i < results.length; i++) {
            const current = results[i];
            let finalResult = { ...current };

            // Case 1: AI Generation
            if (!current.originalImageUrl && !current.uploadedImageFile) {
                setLoadingMessage(`[${i + 1}/${results.length}] 이미지 프롬프트 생성 중...`);
                const prompt = await createImagePrompt(current.paragraph);
                setLoadingMessage(`[${i + 1}/${results.length}] 이미지 생성 중...`);
                const imageUrl = await generateImage(prompt);
                finalResult = { ...finalResult, prompt, imageUrl, editStatus: 'done' };
            } 
            // Case 2: User uploaded image and wants to edit
            else if (current.editStatus === 'editing' && current.originalImageUrl && current.editPrompt && current.uploadedImageFile) {
                 setLoadingMessage(`[${i + 1}/${results.length}] AI로 이미지 수정 중...`);
                 const base64Image = current.originalImageUrl.split(',')[1];
                 const mimeType = current.uploadedImageFile.type;
                 const editedImageUrl = await editImage(base64Image, mimeType, current.editPrompt);
                 finalResult = { ...finalResult, imageUrl: editedImageUrl, prompt: `AI로 수정한 이미지: ${current.editPrompt}`, editStatus: 'done' };
            }
            // Case 3: User uploaded image and wants to use as is
            else if (current.editStatus === 'asis' && current.originalImageUrl) {
                finalResult = { ...finalResult, imageUrl: current.originalImageUrl, prompt: '업로드한 원본 이미지', editStatus: 'done' };
            }
            // Case 4: Something is not ready (should be prevented by UI)
            else if (current.editStatus !== 'done') {
                throw new Error(`${i+1}번째 항목의 이미지가 준비되지 않았습니다.`);
            }

            finalResults.push(finalResult);
            setResults([...finalResults, ...results.slice(finalResults.length)]); // Show progress
        }
        setStep('VIEW_RESULTS');
    } catch (err) {
        handleError(err, '최종 콘텐츠 생성에 실패했습니다');
        setStep('CUSTOMIZE_IMAGES');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };
  
  const handleReset = () => {
    setStep('GENERATE_TOPIC');
    setTopicIdeas([]);
    setGeneratedPost('');
    setBlogName('');
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
            <h2 className="text-2xl font-bold text-center mb-2">2. 글 시각화 준비</h2>
            <p className="text-center text-gray-400 mb-6">생성된 글을 확인하고, 개인화 옵션을 설정하세요.</p>
            <VisualizePostForm
              onSubmit={handleVisualizationSetup}
              isLoading={isLoading}
              initialText={generatedPost}
            />
          </div>
        );
      case 'CUSTOMIZE_IMAGES':
        return (
             <ImageCustomization
                results={results}
                onUpdateResult={handleUpdateResult}
                onTranslate={handleTranslate}
                onFinalize={handleFinalizeImages}
                isLoading={isLoading}
             />
        );
      case 'VIEW_RESULTS':
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
             {isLoading && (step !== 'CUSTOMIZE_IMAGES' && step !== 'VIEW_RESULTS') && <Loader message={loadingMessage} />}
             {renderStepContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
