import { ReportData } from '../types/interfaces/report-data';

export class LoggerService {
  private static loggerInstance: LoggerService;

  public static getLogger() {
    if (this.loggerInstance) {
      return this.loggerInstance;
    }
    this.loggerInstance = new LoggerService();
    return this.loggerInstance;
  }

  public info(infoData: ReportData) {
    console.info(
      `${infoData.fileName} -> ${infoData.functionName} -> ${infoData.message}`,
      infoData?.data ? infoData.data : ''
    );
  }

  public error(errorData: ReportData) {
    console.error(
      `${errorData.fileName} -> ${errorData.functionName} -> ${errorData.message}`,
      errorData?.data ? errorData.data : ''
    );
  }
}
