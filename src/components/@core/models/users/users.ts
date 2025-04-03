enum UserRole {
  Administrator = 'Administrator',
  User = 'User',
  Default = User,
}

interface User {
  readonly _id?: string;
  readonly id?: string;
  readonly displayName?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly pubKey?: string;
  readonly role?: UserRole;
  readonly isActive?: boolean;
  readonly isProtected?: boolean;
  readonly token?: string;
  readonly ip?: string;
  readonly imageUrl?: string;
  readonly lastSignedIn?: Date;
  readonly walletAddress?: string;

  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export {
  User,
  UserRole
};
