import { DataPrice } from '@prisma/client';
import { Context, Scenes } from 'telegraf';

export interface BotWizardSession extends Scenes.WizardSessionData {
  network?: string;
  planId?: string;
  awaitingPhone?: boolean;
  pendingPlan?: DataPrice;
}

export interface BotContext extends Scenes.WizardContext<BotWizardSession> {
  payload?: string;

  match?: RegExpMatchArray;
}
