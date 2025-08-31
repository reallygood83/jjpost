import React, { useState } from 'react';
import type { Result } from '../types';
import { LightBulbIcon, ClipboardIcon, CheckIcon, DownloadIcon } from './icons';

interface ResultsDisplayProps {
  results: Result[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyParagraph = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch (err) {
      console.error('텍스트 복사 실패:', err);
      alert('클립보드에 텍스트를 복사하지 못했습니다.');
    }
  };
  
  const getPromptText = (result: Result) => {
    if (result.editStatus === 'done' && result.originalImageUrl) {
        return result.editPrompt ? `AI 수정: ${result.editPrompt}` : '업로드한 원본 이미지';
    }
    return result.prompt;
  };

  return (
    <section>
      <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
        생성된 콘텐츠
      </h2>
       <p className="text-center text-gray-400 mb-10 max-w-3xl mx-auto">
        각 단락과 이미지를 개별적으로 복사하고 다운로드하여 네이버 블로그 편집기에 쉽게 붙여넣을 수 있습니다.
      </p>
      <div className="space-y-12">
        {results.filter(r => r.editStatus === 'done' && r.imageUrl).map((result, index) => (
          <div
            key={index}
            className={`relative flex flex-col md:flex-row gap-8 items-center bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700 overflow-hidden ${
              index % 2 !== 0 ? 'md:flex-row-reverse' : ''
            }`}
          >
            <div className="md:w-1/2 w-full flex-shrink-0 relative group">
              <img
                src={result.imageUrl}
                alt={result.prompt}
                className="w-full h-auto object-cover rounded-lg shadow-md aspect-video"
              />
              <a
                href={result.imageUrl}
                download={`blog_image_${index + 1}.jpeg`}
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="이미지 다운로드"
                title="이미지 다운로드"
              >
                <DownloadIcon className="w-12 h-12 text-white" />
              </a>
            </div>
            <div className="md:w-1/2 w-full flex flex-col self-stretch">
                <div className="flex items-start gap-3 bg-gray-900/50 p-3 rounded-md border border-gray-600 mb-4">
                    <LightBulbIcon className="w-5 h-5 text-yellow-300 mt-1 flex-shrink-0" />
                    <p className="text-sm text-gray-400 italic">
                        <strong>정보:</strong> {getPromptText(result)}
                    </p>
                </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-4 flex-grow">
                {result.paragraph}
              </p>
               <button
                  onClick={() => handleCopyParagraph(result.paragraph, index)}
                  className="mt-auto ml-auto inline-flex items-center gap-2 px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-800 transition-colors"
                  aria-label="단락 복사"
                >
                  {copiedIndex === index ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-green-400" />
                      복사 완료!
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-4 h-4" />
                      단락 복사
                    </>
                  )}
                </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ResultsDisplay;
