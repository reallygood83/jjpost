
import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 my-12 text-center">
      <div className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-purple-500 border-t-transparent"></div>
      <p className="text-lg text-gray-300 font-medium">{message}</p>
    </div>
  );
};

export default Loader;
