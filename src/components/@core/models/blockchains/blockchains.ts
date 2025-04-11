interface Blockchain {
  readonly _id?: string;
  readonly id?: string;

  readonly name?: string;
  readonly rid?: string;
  readonly network?: string;
  readonly feeId?: string;
  readonly feeValue?: number;
  readonly feeSymbol?: string;
  readonly feeDecimals?: number;
  readonly isActive?: boolean;

  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export {
  Blockchain
};
