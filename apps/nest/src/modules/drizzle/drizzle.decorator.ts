import { Inject } from '@nestjs/common';
import { DRIZZLE_DEV } from './drizzle.constants.js';

export const InjectDrizzle = () => Inject(DRIZZLE_DEV);