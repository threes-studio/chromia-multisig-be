import { MultiSigAccount } from '@core/index';

export const checkIfSignerChanges = (currentAccount: MultiSigAccount, updateAccount: MultiSigAccount) => {
  if (currentAccount.signaturesRequired !== updateAccount.signaturesRequired) {
    return true;
  }

  if (currentAccount.signers.length !== updateAccount.signers.length) {
    return true;
  }

  const currentSigners = currentAccount.signers.map(signer => signer.pubKey);
  const updateSigners = updateAccount.signers.map(signer => signer.pubKey);

  return currentSigners.some(signer => !updateSigners.includes(signer));
}
