export class LoginResponse {
    message!: string;
    token!: string;
    username!: string;
    admin: boolean = false;
}