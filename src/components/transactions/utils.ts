import { TransactionLog, TransactionLogAction } from '@core/index';

export function updateTransactionLogs(
  logs: TransactionLog[],
  pubKey: string,
  name: string,
  action: TransactionLogAction,
) {
  const existingLogIndex = logs.findIndex(
    log => log.pubKey === pubKey && log.action === action
  );

  const newLog = {
    action,
    pubKey: pubKey,
    signerName: name,
    createdAt: new Date(),
  };

  if (existingLogIndex !== -1) {
    logs[existingLogIndex] = newLog;
  } else {
    logs.push(newLog);
  }

  return logs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}