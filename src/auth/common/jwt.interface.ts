export interface IJwtPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
    owner_id: number;
    owner_name: string;
    contact_info: string;
}
