export class RequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  isActive: boolean;
  permissions?: Array<{ permission: string; granted: boolean }>;
}
