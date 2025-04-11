import { validateBody } from '@utils/express';
import * as yup from 'yup';

const baseSchema = {
  name: yup.string().required(),
  description: yup.string().required(),
};
const validateCreate = validateBody(
  (v: any) => yup.object(baseSchema).noUnknown().validateSync(v),
);

const validateUpdate = validateBody(
  (v: any) => yup.object(baseSchema).noUnknown().validateSync(v),
);

export { validateCreate, validateUpdate };
