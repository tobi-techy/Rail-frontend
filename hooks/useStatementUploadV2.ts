/**
 * useStatementUploadV2
 * Manages the V2 bank statement upload flow:
 *   idle → uploading → processing (SSE progress) → completed/failed
 *
 * Provides real-time progress via SSE streaming and supports retry.
 */

import { useCallback, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { statementV2Service } from '@/api/services/statementV2.service';
import type {
  StatementUploadResponse,
  StatementProgressEvent,
  StatementStatusResponse,
} from '@/api/services/statementV2.service';

export type UploadStage = 'idle' | 'picking' | 'uploading' | 'processing' | 'completed' | 'failed';

interface UploadState {
  stage: UploadStage;
  uploadId: string | null;
  progress: number; // 0-100
  progressMessage: string;
  error: string | null;
  result: StatementStatusResponse | null;
}

const INITIAL_STATE: UploadState = {
  stage: 'idle',
  uploadId: null,
  progress: 0,
  progressMessage: '',
  error: null,
  result: null,
};

export function useStatementUploadV2() {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const lastFileRef = useRef<{ uri: string; name: string; bankName: string } | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const startProgress = useCallback((uploadId: string) => {
    setState((s) => ({
      ...s,
      stage: 'processing',
      progress: 0,
      progressMessage: 'Starting analysis...',
    }));

    const controller = statementV2Service.streamProgress(
      uploadId,
      (event: StatementProgressEvent) => {
        setState((s) => ({
          ...s,
          progress: event.progress,
          progressMessage: event.message || event.stage,
        }));
      },
      () => {
        // SSE done — fetch final status
        statementV2Service
          .getStatus(uploadId)
          .then((res) => {
            const data = res.data;
            if (data.status === 'completed') {
              setState((s) => ({ ...s, stage: 'completed', progress: 100, result: data }));
            } else if (data.status === 'failed') {
              setState((s) => ({
                ...s,
                stage: 'failed',
                error: data.error_message || 'Processing failed',
              }));
            } else {
              // Still processing — fall back to polling
              pollUntilDone(uploadId);
            }
          })
          .catch(() => {
            pollUntilDone(uploadId);
          });
      },
      () => {
        // SSE error — fall back to polling
        pollUntilDone(uploadId);
      }
    );

    abortRef.current = controller;
  }, []);

  const pollUntilDone = useCallback((uploadId: string) => {
    let attempts = 0;
    const maxAttempts = 60;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setState((s) => ({ ...s, stage: 'failed', error: 'Processing timed out' }));
        return;
      }
      try {
        const res = await statementV2Service.getStatus(uploadId);
        const { status, error_message } = res.data;
        if (status === 'completed') {
          clearInterval(interval);
          setState((s) => ({ ...s, stage: 'completed', progress: 100, result: res.data }));
        } else if (status === 'failed') {
          clearInterval(interval);
          setState((s) => ({ ...s, stage: 'failed', error: error_message || 'Processing failed' }));
        }
      } catch {}
    }, 5000);
  }, []);

  const upload = useCallback(
    async (fileUri: string, bankName: string, fileName?: string) => {
      reset();
      const name = fileName || fileUri.split('/').pop() || 'statement.pdf';
      lastFileRef.current = { uri: fileUri, name, bankName };

      setState({ ...INITIAL_STATE, stage: 'uploading', progressMessage: 'Uploading...' });

      try {
        const res = await statementV2Service.upload(fileUri, bankName, name);
        const { upload_id } = res.data;
        setState((s) => ({ ...s, uploadId: upload_id }));
        startProgress(upload_id);
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.message || 'Upload failed';
        setState((s) => ({ ...s, stage: 'failed', error: msg }));
      }
    },
    [reset, startProgress]
  );

  const pickAndUpload = useCallback(
    async (bankName: string) => {
      setState((s) => ({ ...s, stage: 'picking' }));
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'text/csv'],
          copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets?.length) {
          setState(INITIAL_STATE);
          return;
        }
        const asset = result.assets[0];
        await upload(asset.uri, bankName, asset.name);
      } catch (err: any) {
        setState((s) => ({ ...s, stage: 'failed', error: err?.message || 'File picker failed' }));
      }
    },
    [upload]
  );

  const retry = useCallback(async () => {
    if (!lastFileRef.current) return;
    const { uri, bankName, name } = lastFileRef.current;
    await upload(uri, bankName, name);
  }, [upload]);

  return {
    ...state,
    upload,
    pickAndUpload,
    retry,
    reset,
  };
}
