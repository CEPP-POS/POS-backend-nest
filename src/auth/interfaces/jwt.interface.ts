export interface IJwtPayload {
  contact_info: string;
  email: string;
  exp?: number;
  iat?: number;
  owner_id: number;
  owner_name: string;
  roles: string[];
  sub: string;
}
