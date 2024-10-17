import { Admin, User } from ".prisma/client";
import { Request } from "express";
export interface ExtendedRequest extends Request {
  user?: User | null; // or any other type
  admin?: Admin | null;
}
