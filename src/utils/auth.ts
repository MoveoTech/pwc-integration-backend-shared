import * as jwt from 'jsonwebtoken';

export const verifyMondayAuthorization = async (authorization: string, key: string): Promise<any> => {
  return jwt.verify(authorization, key);
};
