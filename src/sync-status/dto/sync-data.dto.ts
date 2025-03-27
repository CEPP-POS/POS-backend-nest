export class SyncDataDto {
  path: string; // URL ที่จะส่งไป
  method: string; // HTTP method (POST, GET, ฯลฯ)
  statusCode: number; // รหัสสถานะจากการ response
  payload: any; // ข้อมูลที่ต้องการส่งไปใน body ของ request
  headers: Record<string, string>; // ข้อมูล header ที่ต้องการส่งไป
}
