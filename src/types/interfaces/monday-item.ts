import { MondayColumn } from './monday-column';

export interface MondayItem {
  id: string;
  name: string;
  parentItemId?: string;
  columns: MondayColumn[];
}
