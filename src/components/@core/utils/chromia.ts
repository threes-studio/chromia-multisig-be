import {
  ACCOUNT_ID_PLACEHOLDER,
  aggregateSigners,
  Asset,
  AuthFlag,
  BLOCKCHAIN_RID_PLACEHOLDER,
  compactArray,
  createAuthDataService,
  createConnection,
  createInMemoryEvmKeyStore,
  createInMemoryFtKeyStore,
  createKeyStoreInteractor,
  createMultiSigAuthDescriptorRegistration,
  createSingleSigAuthDescriptorRegistration,
  deriveNonce,
  evmAuth,
  evmSignatures,
  ftAuth,
  NONCE_PLACEHOLDER,
  nop,
  op,
  registerAccount,
  registerAccountMessage,
  registerAccountOp,
  registrationStrategy,
  Signature,
  Strategy,
  updateMainAuthDescriptor
} from '@chromia/ft4';
import BigNumber from "bignumber.js";
import { ethers, verifyMessage } from 'ethers';
import * as pcl from "postchain-client";
import {
  createClient,
  formatter,
  gtv,
  GTX,
  gtx,
  IClient,
  Operation,
} from "postchain-client";

// Types
export type StrategiesType = "basic" | "transfer" | "fee" | "";

export interface Keypair {
  privKey: Buffer;
  pubKey: Buffer;
  accountId?: Buffer;
}

export interface IAsset {
  id: string | Buffer;
  decimals: number;
  name: string;
  symbol: string;
  rowId: number;
  total_supply: number | bigint | string;
  circulating_supply: number | bigint | string;
  icon_url: string;
}

export interface IAssetBalance {
  id: string | Buffer;
  amount: number | bigint | string;
  symbol: string;
}

// Constants
export const adminKp: Keypair = {
  privKey: Buffer.from(process.env.ADMIN_PRIVATE_KEY, "hex"),
  pubKey: Buffer.from(process.env.ADMIN_PUBLIC_KEY, "hex"),
  accountId: Buffer.from(process.env.ADMIN_ACCOUNT_ID, "hex"),
}

// Client functions
export const createChromiaClient = async () => createClient({
  nodeUrlPool: [process.env.NODE_URL],
  blockchainRid: process.env.BLOCKCHAIN_RID,
});

// Asset functions
export async function getAssetBySymbol(client: IClient, assetSymbol: string) {
  const assets: any = await client.query("ft4.get_assets_by_symbol", {
    symbol: assetSymbol,
    page_size: 10,
    page_cursor: null,
  });

  const asset = assets.data[0];
  if (!asset) {
    throw new Error("No asset found");
  }

  return asset;
}

// Account functions
export async function registerMultiSigAccountFeeFT(
  client: IClient,
  kp: { privKey: Buffer; pubKey: Buffer },
  asset: Asset
) {
  const store = createInMemoryFtKeyStore(kp);
  return await registerAccount(
    client,
    store,
    registrationStrategy.transferFee(
      asset,
      createSingleSigAuthDescriptorRegistration(["A", "T"], store.id)
    )
  );
}

export const getAccountId = (kp: Keypair) => {
  const store = createInMemoryFtKeyStore(kp);
  return gtv.gtvHash(store.id).toString("hex");
};

export const registerMultiSigAccount = async (kp: Keypair, assetSymbol: string) => {
  const client = await createChromiaClient();
  const asset = await getAssetBySymbol(client, assetSymbol);
  return await registerMultiSigAccountFeeFT(client, kp, asset);
};

// Transfer functions
export async function getPendingTransfer(accountId: Buffer) {
  const client = await createChromiaClient();
  const pendings: any = await client.query("get_pending_transfer", {
    recipient_id: accountId,
  });

  return pendings.map(item => ({
    amount: Number(item.amount),
    assetSymbol: item.asset_symbol,
  }));
}

// Auth descriptor functions
export const queryAuthDescriptor = async (accountId: string) => {
  const client = await createChromiaClient();
  return await client.query("ft4.get_account_main_auth_descriptor", { account_id: accountId });
};

// Buffer parsing utilities
export const parseBufferToString = (buffer: Buffer): string => buffer.toString('hex');

export const parseObjectBuffers = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(parseObjectBuffers);
  } else if (Buffer.isBuffer(obj)) {
    return parseBufferToString(obj);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, parseObjectBuffers(value)])
    );
  }
  return obj;
};

// Transaction functions
export const createUpdateMultiSigAuthDescriptorTx = async (
  accountId,
  authDescriptorId,
  authDescriptor,
  signers: (pcl.SignatureProvider | pcl.KeyPair)[],
) => {
  const client = await createChromiaClient();
  const descriptor = updateMainAuthDescriptor(authDescriptor);
  const adId = Buffer.from(authDescriptorId, 'hex');

  let signedTx : Buffer | pcl.Transaction = {
    operations: [ftAuth(accountId, adId), descriptor, nop()],
    signers: signers
      .map((s) => s.pubKey)
      .filter((pk): pk is Buffer => pk !== undefined),
  };

  for (const signer of signers) {
    signedTx = await client.signTransaction(signedTx, signer);
  }

  return await client.sendTransaction(signedTx);
};

export const initMultiSigAuthDescriptorTx = async (
  accountId,
  authDescriptorId,
  newAuthDescriptor,
  signers: string[],
  keypair: pcl.SignatureProvider | pcl.KeyPair,
) => {
  const client = await createChromiaClient();
  const descriptor = updateMainAuthDescriptor(newAuthDescriptor);
  const sortedSigners = signers.sort((a, b) => a.localeCompare(b));
  const adId = Buffer.from(authDescriptorId, 'hex');

  let signedTx : Buffer | pcl.Transaction = {
    operations: [ftAuth(Buffer.from(accountId, 'hex'), adId), descriptor, nop()],
    signers: [keypair.pubKey.toString('hex'), ...sortedSigners]
      .map((s) => Buffer.from(s, 'hex'))
      .filter((pk): pk is Buffer => pk !== undefined),
  };

  signedTx = await client.signTransaction(signedTx, keypair);
  const decodeTx = pcl.decodeTransactionToGtx(signedTx);

  return {
    tx: signedTx.toString('hex'),
    signature: decodeTx.signatures[0].toString('hex'),
  };
};

export const initTransferFundTx = async (
  accountId,
  authDescriptorId,
  signers: string[],
  receiverAccountId,
  amount,
  assetId,
) => {
  const client = await createChromiaClient();
  const sortedSigners = signers.sort((a, b) => a.localeCompare(b));
  const transferFundOp = op('ft4.transfer', Buffer.from(receiverAccountId, 'hex'), Buffer.from(assetId, 'hex'), BigInt(amount * 10 ** 18))
  const adId = Buffer.from(authDescriptorId, 'hex');

  let signedTx : Buffer | pcl.Transaction = {
    operations: [ftAuth(Buffer.from(accountId, 'hex'), adId), transferFundOp, nop()],
    signers: sortedSigners
      .map((s) => Buffer.from(s, 'hex'))
      .filter((pk): pk is Buffer => pk !== undefined),
  };

  signedTx = client.encodeTransaction(signedTx as pcl.Transaction);
  const decodeTx = pcl.decodeTransactionToGtx(signedTx);

  return {
    tx: signedTx.toString('hex'),
  };
};

export const updateMultiSigAuthDescriptorTx = async (
  accountId,
  authDescriptorId,
  newAuthDescriptor,
  signers: string[],
) => {
  const client = await createChromiaClient();
  const descriptor = updateMainAuthDescriptor(newAuthDescriptor);
  const sortedSigners = signers.sort((a, b) => a.localeCompare(b));
  const adId = Buffer.from(authDescriptorId, 'hex');

  let signedTx : Buffer | pcl.Transaction = {
    operations: [ftAuth(Buffer.from(accountId, 'hex'), adId), descriptor, nop()],
    signers: sortedSigners
      .map((s) => Buffer.from(s, 'hex'))
      .filter((pk): pk is Buffer => pk !== undefined),
  };

  signedTx = client.encodeTransaction(signedTx as pcl.Transaction);
  return {
    tx: signedTx.toString('hex'),
  };
};

export const mockSignTx = async (signer: pcl.SignatureProvider | pcl.KeyPair, prevSignedTx: string) => {
  const client = await createChromiaClient();
  const signedTx = await client.signTransaction(Buffer.from(prevSignedTx, 'hex'), signer);
  return signedTx.toString('hex');
};

export const executeTxUpdateDescriptor = async (signedTx: string) => {
  const client = await createChromiaClient();
  return await client.sendTransaction(Buffer.from(signedTx, 'hex'));
};

export const executeTx = async (signedTx: string) => {
  const client = await createChromiaClient();
  return await client.sendTransaction(Buffer.from(signedTx, 'hex'));
};

// Admin functions
async function getEvmSession(client: IClient, kp: Keypair) {
  const store = createInMemoryEvmKeyStore(kp);
  return await createKeyStoreInteractor(client, store).getSession(kp.accountId);
}

export const mockAdminTransferFee = async (accountId: string) => {
  const client = await createChromiaClient();
  const session = await getEvmSession(client, adminKp);
  const assetId = await getAssetBySymbol(client, "BUSC");
  
  return await session.call({
    name: "ft4.transfer",
    args: [Buffer.from(accountId, 'hex'), assetId.id, BigInt(2) * BigInt(10 ** 18)],
  });
}

export const mockAdminTransferAsset = async (accountId: string) => {
  const client = await createChromiaClient();
  const session = await getEvmSession(client, adminKp);

  const assets = await Promise.all([
    getAssetBySymbol(client, "BUSC"),
    getAssetBySymbol(client, "KT1"),
    getAssetBySymbol(client, "KT2"), 
    getAssetBySymbol(client, "KT3"),
    getAssetBySymbol(client, "COLOR")
  ]);

  for (const asset of assets) {
    await session.call({
      name: "ft4.transfer",
      args: [Buffer.from(accountId, 'hex'), asset.id, BigInt(10) * BigInt(10 ** 18)],
    });
  }
}

// Account validation
export async function isAccountExist(kp: { privKey: Buffer; pubKey: Buffer }) {
  const client = await createChromiaClient();
  const store = createInMemoryFtKeyStore(kp);
  const evmKeyStoreInteractor = createKeyStoreInteractor(client, store);
  const accounts = await evmKeyStoreInteractor.getAccounts();
  return !!accounts.length;
}

// Balance functions
export async function getListTokensBalanceOf(pubKey: string) {
  try {
    const chromiaClient = await createChromiaClient();
    
    const allTokens = (await chromiaClient.query('get_all_asset') as unknown) as IAsset[];
    const balances = (await chromiaClient.query("get_list_tokens_balance_of", {
      user: pubKey,
    }) as unknown) as IAssetBalance[];

    return balances.map(balance => {
      const token = allTokens.find(t => Buffer.isBuffer(t.id) && Buffer.isBuffer(balance.id) && t.id.equals(balance.id));
      if (!token) return null;

      const amount = new BigNumber(balance.amount.toString());
      const decimals = new BigNumber(10).pow(token.decimals);
      const price = amount.dividedBy(decimals);

      return {
        id: token.id.toString('hex'),
        symbol: token.symbol,
        name: token.name,
        amount: price.toString(),
        circulatingSupply: token.circulating_supply,
        totalSupply: token.total_supply,
        decimals: token.decimals,
        iconUrl: token.icon_url,
      };
    }).filter(Boolean);
  } catch (error) {
    console.error("Error fetching list tokens balance:", error);
    return [];
  }
}

// Auth descriptor utilities
export function getAccountIdFromAuthDescriptor(authDescriptor: any): Buffer {
  const signers = aggregateSigners(authDescriptor);
  return gtv.gtvHash(
    signers.length === 1 ? signers[0] : signers.sort(Buffer.compare),
  );
}

export async function getAccountIdFromPublicKeyPair(
  signers: string[],
  signaturesRequired: number,
): Promise<string> {
  const client = await createChromiaClient();
  const connection = await createConnection(client);
  const bufferSigners = signers.map(getEvmAddress);
  const multiAD = createMultiSigAuthDescriptorRegistration(
    [AuthFlag.Account, AuthFlag.Transfer],
    bufferSigners,
    signaturesRequired,
    null,
  );

  return getAccountIdFromAuthDescriptor(multiAD).toString('hex');
}

// Registration functions
export async function createRegisterAccountTx(
  signatures: Signature[] | string[],
  strategyType: StrategiesType = "transfer",
  feeAsset: Asset | null = null,
  registerAccountOperation: Operation = registerAccountOp()
) {
  const client = await createChromiaClient();
  const connection = await createConnection(client);

  let strategy: Strategy;
  switch(strategyType) {
    case "basic":
      strategy = registrationStrategy.open(this.multiAD);
      break;
    case "transfer":
      strategy = registrationStrategy.transferOpen(this.multiAD);
      break;
    case "fee":
      if (!feeAsset) throw new Error('Fee asset is required for fee strategy');
      strategy = registrationStrategy.transferFee(feeAsset, this.multiAD);
      break;
    default:
      throw new Error('Unknown strategy type');
  }

  const { strategyOperation } = await strategy.getRegistrationDetails(connection, this.keyStore);
  const registerMessage = await connection.query(registerAccountMessage(strategyOperation, registerAccountOperation));
  const sortedOwners = Array.from(this.ownersAddress).sort(Buffer.compare);
  const sortedSignatures = sortSignatureByAddress(signatures as Signature[], registerMessage);
  const evmSignaturesOperation = evmSignatures(sortedOwners, sortedSignatures);

  const operations = compactArray([evmSignaturesOperation, strategyOperation, registerAccountOperation, nop()]);
  const ops = operations.map(({ name, args }) => ({
    opName: name,
    args: args || [],
  }));

  const transaction: GTX = {
    blockchainRid: connection.blockchainRid,
    operations: ops,
    signers: [],
    signatures: [],
  };

  return gtx.serialize(transaction);
}

// Signature utilities
const ft4SignatureToEthersSignature = (signature: Signature): ethers.Signature => {
  return ethers.Signature.from({
    r: ethers.hexlify(signature.r),
    s: ethers.hexlify(signature.s),
    v: signature.v
  });
}

function sortSignatureByAddress(signatures: Signature[], message: string): Signature[] {
  return Array.from(signatures).sort((a, b) => {
    const signA = ft4SignatureToEthersSignature(a);
    const signB = ft4SignatureToEthersSignature(b);
    const aAddress = verifyMessage(message, signA.compactSerialized);
    const bAddress = verifyMessage(message, signB.compactSerialized);
    return Buffer.compare(Buffer.from(aAddress), Buffer.from(bAddress));
  });
}

function getEvmAddress(evmAddress: string) {
  return Buffer.from(evmAddress.slice(2), "hex");
}

// Transaction sending functions
export async function sendRegisterAccountTx(
  tx: string,
  signers: string[],
  signatures: [{
    r: string,
    s: string,
    v: number,
  }],
) {
  const client = await createChromiaClient();
  const decodeTx = Buffer.from(tx, 'hex');  
  const transaction = gtx.deserialize(decodeTx);
  const sortedSigners = signers.map(getEvmAddress);
  const sortedSignatures = signatures.map(sig => ({
    r: Buffer.from(sig.r, 'hex'),
    s: Buffer.from(sig.s, 'hex'),
    v: sig.v,
  }));

  const evmSignaturesOperation = evmSignatures(sortedSigners, sortedSignatures);
  transaction.operations[0] = {
    opName: evmSignaturesOperation.name,
    args: evmSignaturesOperation.args || [],
  };

  return await client.sendTransaction(gtx.serialize(transaction));
}

export async function sendTransferAssetTx(
  tx: string,
  signatures: [{
    r: string,
    s: string,
    v: number,
  }],
  accountId,
) {
  const client = await createChromiaClient();
  const decodeTx = Buffer.from(tx, 'hex');  
  const transaction = gtx.deserialize(decodeTx);
  const sortedSignatures = signatures.map(sig => {
    if (!sig) return null;
    return {
      r: Buffer.from(sig.r, 'hex'),
      s: Buffer.from(sig.s, 'hex'),
      v: sig.v,
    }
  });

  const multiAD: any = await queryAuthDescriptor(accountId.toString('hex'));
  const evmAuthOp = evmAuth(accountId, multiAD.id, sortedSignatures);

  transaction.operations[0] = {
    opName: evmAuthOp.name,
    args: evmAuthOp.args || [],
  };

  return await client.sendTransaction(gtx.serialize(transaction));
}

export async function sendUpdateAuthDescriptorAccountTx(
  tx: string,
  signers: string[],
  signatures: [{
    r: string,
    s: string,
    v: number,
  }],
  accountId: Buffer,
  descriptorId: Buffer,
) {
  const client = await createChromiaClient();
  const decodeTx = Buffer.from(tx, 'hex');  
  const transaction = gtx.deserialize(decodeTx);
  
  const sortedSigners = signers.map(getEvmAddress)
  const sortedSignatures = signatures.map(sig => ({
    r: Buffer.from(sig.r, 'hex'),
    s: Buffer.from(sig.s, 'hex'),
    v: sig.v,
  }));

  const evmSignaturesOperation = evmSignatures(sortedSigners, sortedSignatures);
  const evmAuthOp = evmAuth(accountId, descriptorId, sortedSignatures);

  transaction.operations[0] = {
    opName: evmSignaturesOperation.name,
    args: evmSignaturesOperation.args || [],
  };

  transaction.operations[1] = {
    opName: evmAuthOp.name,
    args: evmAuthOp.args || [],
  };

  return await client.sendTransaction(gtx.serialize(transaction));
}

// Message verification
async function getUpdateAccountMessage(
  signers: string[],
  signaturesRequired: number,
  accountId: Buffer,
  descriptorId: Buffer,
): Promise<string> {
  const client = await createChromiaClient();
  const connection = await createConnection(client);
  const authDataService = createAuthDataService(connection);

  const multiAD: any = createMultiSigAuthDescriptorRegistration(
    [AuthFlag.Account, AuthFlag.Transfer],
    [...signers.map(getEvmAddress)],
    signaturesRequired,
    null,
  );

  const operation = updateMainAuthDescriptor(multiAD)
  const messageTemplate = await authDataService.getAuthMessageTemplate(operation);
  const counter = await authDataService.getAuthDescriptorCounter(accountId, descriptorId);
  const blockchainRid = authDataService.getBlockchainRid();
  
  return messageTemplate
    .replace(
      ACCOUNT_ID_PLACEHOLDER,
      formatter.toString(formatter.ensureBuffer(accountId)),
    )
    .replace(BLOCKCHAIN_RID_PLACEHOLDER, formatter.toString(blockchainRid))
    .replace(NONCE_PLACEHOLDER, deriveNonce(blockchainRid, operation, counter || 0));
}

export async function verifyMessageSignature(
  signers: string[], 
  sig: {
    r: string,
    s: string,
    v: number,
  },
  pubKey: string,
  accountId: Buffer,
  descriptorId: Buffer,
) {
  const signature = {
    r: Buffer.from(sig.r, 'hex'),
    s: Buffer.from(sig.s, 'hex'),
    v: sig.v,
  }
  const message = await getUpdateAccountMessage(
    signers,
    2,
    accountId,
    descriptorId,
  )
  const signA = ft4SignatureToEthersSignature(signature);
  const signer = verifyMessage(message, signA);
  return signer === pubKey;
}