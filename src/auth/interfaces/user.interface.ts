export interface UserPayload {
  owner_id: string;
  email: string;
  branch_id?: string;
  roles: string[];
}
