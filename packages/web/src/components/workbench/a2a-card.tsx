import React from 'react';
import { ExternalLink, Shield, User, Code } from 'lucide-react';
import type { AgentCard } from '@/hooks/use-connection';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface A2ACardViewProps {
  card: AgentCard;
}

/**
 * Component to display A2A Agent Card information
 */
export function A2ACardView({ card }: A2ACardViewProps) {
  return (
    <div className="mt-3 space-y-3">
      {/* Card Header */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-1">{card.name}</h3>
            {card.description && <p className="text-sm text-blue-700 mt-1">{card.description}</p>}
            {card.provider && (
              <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                <User className="w-3 h-3" />
                <span>
                  {card.provider.organization}
                  {card.provider.url && (
                    <a
                      href={card.provider.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </span>
              </div>
            )}
          </div>
          {card.url && (
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 flex-shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              View Agent
            </a>
          )}
        </div>
      </div>

      {/* Skills Section */}
      {card.skills && card.skills.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full">
            <Code className="w-4 h-4" />
            <span>Skills ({card.skills.length})</span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {card.skills.map((skill) => (
              <div
                key={skill.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                <div className="font-medium text-gray-900">{skill.name}</div>
                {skill.description && (
                  <div className="text-xs text-gray-600 mt-1">{skill.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-1 font-mono">ID: {skill.id}</div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Authentication Requirements */}
      {card.authentication && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-800 mb-1">Authentication Required</div>
              {card.authentication.schemes.length > 0 && (
                <div className="text-xs text-amber-700">
                  <div className="font-medium mb-1">Supported schemes:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {card.authentication.schemes.map((scheme, i) => (
                      <li key={i} className="font-mono">
                        {scheme}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {card.authentication.credentials && (
                <div className="text-xs text-amber-700 mt-2">
                  <div className="font-medium">Credentials:</div>
                  <div className="font-mono break-words">{card.authentication.credentials}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
