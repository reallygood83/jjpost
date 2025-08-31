import React, { useState } from 'react';
import { InfoCircleIcon } from './icons';

interface NaverApiSettingsProps {
    onSave: (clientId: string, clientSecret: string) => void;
    initialClientId: string;
    initialClientSecret: string;
    onClose: () => void;
}

const NaverApiSettings: React.FC<NaverApiSettingsProps> = ({ onSave, initialClientId, initialClientSecret, onClose }) => {
    const [clientId, setClientId] = useState(initialClientId);
    const [clientSecret, setClientSecret] = useState(initialClientSecret);
    const [saved, setSaved] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(clientId, clientSecret);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 2000);
    };

    return (
        <div className="p-4 mb-6 bg-gray-900/70 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Naver API 설정</h3>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label htmlFor="naver-client-id" className="block text-sm font-medium text-gray-300 mb-1">
                        Client ID
                    </label>
                    <input
                        type="text"
                        id="naver-client-id"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm p-2 text-gray-200 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="네이버 Client ID를 입력하세요"
                    />
                </div>
                <div>
                    <label htmlFor="naver-client-secret" className="block text-sm font-medium text-gray-300 mb-1">
                        Client Secret
                    </label>
                    <input
                        type="password"
                        id="naver-client-secret"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm p-2 text-gray-200 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="네이버 Client Secret을 입력하세요"
                    />
                </div>

                <div className="flex items-start p-3 bg-blue-900/50 border border-blue-700 text-blue-200 text-sm rounded-md">
                    <InfoCircleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                        <p>
                           API 키는 브라우저의 로컬 스토리지에 저장되며 외부로 전송되지 않습니다.
                        </p>
                         <p className="mt-2 font-semibold">
                           참고: 이 앱은 CORS 문제를 해결하기 위해 공개 프록시(cors-anywhere)를 사용합니다. 처음 사용 시 프록시 서버에 방문하여 임시 접근 권한을 활성화해야 할 수 있습니다. 
                           <a href="https://cors-anywhere.herokuapp.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">여기</a>
                           를 클릭하여 프록시 사이트를 방문하고 "Request temporary access..." 버튼을 누르세요.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                     <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 transition-colors">
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={!clientId || !clientSecret}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {saved ? '저장 완료!' : '설정 저장'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NaverApiSettings;
