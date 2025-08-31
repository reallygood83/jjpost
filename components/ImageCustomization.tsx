import React from 'react';
import type { Result } from '../types';
import { MagicWandIcon, LanguageIcon } from './icons';

interface ImageCustomizationProps {
    results: Result[];
    onUpdateResult: (index: number, newResult: Partial<Result>) => void;
    onTranslate: (index: number, text: string) => void;
    onFinalize: () => void;
    isLoading: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const ImageCustomization: React.FC<ImageCustomizationProps> = ({ results, onUpdateResult, onTranslate, onFinalize, isLoading }) => {
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                onUpdateResult(index, {
                    uploadedImageFile: file,
                    originalImageUrl: base64,
                    imageUrl: base64, // Show preview
                    editStatus: 'uploaded'
                });
            } catch (error) {
                console.error("Error converting file to base64", error);
                onUpdateResult(index, { editStatus: 'error' });
            }
        }
    };
    
    const isReadyToFinalize = results.every(r => 
      !r.uploadedImageFile || // This is for 'generate' mode
      r.editStatus === 'asis' || 
      (r.editStatus === 'editing' && !!r.editPrompt)
    );

    const isUploadingMode = results.some(r => r.uploadedImageFile !== undefined || r.originalImageUrl !== undefined);


    return (
        <div className="bg-gray-800/50 rounded-xl shadow-2xl p-6 mb-12 backdrop-blur-sm border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-2">3. 이미지 설정하기</h2>
            <p className="text-center text-gray-400 mb-8">{isUploadingMode ? "각 단락에 사용할 이미지를 업로드하고 수정 옵션을 선택하세요." : "각 단락에 어울리는 이미지를 AI가 생성합니다."}</p>

            <div className="space-y-8">
                {results.map((result, index) => (
                    <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-gray-300 leading-relaxed mb-4 p-3 bg-black/20 rounded-md">
                            <strong className="text-purple-400">단락 {index + 1}:</strong> {result.paragraph}
                        </p>
                        
                        {isUploadingMode ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <div>
                                    {result.originalImageUrl ? (
                                        <img src={result.originalImageUrl} alt="Uploaded preview" className="rounded-lg max-h-48 w-auto mx-auto"/>
                                    ) : (
                                        <div className="flex items-center justify-center h-48 bg-gray-700/50 rounded-lg">
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg, image/webp"
                                                onChange={(e) => handleFileChange(e, index)}
                                                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                {result.editStatus !== 'pending' && result.editStatus !== 'error' && (
                                     <div>
                                         <div className="flex gap-4 mb-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input type="radio" name={`edit-option-${index}`} value="asis" checked={result.editStatus === 'asis'} onChange={() => onUpdateResult(index, { editStatus: 'asis' })} className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-500" />
                                              <span>원본 그대로 사용</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input type="radio" name={`edit-option-${index}`} value="editing" checked={result.editStatus === 'editing'} onChange={() => onUpdateResult(index, { editStatus: 'editing' })} className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-500" />
                                              <span>AI로 수정하기</span>
                                            </label>
                                         </div>
                                         {/* FIX: Show this block when editing or translating to prevent UI flicker and fix type errors. */}
                                         {(result.editStatus === 'editing' || result.editStatus === 'translating') && (
                                             <div className="space-y-2">
                                                 <textarea
                                                    value={result.editPrompt || ''}
                                                    onChange={(e) => onUpdateResult(index, { editPrompt: e.target.value })}
                                                    placeholder="수정할 내용을 한글로 입력하세요. (예: 하늘을 더 파랗게 만들어줘)"
                                                    rows={3}
                                                    className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-purple-500 focus:border-purple-500"
                                                    disabled={result.editStatus === 'translating'}
                                                 />
                                                 <button
                                                    onClick={() => onTranslate(index, result.editPrompt || '')}
                                                    disabled={!result.editPrompt || result.editStatus === 'translating'}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-600 text-xs font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                                                 >
                                                    <LanguageIcon className="w-4 h-4"/>
                                                    {result.editStatus === 'translating' ? '번역 중...' : '영어로 번역'}
                                                 </button>
                                             </div>
                                         )}
                                     </div>
                                )}
                             </div>
                        ) : (
                            <div className="text-center text-gray-400 p-4 bg-gray-700/50 rounded-lg">
                                AI가 위 단락 내용에 맞춰 이미지를 생성할 예정입니다.
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={onFinalize}
                    disabled={isLoading || (isUploadingMode && !isReadyToFinalize)}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                >
                    <MagicWandIcon className="w-5 h-5" />
                    {isLoading ? '생성 중...' : '최종 콘텐츠 생성'}
                </button>
            </div>
        </div>
    );
};

export default ImageCustomization;