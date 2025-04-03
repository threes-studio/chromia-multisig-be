import UserRepository from '@components/users/repository';
import { User } from '@core/models';
import { Passport } from 'passport';

import jwtStrategy from './strategies/jwt';

const passport = new Passport();

passport.use(jwtStrategy);

passport.serializeUser((user: User, done: Function) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  const user = await UserRepository.get(id);

  done(null, user);
});

export default passport;
