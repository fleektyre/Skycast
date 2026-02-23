
import React from 'react';
import { GroundingChunk } from '../types';

interface GroundingLinksProps {
  chunks: GroundingChunk[];
}

export const GroundingLinks: React.FC<GroundingLinksProps> = ({ chunks }) => {
  if (!chunks || chunks.length === 0) return null;

  // Filter and deduplicate links
  const links = chunks
    .filter((chunk) => chunk.web && chunk.web.uri)
    .map((chunk) => chunk.web!)
    .filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

  if (links.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-white/20">
      <p className="text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Sources</p>
      <div className="flex flex-wrap gap-2">
        {links.slice(0, 3).map((link, idx) => (
          <a
            key={idx}
            href={link.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors text-white/80 flex items-center gap-1"
          >
            <span className="truncate max-w-[120px]">{link.title || 'Source'}</span>
            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
};
