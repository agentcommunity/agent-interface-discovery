'use client';

import React from 'react';
import useWindowSize from 'react-use/lib/useWindowSize';
import Confetti from 'react-confetti';
import {
  CheckCircle2,
  Globe,
  Key,
  Tag,
  Info,
  Link as LinkIcon,
  Server,
  BookOpen,
  Calendar,
  Shield,
} from 'lucide-react';
import { type DiscoveryResult } from '@/hooks/use-discovery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isOk } from '@/lib/types/result';
import { ConnectSnippet } from './connect-snippet';

interface DetailRowProps {
  Icon: React.ElementType;
  label: string;
  value: string | number | undefined;
  isCode?: boolean;
  isLink?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ Icon, label, value, isCode, isLink }) => {
  if (!value) return null;

  let detail: React.ReactNode = <p className="text-sm text-muted-foreground">{value}</p>;
  if (isCode) {
    detail = (
      <code className="text-xs text-muted-foreground bg-background border rounded px-1 py-0.5">
        {value}
      </code>
    );
  } else if (isLink) {
    detail = (
      <a
        href={String(value)}
        target="_blank"
        rel="noreferrer"
        className="text-sm underline break-all"
      >
        {value}
      </a>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {detail}
      </div>
    </div>
  );
};

export const DiscoverySuccessBlock: React.FC<{ result: DiscoveryResult }> = ({ result }) => {
  const { width, height } = useWindowSize();

  if (!isOk(result)) {
    return null;
  }

  const { record, metadata } = result.value;
  type MaybeRecordExtras = { docs?: string; dep?: string; pka?: string; kid?: string };
  const extras = record as unknown as MaybeRecordExtras;
  const docs = extras.docs;
  const dep = extras.dep;
  const pka = extras.pka;
  const kid = extras.kid;

  return (
    <>
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={300}
        gravity={0.1}
        initialVelocityY={-10}
        className="!fixed"
      />
      <Card className="border-green-300 bg-green-50/50 my-4 animate-fade-in shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 />
            <span>AID Success: Agent Discovered!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailRow Icon={Info} label="Description" value={record.desc} />
          <DetailRow Icon={LinkIcon} label="URI" value={record.uri} isCode />
          <DetailRow Icon={Server} label="Host" value={`${record.host}:${record.port}`} isCode />
          <DetailRow Icon={Tag} label="Protocol" value={record.protocol} isCode />
          <DetailRow Icon={Key} label="Authentication" value={record.auth} isCode />
          <DetailRow Icon={BookOpen} label="Documentation" value={docs} isLink />
          <DetailRow Icon={Calendar} label="Deprecation" value={dep} />
          <DetailRow Icon={Shield} label="PKA" value={pka} isCode />
          <DetailRow Icon={Shield} label="Key ID" value={kid} isCode />
          <hr className="my-2 border-green-200" />
          <ConnectSnippet domain={metadata.dnsQuery.replace(/^_agent\./, '')} />
          <hr className="my-2 border-green-200" />
          <DetailRow Icon={Globe} label="DNS Query" value={metadata?.dnsQuery} isCode />
          <DetailRow Icon={Key} label="Full TXT Record" value={metadata?.txtRecord} isCode />
        </CardContent>
      </Card>
    </>
  );
};
