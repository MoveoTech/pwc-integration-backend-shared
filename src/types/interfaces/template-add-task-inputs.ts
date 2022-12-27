import { IInputs } from "./inputs";
import { settingsBoardIds } from "./settings-board-ids";

export interface TemplateAddTaskInputs extends IInputs {
    settingsBoardIds: settingsBoardIds[];
    templateItemId: number;
    boardId: number;
  }
  