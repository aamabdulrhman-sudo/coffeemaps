'use client';

import { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/components/language-provider';

interface AiSummaryCardProps {
  shopId: string;
  initialSummary?: string | null;
}

export function AiSummaryCard({ shopId, initialSummary }: AiSummaryCardProps) {
  const { t } = useI18n();
  const [summary, setSummary] = useState(initialSummary ?? '');
  const [loading, setLoading] = useState(false);

  async function refreshSummary() {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/summary`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.shopAiFailed);
      setSummary(data.aiSummary);
      toast.success(t.shopAiRefreshed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.shopAiFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-coffee-200 bg-gradient-to-br from-coffee-50/80 to-background dark:border-coffee-900 dark:from-coffee-950/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          {t.shopAiSummary}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshSummary}
          disabled={loading}
          className="h-8 gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t.shopAiRefresh}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{summary || t.shopAiEmpty}</p>
      </CardContent>
    </Card>
  );
}
