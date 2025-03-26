export class SyncDataDto {
  path: string;        // path ที่จะยิง request ไป
  method: string;      // HTTP method (POST, GET, PUT, DELETE)
  statusCode: number;  // รหัสสถานะจากการ response
  payload: any;        // ข้อมูลที่ส่งไปใน request body (เป็น JSON)
}