export interface UserPayload {
  owner_id: number;
  email: string;
  branch_id?: number;
  roles: string[];
}
