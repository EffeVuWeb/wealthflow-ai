import React, { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  return (
    <div className="group relative inline-flex items-center">
      {children}
      <div 
        className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white opacity-0 transition-all duration-200 group-hover:opacity-100 pointer-events-none border border-slate-700 shadow-xl z-50`}
      >
        {content}
        {/* Little triangle arrow */}
        <div 
            className={`absolute left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-r border-b border-slate-700 bg-slate-900 ${position === 'top' ? 'bottom-[-5px] border-l-0 border-t-0' : 'top-[-5px] border-r-0 border-b-0 border-l border-t'}`}
        ></div>
      </div>
    </div>
  );
};

export default Tooltip;